import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export enum ReportSource {
  Mobile = 'mobile',
  Web = 'web',
  Import = 'import',
}

export enum ReportStatus {
  Draft = 'draft',
  Submitted = 'submitted',
  Corrected = 'corrected',
  Rejected = 'rejected',
}

export type StockReportDocument = HydratedDocument<StockReport>;

@Schema({ _id: false })
class SyncMeta {
  @Prop({ index: true })
  deviceId?: string;

  @Prop({ index: true })
  localId?: string;

  @Prop()
  syncedAt?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SyncBatch' })
  batchId?: Types.ObjectId;
}

@Schema({ timestamps: true })
export class StockReport {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Facility',
    required: true,
    index: true,
  })
  facilityId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'HealthZone',
    required: true,
    index: true,
  })
  healthZoneId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Province',
    required: true,
    index: true,
  })
  provinceId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Commodity',
    required: true,
    index: true,
  })
  commodityId: Types.ObjectId;

  @Prop({ required: true, index: true })
  periodStart: Date;

  @Prop({ required: true, index: true })
  periodEnd: Date;

  @Prop({ required: true, min: 0 })
  availableQty: number;

  @Prop({ required: true, min: 0 })
  receivedQty: number;

  @Prop({ required: true, min: 0 })
  distributedQty: number;

  @Prop({ required: true, default: false })
  stockoutDeclared: boolean;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  reportedBy: Types.ObjectId;

  @Prop({ enum: ReportSource, required: true })
  source: ReportSource;

  @Prop({ type: SyncMeta })
  sync?: SyncMeta;

  @Prop({ enum: ReportStatus, default: ReportStatus.Submitted })
  status: ReportStatus;
}

export const StockReportSchema = SchemaFactory.createForClass(StockReport);
StockReportSchema.index(
  { 'sync.deviceId': 1, 'sync.localId': 1 },
  { unique: true, sparse: true },
);
