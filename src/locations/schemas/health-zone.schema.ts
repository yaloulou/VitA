import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { RecordStatus } from '../../common/common.dto';

export type HealthZoneDocument = HydratedDocument<HealthZone>;

@Schema({ timestamps: true })
export class HealthZone {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Province',
    required: true,
    index: true,
  })
  provinceId: Types.ObjectId;

  @Prop({ required: true, trim: true, uppercase: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'User', default: [] })
  supervisorUserIds: Types.ObjectId[];

  @Prop({ enum: RecordStatus, default: RecordStatus.Active })
  status: RecordStatus;
}

export const HealthZoneSchema = SchemaFactory.createForClass(HealthZone);
HealthZoneSchema.index({ provinceId: 1, code: 1 }, { unique: true });
