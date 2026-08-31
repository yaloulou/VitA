import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';

export enum RecordStatus {
  Active = 'active',
  Inactive = 'inactive',
}

export class StatusDto {
  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;
}

export class MongoIdParamDto {
  @IsMongoId()
  id: string;
}

export class ScopedQueryDto {
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
  @IsString()
  status?: string;
}
