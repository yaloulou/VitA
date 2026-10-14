import {
  IsIn,
  IsInt,
  IsMongoId,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class IndicatorQueryDto {
  @IsOptional() @IsString() moduleId?: string;
  @IsOptional() @Matches(/^\d{4}-(0[1-9]|1[0-2])$/) period?: string;
  @IsOptional() @IsMongoId() provinceId?: string;
  @IsOptional() @IsMongoId() healthZoneId?: string;
  @IsOptional() @IsMongoId() facilityId?: string;
  @IsOptional()
  @IsIn(['draft', 'submitted', 'validated', 'correction_requested', 'rejected'])
  status?: string;
}

export class CreateIndicatorDto {
  @IsMongoId()
  reportedBy: string;
  @IsUUID() clientId: string;
  @IsString() moduleId: string;
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/) period: string;
  @IsOptional() @IsMongoId() provinceId?: string;
  @IsOptional() @IsMongoId() healthZoneId?: string;
  @IsOptional() @IsMongoId() facilityId?: string;
  @IsObject() values: Record<string, number>;
  @IsOptional() @IsIn(['draft', 'submitted']) status?: string;
}

export class UpdateIndicatorDto {
  @IsInt() @Min(1) version: number;
  @IsObject() values: Record<string, number>;
  @IsString() @MinLength(3) @MaxLength(1000) reason: string;
  @IsIn(['draft', 'submitted']) status: 'draft' | 'submitted';
}

export class ReviewIndicatorDto {
  @IsInt() @Min(1) version: number;
  @IsIn(['validated', 'correction_requested', 'rejected']) decision:
    'validated' | 'correction_requested' | 'rejected';
  @IsString() @MinLength(3) @MaxLength(1000) reason: string;
}
