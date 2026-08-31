import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RecordStatus } from '../../common/common.dto';

export class CreateCommodityDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  unit: string;

  @IsOptional()
  @IsEnum(RecordStatus)
  status?: RecordStatus;
}
