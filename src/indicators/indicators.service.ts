import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import catalog from './catalog.json';
import { IndicatorReport } from './indicator.schema';
import {
  CreateIndicatorDto,
  IndicatorQueryDto,
  ReviewIndicatorDto,
  UpdateIndicatorDto,
} from './indicator.dto';
import { UsersService } from '../users/users.service';
import { LocationsService } from '../locations/locations.service';
import { User, UserRole } from '../users/schemas/user.schema';

type Scope = {
  provinceId?: string;
  healthZoneId?: string;
  facilityId?: string;
};
export const indicatorReviewRoles = [
  UserRole.ZoneDoctor,
  UserRole.Supervisor,
  UserRole.ProvinceAdmin,
  UserRole.NationalAdmin,
];

@Injectable()
export class IndicatorsService implements OnModuleInit {
  constructor(
    @InjectModel(IndicatorReport.name)
    private readonly reports: Model<IndicatorReport>,
    private readonly users: UsersService,
    private readonly locations: LocationsService,
  ) {}

  async onModuleInit() {
    // These new indexes are required for idempotent offline sync even with autoIndex disabled.
    await this.reports.createIndexes();
  }

  catalog() {
    return catalog;
  }

  validateValues(moduleId: string, values: Record<string, number>) {
    const module = catalog.find((item) => item.id === moduleId);
    if (!module) throw new BadRequestException('Module inconnu');
    const allowed = new Set(module.fields.map((field) => field.key));
    if (!Object.keys(values).length)
      throw new BadRequestException('Renseignez au moins un indicateur');
    for (const [key, value] of Object.entries(values)) {
      if (!allowed.has(key) || !Number.isSafeInteger(value) || value < 0) {
        throw new BadRequestException(
          `Indicateur invalide: ${key}. Un entier positif ou nul est requis.`,
        );
      }
    }
  }

  private accessScope(user: User): Scope {
    if (user.role === UserRole.NationalAdmin) return {};
    const scope = user.scope;
    if (scope.facilityId) return { facilityId: String(scope.facilityId) };
    if (scope.healthZoneId) return { healthZoneId: String(scope.healthZoneId) };
    if (scope.provinceId) return { provinceId: String(scope.provinceId) };
    throw new ForbiddenException('Affectation requise pour ce compte');
  }

  private checkScope(user: User, target: Scope) {
    for (const [key, value] of Object.entries(this.accessScope(user))) {
      if (target[key as keyof Scope] !== value)
        throw new ForbiddenException('Rapport hors de votre perimetre');
    }
  }

  private async canonicalScope(dto: Scope) {
    if (dto.facilityId) {
      const facility = await this.locations.getFacility(dto.facilityId);
      const scope = {
        facilityId: dto.facilityId,
        healthZoneId: String(facility.healthZoneId),
        provinceId: String(facility.provinceId),
      };
      if (
        (dto.healthZoneId && dto.healthZoneId !== scope.healthZoneId) ||
        (dto.provinceId && dto.provinceId !== scope.provinceId)
      )
        throw new BadRequestException('Affectation incoherente');
      return {
        ...scope,
        scopeKey: `facility:${dto.facilityId}`,
        scopeName: facility.name,
      };
    }
    if (dto.healthZoneId) {
      const zone = await this.locations.getHealthZone(dto.healthZoneId);
      const provinceId = String(zone.provinceId);
      if (dto.provinceId && dto.provinceId !== provinceId)
        throw new BadRequestException('Province incoherente');
      return {
        healthZoneId: dto.healthZoneId,
        provinceId,
        scopeKey: `zone:${dto.healthZoneId}`,
        scopeName: zone.name,
      };
    }
    if (dto.provinceId) {
      const province = await this.locations.getProvince(dto.provinceId);
      return {
        provinceId: dto.provinceId,
        scopeKey: `province:${dto.provinceId}`,
        scopeName: province.name,
      };
    }
    return { scopeKey: 'national', scopeName: 'National' };
  }

