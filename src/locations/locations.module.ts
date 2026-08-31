import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { Facility, FacilitySchema } from './schemas/facility.schema';
import { HealthZone, HealthZoneSchema } from './schemas/health-zone.schema';
import { Province, ProvinceSchema } from './schemas/province.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Province.name, schema: ProvinceSchema },
      { name: HealthZone.name, schema: HealthZoneSchema },
      { name: Facility.name, schema: FacilitySchema },
    ]),
  ],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [MongooseModule, LocationsService],
})
export class LocationsModule {}
