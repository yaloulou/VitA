import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type StockThresholdDocument = HydratedDocument<StockThreshold>;

@Schema({ timestamps: true })
export class StockThreshold {
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
  criticalQty: number;

  @Prop({ required: true, min: 1, default: 3 })
  warningDays: number;
}

export const StockThresholdSchema =
  SchemaFactory.createForClass(StockThreshold);
StockThresholdSchema.index({ facilityId: 1, commodityId: 1 }, { unique: true });
