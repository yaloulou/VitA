import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MongoIdParamDto, ScopedQueryDto } from '../common/common.dto';
import {
  CreateFacilityDto,
  CreateHealthZoneDto,
  CreateProvinceDto,
} from './dto/location.dto';
import { LocationsService } from './locations.service';

@Controller()
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post('provinces')
  createProvince(@Body() dto: CreateProvinceDto) {
    return this.locationsService.createProvince(dto);
  }

  @Get('provinces')
  listProvinces(@Query() query: ScopedQueryDto) {
    return this.locationsService.listProvinces(query);
  }

  @Get('provinces/:id')
  getProvince(@Param() params: MongoIdParamDto) {
    return this.locationsService.getProvince(params.id);
  }

  @Post('health-zones')
  createHealthZone(@Body() dto: CreateHealthZoneDto) {
    return this.locationsService.createHealthZone(dto);
  }

  @Get('health-zones')
  listHealthZones(@Query() query: ScopedQueryDto) {
    return this.locationsService.listHealthZones(query);
  }

  @Get('health-zones/:id')
  getHealthZone(@Param() params: MongoIdParamDto) {
    return this.locationsService.getHealthZone(params.id);
  }

  @Post('facilities')
  createFacility(@Body() dto: CreateFacilityDto) {
    return this.locationsService.createFacility(dto);
  }

  @Get('facilities')
  listFacilities(@Query() query: ScopedQueryDto) {
    return this.locationsService.listFacilities(query);
  }

  @Get('facilities/:id')
  getFacility(@Param() params: MongoIdParamDto) {
    return this.locationsService.getFacility(params.id);
  }
}
