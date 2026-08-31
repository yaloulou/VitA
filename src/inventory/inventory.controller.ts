import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MongoIdParamDto } from '../common/common.dto';
import {
  CreateReportingScheduleDto,
  CreateStockMovementDto,
  CreateStockReportDto,
  CreateStockThresholdDto,
  ForecastRunDto,
  InventoryQueryDto,
  SyncBatchDto,
  UpdateAlertStatusDto,
} from './dto/inventory.dto';
import { InventoryService } from './inventory.service';
import { AlertStatus } from './schemas/alert.schema';

@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('stock-reports')
  createStockReport(@Body() dto: CreateStockReportDto) {
    return this.inventoryService.createStockReport(dto);
  }

  @Get('stock-reports')
  listStockReports(@Query() query: InventoryQueryDto) {
    return this.inventoryService.listStockReports(query);
  }

  @Post('stock-movements')
  createStockMovement(@Body() dto: CreateStockMovementDto) {
    return this.inventoryService.createStockMovement(dto);
  }

  @Get('stock-movements')
  listStockMovements(@Query() query: InventoryQueryDto) {
    return this.inventoryService.listStockMovements(query);
  }

  @Post('thresholds')
  upsertThreshold(@Body() dto: CreateStockThresholdDto) {
    return this.inventoryService.upsertThreshold(dto);
  }

  @Get('thresholds')
  listThresholds(@Query() query: InventoryQueryDto) {
    return this.inventoryService.listThresholds(query);
  }

  @Post('reporting-schedules')
  upsertReportingSchedule(@Body() dto: CreateReportingScheduleDto) {
    return this.inventoryService.upsertReportingSchedule(dto);
  }

  @Get('reporting-schedules')
  listReportingSchedules(@Query() query: InventoryQueryDto) {
    return this.inventoryService.listReportingSchedules(query);
  }

  @Post('forecasts/run')
  runForecasts(@Body() dto: ForecastRunDto) {
    return this.inventoryService.runForecasts(dto);
  }

  @Get('forecasts/latest')
  listLatestForecasts(@Query() query: InventoryQueryDto) {
    return this.inventoryService.listLatestForecasts(query);
  }

  @Post('alerts/evaluate')
  evaluateAlerts(@Query() query: InventoryQueryDto) {
    return this.inventoryService.evaluateAlerts(query);
  }

  @Get('alerts')
  listAlerts(@Query() query: InventoryQueryDto) {
    return this.inventoryService.listAlerts(query);
  }

  @Patch('alerts/:id')
  updateAlertStatus(
    @Param() params: MongoIdParamDto,
    @Body() dto: UpdateAlertStatusDto,
  ) {
    return this.inventoryService.updateAlertStatus(params.id, dto.status);
  }

  @Patch('alerts/:id/acknowledge')
  acknowledgeAlert(@Param() params: MongoIdParamDto) {
    return this.inventoryService.updateAlertStatus(
      params.id,
      AlertStatus.Acknowledged,
    );
  }

  @Patch('alerts/:id/resolve')
  resolveAlert(@Param() params: MongoIdParamDto) {
    return this.inventoryService.updateAlertStatus(
      params.id,
      AlertStatus.Resolved,
    );
  }

  @Post('sync/batches')
  syncBatch(@Body() dto: SyncBatchDto) {
    return this.inventoryService.syncBatch(dto);
  }

  @Get('dashboard/summary')
  dashboardSummary(@Query() query: InventoryQueryDto) {
    return this.inventoryService.dashboardSummary(query);
  }

  @Get('dashboard/facilities-risk')
  facilitiesRisk(@Query() query: InventoryQueryDto) {
    return this.inventoryService.facilitiesRisk(query);
  }
}
