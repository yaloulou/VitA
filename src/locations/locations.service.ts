import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ScopedQueryDto } from '../common/common.dto';
import {
  CreateFacilityDto,
  CreateHealthZoneDto,
  CreateProvinceDto,
} from './dto/location.dto';
import { Facility } from './schemas/facility.schema';
import { HealthZone } from './schemas/health-zone.schema';
import { Province } from './schemas/province.schema';

@Injectable()
export class LocationsService {
  constructor(
    @InjectModel(Province.name) private readonly provinceModel: Model<Province>,
    @InjectModel(HealthZone.name)
    private readonly healthZoneModel: Model<HealthZone>,
    @InjectModel(Facility.name) private readonly facilityModel: Model<Facility>,
  ) {}

  createProvince(dto: CreateProvinceDto) {
    return this.provinceModel.create(dto);
  }

  listProvinces(query: ScopedQueryDto) {
    return this.provinceModel.find(this.cleanFilter(query)).sort({ name: 1 });
  }

  async getProvince(id: string) {
    const province = await this.provinceModel.findById(id);
    if (!province) throw new NotFoundException('Province not found');
    return province;
  }

  createHealthZone(dto: CreateHealthZoneDto) {
    return this.healthZoneModel.create(dto);
  }

  listHealthZones(query: ScopedQueryDto) {
    return this.healthZoneModel
      .find(this.cleanFilter(query))
      .populate('provinceId', 'code name')
      .sort({ name: 1 });
  }

  async getHealthZone(id: string) {
    const healthZone = await this.healthZoneModel.findById(id);
    if (!healthZone) throw new NotFoundException('Health zone not found');
    return healthZone;
  }

  createFacility(dto: CreateFacilityDto) {
    return this.facilityModel.create(dto);
  }

  listFacilities(query: ScopedQueryDto) {
    return this.facilityModel
      .find(this.cleanFilter(query))
      .populate('provinceId', 'code name')
      .populate('healthZoneId', 'code name')
      .sort({ name: 1 });
  }

  async getFacility(id: string) {
    const facility = await this.facilityModel.findById(id);
    if (!facility) throw new NotFoundException('Facility not found');
    return facility;
  }

  private cleanFilter(query: ScopedQueryDto): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(query).filter(([, value]) => value !== undefined),
    );
  }
}
