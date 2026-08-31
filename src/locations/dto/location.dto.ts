import {
  IsArray,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsMongoId,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RecordStatus } from '../../common/common.dto';
import { FacilityType } from '../schemas/facility.schema';

class GeoDto {
  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;
}

export class CreateProvinceDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;
}

export class CreateHealthZoneDto {
  @IsMongoId()
  provinceId: string;

  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  supervisorUserIds?: string[];

  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;
}

export class CreateFacilityDto {
  @IsMongoId()
  provinceId: string;

  @IsMongoId()
  healthZoneId: string;

  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsEnum(FacilityType)
  type: FacilityType;

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoDto)
  geo?: GeoDto;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  defaultReporterIds?: string[];

  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;
}
