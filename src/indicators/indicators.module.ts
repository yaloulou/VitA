import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { LocationsModule } from '../locations/locations.module';
import { IndicatorReport, IndicatorReportSchema } from './indicator.schema';
import { IndicatorsController } from './indicators.controller';
import { IndicatorsService } from './indicators.service';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    LocationsModule,
    MongooseModule.forFeature([
      { name: IndicatorReport.name, schema: IndicatorReportSchema },
    ]),
  ],
  controllers: [IndicatorsController],
  providers: [IndicatorsService],
})
export class IndicatorsModule {}
