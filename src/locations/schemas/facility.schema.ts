import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { RecordStatus } from '../../common/common.dto';

export enum FacilityType {
  HealthCenter = 'health_center',
  Hospital = 'hospital',
  Depot = 'depot',
}

export type FacilityDocument = HydratedDocument<Facility>;

@Schema({ _id: false })
class GeoPoint {
  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lng: number;
}

@Schema({ timestamps: true })
export class Facility {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Province',
    required: true,
    index: true,
  })
  provinceId: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'HealthZone',
    required: true,
    index: true,
  })
  healthZoneId: Types.ObjectId;

  @Prop({ required: true, trim: true, uppercase: true, unique: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ enum: FacilityType, required: true })
  type: FacilityType;

  @Prop({ type: GeoPoint })
  geo?: GeoPoint;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'User', default: [] })
  defaultReporterIds: Types.ObjectId[];

  @Prop({ enum: RecordStatus, default: RecordStatus.Active })
  status: RecordStatus;
}

export const FacilitySchema = SchemaFactory.createForClass(Facility);
