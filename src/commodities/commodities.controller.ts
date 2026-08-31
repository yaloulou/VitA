import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MongoIdParamDto, ScopedQueryDto } from '../common/common.dto';
import { CommoditiesService } from './commodities.service';
import { CreateCommodityDto } from './dto/commodity.dto';

@Controller('commodities')
export class CommoditiesController {
  constructor(private readonly commoditiesService: CommoditiesService) {}

  @Post()
  create(@Body() dto: CreateCommodityDto) {
    return this.commoditiesService.create(dto);
  }

  @Get()
  list(@Query() query: ScopedQueryDto) {
    return this.commoditiesService.list(query);
  }

  @Get(':id')
  get(@Param() params: MongoIdParamDto) {
    return this.commoditiesService.get(params.id);
  }
}