  async create(userId: string, dto: CreateIndicatorDto) {
    if (dto.reportedBy !== userId)
      throw new ForbiddenException(
        'Auteur incompatible avec le compte connecte',
      );
    const user = await this.users.get(userId);
    this.validateValues(dto.moduleId, dto.values);
    const scope = await this.canonicalScope(dto);
    this.checkScope(user, scope);
    const existing = await this.reports.findOne({ clientId: dto.clientId });
    if (existing) {
      if (existing.reportedBy !== userId)
        throw new ConflictException(
          'Identifiant de synchronisation deja utilise',
        );
      return existing;
    }
    try {
      return await this.reports.create({
        ...dto,
        ...scope,
        reportedBy: userId,
        reporterName: user.fullName,
        status: dto.status ?? 'draft',
      });
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      const retry = await this.reports.findOne({
        clientId: dto.clientId,
        reportedBy: userId,
      });
      if (retry) return retry;
      throw new ConflictException(
        'Un rapport existe deja pour ce module, ce mois et ce perimetre',
      );
    }
  }

  async list(userId: string, query: IndicatorQueryDto) {
    const user = await this.users.get(userId);
    const filter = Object.fromEntries(
      Object.entries(query).filter(([, value]) => value !== undefined),
    );
    return this.reports
      .find({ $and: [filter, this.accessScope(user)] })
      .select('-revisions')
      .sort({ period: -1, createdAt: -1 });
  }

  async get(userId: string, id: string) {
    const user = await this.users.get(userId);
    const report = await this.reports.findById(id);
    if (!report) throw new NotFoundException('Rapport introuvable');
    this.checkScope(user, report);
    return report;
  }

  async update(userId: string, id: string, dto: UpdateIndicatorDto) {
    const report = await this.get(userId, id);
    if (report.reportedBy !== userId)
      throw new ForbiddenException('Seul l auteur peut corriger ce rapport');
    this.validateValues(report.moduleId, dto.values);
    const lastRevision = report.revisions.at(-1);
    if (
      report.version === dto.version + 1 &&
      lastRevision?.version === dto.version &&
      lastRevision.changedBy === userId &&
      report.status === dto.status &&
      Object.keys(report.values).length === Object.keys(dto.values).length &&
      Object.entries(dto.values).every(
        ([key, value]) => report.values[key] === value,
      )
    )
      return report;
    if (!['draft', 'correction_requested'].includes(report.status))
      throw new ConflictException(
        'Une demande de correction est necessaire avant modification',
      );
    return this.change(id, report, userId, dto.version, dto.reason, {
      values: dto.values,
      status: dto.status,
      reviewReason: '',
    });
  }

  async review(userId: string, id: string, dto: ReviewIndicatorDto) {
    const user = await this.users.get(userId);
    if (!indicatorReviewRoles.includes(user.role))
      throw new ForbiddenException('Profil superviseur requis');
    const report = await this.get(userId, id);
    if (report.reportedBy === userId)
      throw new ForbiddenException(
        'Vous ne pouvez pas valider votre propre rapport',
      );
    if (
      report.status !== 'submitted' &&
      !(
        report.status === 'validated' && dto.decision === 'correction_requested'
      )
    )
      throw new ConflictException(
        'Ce rapport ne peut pas etre revise dans son etat actuel',
      );
    return this.change(id, report, userId, dto.version, dto.reason, {
      status: dto.decision,
      reviewReason: dto.reason,
      reviewedBy: userId,
    });
  }

  private async change(
    id: string,
    report: IndicatorReport,
    actor: string,
    version: number,
    reason: string,
    fields: Partial<IndicatorReport>,
  ) {
    const updated = await this.reports.findOneAndUpdate(
      { _id: id, version, status: report.status },
      {
        $set: fields,
        $inc: { version: 1 },
        $push: {
          revisions: {
            version: report.version,
            values: report.values,
            status: report.status,
            changedBy: actor,
            changedAt: new Date(),
            reason,
          },
        },
      },
      { new: true, runValidators: true },
    );
    if (!updated)
      throw new ConflictException(
        'Rapport modifie ailleurs. Rechargez la derniere version.',
      );
    return updated;
  }
}
