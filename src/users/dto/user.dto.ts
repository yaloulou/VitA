import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RecordStatus } from '../../common/common.dto';
import { UserRole } from '../schemas/user.schema';

class UserScopeDto {
  @IsOptional()
  @IsMongoId()
  provinceId?: string;

  @IsOptional()
  @IsMongoId()
  healthZoneId?: string;

  @IsOptional()
  @IsMongoId()
  facilityId?: string;
}

class UserAuthDto {
  @IsOptional()
  @IsString()
  passwordHash?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

class NotificationPrefsDto {
  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  preferredChannel?: string;
}

export class CreateUserDto {
  @IsString()
  fullName: string;

  @IsString()
  phone: string;

  @IsEnum(UserRole)
  role: UserRole;

  @ValidateNested()
  @Type(() => UserScopeDto)
  scope: UserScopeDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserAuthDto)
  auth?: UserAuthDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationPrefsDto)
  notificationPrefs?: NotificationPrefsDto;

  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;
}
