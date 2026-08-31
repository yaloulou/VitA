import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type SyncBatchDocument = HydratedDocument<SyncBatch>;

@Schema({ _id: false })
class SyncError {
  @Prop()
  localId?: string;

  @Prop({ required: true })
  message: string;
}

@Schema({ timestamps: true })
export class SyncBatch {
  @Prop({ required: true, index: true })
  deviceId: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  itemsCount: number;

  @Prop({ required: true, min: 0, default: 0 })
  acceptedCount: number;

  @Prop({ required: true, min: 0, default: 0 })
  rejectedCount: number;

  @Prop()
  clientStartedAt?: Date;

  @Prop({ required: true, default: () => new Date() })
  syncedAt: Date;

  @Prop({ type: [SyncError], default: [] })
  errors: SyncError[];
}

export const SyncBatchSchema = SchemaFactory.createForClass(SyncBatch);
