import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Facility, FacilitySchema } from '../locations/schemas/facility.schema';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { Alert, AlertSchema } from './schemas/alert.schema';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { Device, DeviceSchema } from './schemas/device.schema';
import { Forecast, ForecastSchema } from './schemas/forecast.schema';
import {
  ReportingSchedule,
  ReportingScheduleSchema,
} from './schemas/reporting-schedule.schema';
import {
  StockMovement,
  StockMovementSchema,
} from './schemas/stock-movement.schema';
import { StockReport, StockReportSchema } from './schemas/stock-report.schema';
import {
  StockThreshold,
  StockThresholdSchema,
} from './schemas/stock-threshold.schema';
import { SyncBatch, SyncBatchSchema } from './schemas/sync-batch.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StockReport.name, schema: StockReportSchema },
      { name: StockMovement.name, schema: StockMovementSchema },
      { name: StockThreshold.name, schema: StockThresholdSchema },
      { name: Forecast.name, schema: ForecastSchema },
      { name: Alert.name, schema: AlertSchema },
      { name: ReportingSchedule.name, schema: ReportingScheduleSchema },
      { name: Device.name, schema: DeviceSchema },
      { name: SyncBatch.name, schema: SyncBatchSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: Facility.name, schema: FacilitySchema },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
