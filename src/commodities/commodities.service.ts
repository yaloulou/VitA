import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ScopedQueryDto } from '../common/common.dto';
import { CreateCommodityDto } from './dto/commodity.dto';
import { Commodity } from './schemas/commodity.schema';

@Injectable()
export class CommoditiesService {
  constructor(
    @InjectModel(Commodity.name)
    private readonly commodityModel: Model<Commodity>,
  ) {}

  create(dto: CreateCommodityDto) {
    return this.commodityModel.create(dto);
  }

  list(query: ScopedQueryDto) {
    const filter: Record<string, unknown> = query.status
      ? { status: query.status }
      : {};
    return this.commodityModel.find(filter).sort({ name: 1 });
  }

  async get(id: string) {
    const commodity = await this.commodityModel.findById(id);
    if (!commodity) throw new NotFoundException('Commodity not found');
    return commodity;
  }
}
