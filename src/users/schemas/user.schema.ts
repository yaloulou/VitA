import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { RecordStatus } from '../../common/common.dto';

export enum UserRole {
  Relay = 'relay',
  Cac = 'cac',
  Nurse = 'nurse',
  ZoneDoctor = 'zoneDoctor',
  Supervisor = 'supervisor',
  ProvinceAdmin = 'provinceAdmin',
  NationalAdmin = 'nationalAdmin',
}

export type UserDocument = HydratedDocument<User>;

@Schema({ _id: false })
class UserScope {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Province' })
  provinceId?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'HealthZone' })
  healthZoneId?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Facility' })
  facilityId?: Types.ObjectId;
}

@Schema({ _id: false })
class UserAuth {
  @Prop({ select: false })
  passwordHash?: string;

  @Prop()
  lastLoginAt?: Date;

  @Prop({ default: true })
  isEnabled: boolean;
}

@Schema({ _id: false })
class NotificationPrefs {
  @Prop({ default: true })
  smsEnabled: boolean;

  @Prop({ default: 'fr' })
  language: string;

  @Prop({ default: 'sms' })
  preferredChannel: string;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, trim: true, unique: true })
  phone: string;

  @Prop({ enum: UserRole, required: true, index: true })
  role: UserRole;

  @Prop({ type: UserScope, required: true })
  scope: UserScope;

  @Prop({ type: UserAuth, default: () => ({ isEnabled: true }) })
  auth: UserAuth;

  @Prop({ type: NotificationPrefs, default: () => ({}) })
  notificationPrefs: NotificationPrefs;

  @Prop({ enum: RecordStatus, default: RecordStatus.Active })
  status: RecordStatus;
}

export const UserSchema = SchemaFactory.createForClass(User);
