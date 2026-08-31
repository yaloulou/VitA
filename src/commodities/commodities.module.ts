import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommoditiesController } from './commodities.controller';
import { CommoditiesService } from './commodities.service';
import { Commodity, CommoditySchema } from './schemas/commodity.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Commodity.name, schema: CommoditySchema },
    ]),
  ],
  controllers: [CommoditiesController],
  providers: [CommoditiesService],
  exports: [MongooseModule, CommoditiesService],
})
export class CommoditiesModule {}
