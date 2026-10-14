import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type IndicatorRevision = {
  version: number;
  values: Record<string, number>;
  status: string;
  changedBy: string;
  changedAt: Date;
  reason: string;
};

@Schema({ timestamps: true, collection: 'indicator_reports' })
export class IndicatorReport {
  @Prop({ required: true, unique: true }) clientId: string;
  @Prop({ required: true, index: true }) moduleId: string;
  @Prop({ required: true, index: true }) period: string;
  @Prop({ required: true }) scopeKey: string;
  @Prop({ index: true }) provinceId?: string;
  @Prop({ index: true }) healthZoneId?: string;
  @Prop({ index: true }) facilityId?: string;
  @Prop({ required: true }) scopeName: string;
  @Prop({ required: true, index: true }) reportedBy: string;
  @Prop({ required: true }) reporterName: string;
  @Prop({ type: Object, required: true }) values: Record<string, number>;
  @Prop({ default: 1 }) formVersion: number;
  @Prop({ default: 1 }) version: number;
  @Prop({
    default: 'draft',
    enum: [
      'draft',
      'submitted',
      'validated',
      'correction_requested',
      'rejected',
    ],
    index: true,
  })
  status: string;
  @Prop({ type: [Object], default: [] }) revisions: IndicatorRevision[];
  @Prop() reviewReason?: string;
  @Prop() reviewedBy?: string;
}
export const IndicatorReportSchema =
  SchemaFactory.createForClass(IndicatorReport);
IndicatorReportSchema.index(
  { moduleId: 1, period: 1, scopeKey: 1 },
  { unique: true },
);
