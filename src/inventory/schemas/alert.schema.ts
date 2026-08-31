import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { RiskLevel } from './forecast.schema';

export enum AlertType {
  CriticalStock = 'critical_stock',
  PredictedStockout = 'predicted_stockout',
  MissingReport = 'missing_report',
}

export enum AlertStatus {
  Open = 'open',
  Sent = 'sent',
  Acknowledged = 'acknowledged',
  Resolved = 'resolved',
  Escalated = 'escalated',
}

export type AlertDocument = HydratedDocument<Alert>;

@Schema({ _id: false })
class AlertRecipient {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop()
  channel?: string;

  @Prop()
  status?: string;
}

@Schema({ _id: false })
class AlertTrigger {
  @Prop({ required: true })
  kind: string;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  refId?: Types.ObjectId;
}

@Schema({ timestamps: true })
export class Alert {
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

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Commodity', index: true })
  commodityId?: Types.ObjectId;

  @Prop({ enum: AlertType, required: true, index: true })
  type: AlertType;

  @Prop({ enum: RiskLevel, required: true, index: true })
  level: RiskLevel;

  @Prop({ required: true })
  reason: string;

  @Prop({ enum: AlertStatus, default: AlertStatus.Open, index: true })
  status: AlertStatus;

  @Prop({ type: [AlertRecipient], default: [] })
  recipients: AlertRecipient[];

  @Prop({ type: AlertTrigger, required: true })
  triggeredBy: AlertTrigger;

  @Prop()
  acknowledgedAt?: Date;

  @Prop()
  resolvedAt?: Date;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);
