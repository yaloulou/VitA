import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { RecordStatus } from '../../common/common.dto';
import { randomUUID } from 'node:crypto';

export type ProvinceDocument = HydratedDocument<Province>;

@Schema({ timestamps: true })
export class Province {
  @Prop({
    required: true,
    trim: true,
    uppercase: true,
    unique: true,
    default: () => randomUUID(),
  })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ enum: RecordStatus, default: RecordStatus.Active })
  status: RecordStatus;
}

export const ProvinceSchema = SchemaFactory.createForClass(Province);
