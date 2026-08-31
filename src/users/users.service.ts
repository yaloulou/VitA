import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ScopedQueryDto } from '../common/common.dto';
import { CreateUserDto } from './dto/user.dto';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  create(dto: CreateUserDto) {
    return this.userModel.create(dto);
  }

  list(query: ScopedQueryDto) {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.provinceId) filter['scope.provinceId'] = query.provinceId;
    if (query.healthZoneId) filter['scope.healthZoneId'] = query.healthZoneId;
    if (query.facilityId) filter['scope.facilityId'] = query.facilityId;

    return this.userModel.find(filter).sort({ fullName: 1 });
  }

  async get(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
