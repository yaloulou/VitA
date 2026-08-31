import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { RecordStatus } from '../../common/common.dto';

export type ReportingScheduleDocument = HydratedDocument<ReportingSchedule>;

@Schema({ timestamps: true })
export class ReportingSchedule {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Facility',
    required: true,
    index: true,
  })
  facilityId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Commodity',
    required: true,
    index: true,
  })
  commodityId: Types.ObjectId;

  @Prop({
    enum: ['daily', 'weekly', 'monthly'],
    required: true,
    default: 'weekly',
  })
  frequency: string;

  @Prop({ required: true, min: 0, max: 23, default: 17 })
  dueHour: number;

  @Prop({ required: true, min: 0, default: 24 })
  graceHours: number;

  @Prop({ enum: RecordStatus, default: RecordStatus.Active })
  status: RecordStatus;
}

export const ReportingScheduleSchema =
  SchemaFactory.createForClass(ReportingSchedule);
ReportingScheduleSchema.index(
  { facilityId: 1, commodityId: 1 },
  { unique: true },
);
