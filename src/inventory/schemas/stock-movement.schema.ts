import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export enum MovementType {
  Received = 'received',
  Distributed = 'distributed',
  Adjustment = 'adjustment',
  Stockout = 'stockout',
}

export type StockMovementDocument = HydratedDocument<StockMovement>;

@Schema({ timestamps: true })
export class StockMovement {
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

  @Prop({ enum: MovementType, required: true })
  type: MovementType;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ required: true, index: true })
  movementDate: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'StockReport' })
  sourceReportId?: Types.ObjectId;

  @Prop({ trim: true })
  reason?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ index: true })
  deviceId?: string;

  @Prop({ index: true })
  localId?: string;
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);
StockMovementSchema.index(
  { deviceId: 1, localId: 1 },
  { unique: true, sparse: true },
);
