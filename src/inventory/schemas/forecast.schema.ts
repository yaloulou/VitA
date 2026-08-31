import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export enum RiskLevel {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export type ForecastDocument = HydratedDocument<Forecast>;

@Schema({ timestamps: true })
export class Forecast {
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

  @Prop({ required: true, min: 0 })
  availableQty: number;

  @Prop({ required: true, min: 0 })
  avgDailyConsumption: number;

  @Prop({ required: true, min: 0 })
  daysRemaining: number;

  @Prop({ enum: RiskLevel, required: true, index: true })
  riskLevel: RiskLevel;

  @Prop({ enum: ['rule_based', 'ml_model'], default: 'rule_based' })
  method: string;

  @Prop({ required: true })
  explanation: string;

  @Prop({ required: true, default: () => new Date(), index: true })
  generatedAt: Date;
}

export const ForecastSchema = SchemaFactory.createForClass(Forecast);
