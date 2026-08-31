import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecordStatus } from '../common/common.dto';
import { Facility } from '../locations/schemas/facility.schema';
import {
  CreateReportingScheduleDto,
  CreateStockMovementDto,
  CreateStockReportDto,
  CreateStockThresholdDto,
  ForecastRunDto,
  InventoryQueryDto,
  SyncBatchDto,
} from './dto/inventory.dto';
import { Alert, AlertStatus, AlertType } from './schemas/alert.schema';
import { Device } from './schemas/device.schema';
import { Forecast, RiskLevel } from './schemas/forecast.schema';
import { ReportingSchedule } from './schemas/reporting-schedule.schema';
import { StockMovement } from './schemas/stock-movement.schema';
import { StockReport } from './schemas/stock-report.schema';
import { StockThreshold } from './schemas/stock-threshold.schema';
import { SyncBatch } from './schemas/sync-batch.schema';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(StockReport.name)
    private readonly stockReportModel: Model<StockReport>,
    @InjectModel(StockMovement.name)
    private readonly stockMovementModel: Model<StockMovement>,
    @InjectModel(StockThreshold.name)
    private readonly stockThresholdModel: Model<StockThreshold>,
    @InjectModel(Forecast.name) private readonly forecastModel: Model<Forecast>,
    @InjectModel(Alert.name) private readonly alertModel: Model<Alert>,
    @InjectModel(ReportingSchedule.name)
    private readonly reportingScheduleModel: Model<ReportingSchedule>,
    @InjectModel(Device.name) private readonly deviceModel: Model<Device>,
    @InjectModel(SyncBatch.name)
    private readonly syncBatchModel: Model<SyncBatch>,
    @InjectModel(Facility.name) private readonly facilityModel: Model<Facility>,
  ) {}

  createStockReport(dto: CreateStockReportDto) {
    return this.stockReportModel.create(this.withDates(dto));
  }

  listStockReports(query: InventoryQueryDto) {
    return this.stockReportModel
      .find(this.inventoryFilter(query))
      .populate('facilityId', 'code name')
      .populate('commodityId', 'code name unit')
      .sort({ periodEnd: -1 });
  }

  createStockMovement(dto: CreateStockMovementDto) {
    return this.stockMovementModel.create({
      ...dto,
      movementDate: new Date(dto.movementDate),
    });
  }

  listStockMovements(query: InventoryQueryDto) {
    return this.stockMovementModel
      .find(this.inventoryFilter(query))
      .populate('facilityId', 'code name')
      .populate('commodityId', 'code name unit')
      .sort({ movementDate: -1 });
  }

  upsertThreshold(dto: CreateStockThresholdDto) {
    return this.stockThresholdModel.findOneAndUpdate(
      { facilityId: dto.facilityId, commodityId: dto.commodityId },
      dto,
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }

  listThresholds(query: InventoryQueryDto) {
    return this.stockThresholdModel
      .find(this.inventoryFilter(query))
      .populate('facilityId', 'code name')
      .populate('commodityId', 'code name unit')
      .sort({ facilityId: 1 });
  }

  upsertReportingSchedule(dto: CreateReportingScheduleDto) {
    return this.reportingScheduleModel.findOneAndUpdate(
      { facilityId: dto.facilityId, commodityId: dto.commodityId },
      dto,
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  }

  listReportingSchedules(query: InventoryQueryDto) {
    return this.reportingScheduleModel
      .find(this.inventoryFilter(query))
      .populate('facilityId', 'code name')
      .populate('commodityId', 'code name unit')
      .sort({ facilityId: 1 });
  }

  async runForecasts(dto: ForecastRunDto) {
    const filter = this.inventoryFilter(dto);
    const latestReports = await this.stockReportModel
      .find(filter)
      .sort({ periodEnd: -1 })
      .lean();
    const seen = new Set<string>();
    const created: any[] = [];

    for (const report of latestReports) {
      const key = `${report.facilityId}:${report.commodityId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const history = await this.stockReportModel
        .find({
          facilityId: report.facilityId,
          commodityId: report.commodityId,
          status: { $ne: 'rejected' as any },
        })
        .sort({ periodEnd: -1 })
        .limit(5)
        .lean();

      const avgDailyConsumption = this.averageDailyConsumption(history);
      const daysRemaining =
        avgDailyConsumption > 0
          ? report.availableQty / avgDailyConsumption
          : report.availableQty > 0
            ? 9999
            : 0;
      const threshold = await this.stockThresholdModel
        .findOne({
          facilityId: report.facilityId,
          commodityId: report.commodityId,
        })
        .lean();
      const riskLevel = this.riskLevel(
        report.availableQty,
        daysRemaining,
        threshold?.criticalQty ?? 0,
        threshold?.warningDays ?? 3,
      );

      created.push(
        await this.forecastModel.create({
          facilityId: report.facilityId,
          commodityId: report.commodityId,
          availableQty: report.availableQty,
          avgDailyConsumption: Number(avgDailyConsumption.toFixed(2)),
          daysRemaining: Number(daysRemaining.toFixed(1)),
          riskLevel,
          method: 'rule_based',
          explanation: this.forecastExplanation(riskLevel, daysRemaining),
          generatedAt: new Date(),
        }),
      );
    }

    return { count: created.length, forecasts: created };
  }

  listLatestForecasts(query: InventoryQueryDto) {
    return this.forecastModel
      .find(this.inventoryFilter(query))
      .populate('facilityId', 'code name')
      .populate('commodityId', 'code name unit')
      .sort({ generatedAt: -1 })
      .limit(100);
  }

  async evaluateAlerts(query: InventoryQueryDto) {
    const forecastResult = await this.runForecasts(query);
    const created: any[] = [];

    for (const forecast of forecastResult.forecasts) {
      if (![RiskLevel.High, RiskLevel.Critical].includes(forecast.riskLevel)) {
        continue;
      }

      const facility = await this.facilityModel
        .findById(forecast.facilityId)
        .lean();
      if (!facility) continue;

      const type =
        forecast.riskLevel === RiskLevel.Critical
          ? AlertType.CriticalStock
          : AlertType.PredictedStockout;

      const existing = await this.alertModel.findOne({
        facilityId: forecast.facilityId,
        commodityId: forecast.commodityId,
        type,
        status: {
          $in: [AlertStatus.Open, AlertStatus.Sent, AlertStatus.Escalated],
        },
      });
      if (existing) continue;

      created.push(
        await this.alertModel.create({
          facilityId: forecast.facilityId,
          healthZoneId: facility.healthZoneId,
          provinceId: facility.provinceId,
          commodityId: forecast.commodityId,
          type,
          level: forecast.riskLevel,
          reason: forecast.explanation,
          recipients: [],
          triggeredBy: { kind: 'forecast', refId: forecast._id },
        }),
      );
    }

    const missingReports = await this.evaluateMissingReportAlerts();
    return {
      forecastAlertsCreated: created.length,
      missingReportAlertsCreated: missingReports.length,
      alerts: [...created, ...missingReports],
    };
  }

  listAlerts(query: InventoryQueryDto) {
    return this.alertModel
      .find(this.inventoryFilter(query))
      .populate('facilityId', 'code name')
      .populate('commodityId', 'code name unit')
      .sort({ createdAt: -1 });
  }

  async updateAlertStatus(id: string, status: AlertStatus) {
    const patch: Partial<Alert> = { status };
    if (status === AlertStatus.Acknowledged) patch.acknowledgedAt = new Date();
    if (status === AlertStatus.Resolved) patch.resolvedAt = new Date();

    const alert = await this.alertModel.findByIdAndUpdate(id, patch, {
      new: true,
    });
    if (!alert) throw new NotFoundException('Alert not found');
    return alert;
  }

  async syncBatch(dto: SyncBatchDto) {
    await this.deviceModel.findOneAndUpdate(
      { deviceId: dto.deviceId },
      {
        deviceId: dto.deviceId,
        userId: dto.userId,
        platform: dto.platform,
        appVersion: dto.appVersion,
        lastSyncedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    const itemsCount =
      (dto.reports?.length ?? 0) + (dto.movements?.length ?? 0);
    const batch = await this.syncBatchModel.create({
      deviceId: dto.deviceId,
      userId: dto.userId,
      itemsCount,
      acceptedCount: 0,
      rejectedCount: 0,
      clientStartedAt: dto.clientStartedAt
        ? new Date(dto.clientStartedAt)
        : undefined,
      syncedAt: new Date(),
      errors: [],
    });

    let acceptedCount = 0;
    const errors: { localId?: string; message: string }[] = [];

    for (const report of dto.reports ?? []) {
      try {
        await this.stockReportModel.create({
          ...this.withDates(report),
          sync: {
            ...report.sync,
            deviceId: report.sync?.deviceId ?? dto.deviceId,
            syncedAt: new Date(),
            batchId: batch._id,
          },
        });
        acceptedCount += 1;
      } catch (error) {
        errors.push({
          localId: report.sync?.localId,
          message: this.duplicateMessage(error, 'report'),
        });
      }
    }

    for (const movement of dto.movements ?? []) {
      try {
        await this.stockMovementModel.create({
          ...movement,
          deviceId: movement.deviceId ?? dto.deviceId,
          movementDate: new Date(movement.movementDate),
        });
        acceptedCount += 1;
      } catch (error) {
        errors.push({
          localId: movement.localId,
          message: this.duplicateMessage(error, 'movement'),
        });
      }
    }

    return this.syncBatchModel.findByIdAndUpdate(
      batch._id,
      {
        acceptedCount,
        rejectedCount: errors.length,
        errors,
      },
      { new: true },
    );
  }

  async dashboardSummary(query: InventoryQueryDto) {
    const filter = this.inventoryFilter(query);
    const [facilitiesCount, openAlertsCount, latestForecasts] =
      await Promise.all([
        this.facilityModel.countDocuments(
          query.healthZoneId || query.provinceId
            ? this.inventoryFilter(query)
            : {},
        ),
        this.alertModel.countDocuments({
          ...filter,
          status: {
            $in: [AlertStatus.Open, AlertStatus.Sent, AlertStatus.Escalated],
          },
        }),
        this.forecastModel
          .find(filter)
          .sort({ generatedAt: -1 })
          .limit(100)
          .lean(),
      ]);

    const riskCounts = latestForecasts.reduce<Record<string, number>>(
      (acc, forecast) => {
        acc[forecast.riskLevel] = (acc[forecast.riskLevel] ?? 0) + 1;
        return acc;
      },
      {},
    );

    return {
      facilitiesCount,
      openAlertsCount,
      riskCounts,
      generatedAt: new Date().toISOString(),
    };
  }

  facilitiesRisk(query: InventoryQueryDto) {
    return this.forecastModel
      .find(this.inventoryFilter(query))
      .populate('facilityId', 'code name healthZoneId provinceId')
      .populate('commodityId', 'code name unit')
      .sort({ riskLevel: 1, daysRemaining: 1, generatedAt: -1 })
      .limit(100);
  }

  private async evaluateMissingReportAlerts() {
    const schedules = await this.reportingScheduleModel
      .find({ status: RecordStatus.Active })
      .lean();
    const created: any[] = [];
    const now = Date.now();

    for (const schedule of schedules) {
      const latestReport = await this.stockReportModel
        .findOne({
          facilityId: schedule.facilityId,
          commodityId: schedule.commodityId,
        })
        .sort({ periodEnd: -1 })
        .lean();
      const dueAt = this.nextExpectedReportDueAt(
        latestReport?.periodEnd,
        schedule.frequency,
        schedule.dueHour,
        schedule.graceHours,
      );
      if (dueAt.getTime() > now) continue;

      const facility = await this.facilityModel
        .findById(schedule.facilityId)
        .lean();
      if (!facility) continue;

      const existing = await this.alertModel.findOne({
        facilityId: schedule.facilityId,
        commodityId: schedule.commodityId,
        type: AlertType.MissingReport,
        status: {
          $in: [AlertStatus.Open, AlertStatus.Sent, AlertStatus.Escalated],
        },
      });
      if (existing) continue;

      created.push(
        await this.alertModel.create({
          facilityId: schedule.facilityId,
          healthZoneId: facility.healthZoneId,
          provinceId: facility.provinceId,
          commodityId: schedule.commodityId,
          type: AlertType.MissingReport,
          level: RiskLevel.High,
          reason: `Aucun rapport recu avant l'echeance du ${dueAt.toISOString()}.`,
          recipients: [],
          triggeredBy: { kind: 'reporting_schedule', refId: schedule._id },
        }),
      );
    }

    return created;
  }

  private inventoryFilter(query: InventoryQueryDto | ForecastRunDto) {
    return Object.fromEntries(
      Object.entries(query).filter(([, value]) => value !== undefined),
    ) as Record<string, unknown>;
  }

  private withDates(dto: CreateStockReportDto) {
    return {
      ...dto,
      periodStart: new Date(dto.periodStart),
      periodEnd: new Date(dto.periodEnd),
      sync: dto.sync
        ? {
            ...dto.sync,
            syncedAt: dto.sync.syncedAt
              ? new Date(dto.sync.syncedAt)
              : undefined,
          }
        : undefined,
    };
  }

  private averageDailyConsumption(reports: StockReport[]) {
    const totals = reports.reduce(
      (acc, report) => {
        const days = Math.max(
          1,
          Math.ceil(
            (new Date(report.periodEnd).getTime() -
              new Date(report.periodStart).getTime()) /
              86_400_000,
          ),
        );
        acc.quantity += report.distributedQty;
        acc.days += days;
        return acc;
      },
      { quantity: 0, days: 0 },
    );

    return totals.days > 0 ? totals.quantity / totals.days : 0;
  }

  private riskLevel(
    availableQty: number,
    daysRemaining: number,
    criticalQty: number,
    warningDays: number,
  ) {
    if (availableQty <= criticalQty || daysRemaining <= 1)
      return RiskLevel.Critical;
    if (daysRemaining <= warningDays) return RiskLevel.High;
    if (daysRemaining <= warningDays * 2) return RiskLevel.Medium;
    return RiskLevel.Low;
  }

  private forecastExplanation(riskLevel: RiskLevel, daysRemaining: number) {
    if (riskLevel === RiskLevel.Critical) {
      return `Stock critique: environ ${daysRemaining.toFixed(1)} jour(s) restant(s).`;
    }
    if (riskLevel === RiskLevel.High) {
      return `Risque eleve de rupture: environ ${daysRemaining.toFixed(1)} jour(s) restant(s).`;
    }
    return `Stock estime suffisant: environ ${daysRemaining.toFixed(1)} jour(s) restant(s).`;
  }

  private nextExpectedReportDueAt(
    latestPeriodEnd: Date | undefined,
    frequency: string,
    dueHour: number,
    graceHours: number,
  ) {
    const base = latestPeriodEnd ? new Date(latestPeriodEnd) : new Date(0);
    const dueAt = new Date(base);
    const daysByFrequency: Record<string, number> = {
      daily: 1,
      weekly: 7,
      monthly: 30,
    };
    dueAt.setDate(dueAt.getDate() + (daysByFrequency[frequency] ?? 7));
    dueAt.setHours(dueHour + graceHours, 0, 0, 0);
    return dueAt;
  }

  private duplicateMessage(error: unknown, entity: string) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    ) {
      return `Duplicate ${entity} ignored during sync.`;
    }
    return error instanceof Error ? error.message : `Unable to sync ${entity}.`;
  }
}
