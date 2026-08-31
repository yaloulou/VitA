import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { RecordStatus } from '../../common/common.dto';

export type CommodityDocument = HydratedDocument<Commodity>;

@Schema({ timestamps: true })
export class Commodity {
  @Prop({ required: true, trim: true, uppercase: true, unique: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, default: 'capsule' })
  unit: string;

  @Prop({ enum: RecordStatus, default: RecordStatus.Active })
  status: RecordStatus;
}

export const CommoditySchema = SchemaFactory.createForClass(Commodity);
