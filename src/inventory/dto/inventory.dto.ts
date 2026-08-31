import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RecordStatus } from '../../common/common.dto';
import { AlertStatus } from '../schemas/alert.schema';
import { MovementType } from '../schemas/stock-movement.schema';
import { ReportSource, ReportStatus } from '../schemas/stock-report.schema';

class SyncMetaDto {
  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  localId?: string;

  @IsOptional()
  @IsDateString()
  syncedAt?: string;
}

export class CreateStockReportDto {
  @IsMongoId()
  facilityId: string;

  @IsMongoId()
  healthZoneId: string;

  @IsMongoId()
  provinceId: string;

  @IsMongoId()
  commodityId: string;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  availableQty: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  receivedQty: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distributedQty: number;

  @IsBoolean()
  stockoutDeclared: boolean;

  @IsMongoId()
  reportedBy: string;

  @IsEnum(ReportSource)
  source: ReportSource;

  @IsOptional()
  @ValidateNested()
  @Type(() => SyncMetaDto)
  sync?: SyncMetaDto;

  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;
}

export class CreateStockMovementDto {
  @IsMongoId()
  facilityId: string;

  @IsMongoId()
  commodityId: string;

  @IsEnum(MovementType)
  type: MovementType;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity: number;

  @IsDateString()
  movementDate: string;

  @IsOptional()
  @IsMongoId()
  sourceReportId?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsMongoId()
  createdBy: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  localId?: string;
}

export class CreateStockThresholdDto {
  @IsMongoId()
  facilityId: string;

  @IsMongoId()
  commodityId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  criticalQty: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  warningDays: number;
}

export class CreateReportingScheduleDto {
  @IsMongoId()
  facilityId: string;

  @IsMongoId()
  commodityId: string;

  @IsEnum(['daily', 'weekly', 'monthly'])
  frequency: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(23)
  dueHour: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  graceHours: number;

  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;
}

export class ForecastRunDto {
  @IsOptional()
  @IsMongoId()
  facilityId?: string;

  @IsOptional()
  @IsMongoId()
  commodityId?: string;
}

export class UpdateAlertStatusDto {
  @IsEnum(AlertStatus)
  status: AlertStatus;
}

export class SyncBatchDto {
  @IsString()
  deviceId: string;

  @IsMongoId()
  userId: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  appVersion?: string;

  @IsOptional()
  @IsDateString()
  clientStartedAt?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStockReportDto)
  reports?: CreateStockReportDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStockMovementDto)
  movements?: CreateStockMovementDto[];
}

export class InventoryQueryDto {
  @IsOptional()
  @IsMongoId()
  provinceId?: string;

  @IsOptional()
  @IsMongoId()
  healthZoneId?: string;

  @IsOptional()
  @IsMongoId()
  facilityId?: string;

  @IsOptional()
  @IsMongoId()
  commodityId?: string;

  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
