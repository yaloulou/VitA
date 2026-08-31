import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type DeviceDocument = HydratedDocument<Device>;

@Schema({ timestamps: true })
export class Device {
  @Prop({ required: true, unique: true, trim: true })
  deviceId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop()
  platform?: string;

  @Prop()
  appVersion?: string;

  @Prop()
  lastSyncedAt?: Date;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
