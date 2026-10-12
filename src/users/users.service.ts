import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ScopedQueryDto } from '../common/common.dto';
import { hashPassword } from '../common/security/password.util';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { User, UserRole } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(dto: CreateUserDto) {
    const { password, ...user } = dto;
    try {
      const created = await this.userModel.create({
        ...user,
        auth: {
          ...user.auth,
          passwordHash: password
            ? hashPassword(password)
            : user.auth?.passwordHash,
          isEnabled: user.auth?.isEnabled ?? true,
        },
      });
      return this.get(String(created._id));
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException('Email or phone already in use');
      }
      throw error;
    }
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

  async update(id: string, dto: UpdateUserDto) {
    const { password, ...fields } = dto;
    const updates: Record<string, unknown> = { ...fields };
    if (password) updates['auth.passwordHash'] = hashPassword(password);
    try {
      const user = await this.userModel.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true, runValidators: true },
      );
      if (!user) throw new NotFoundException('User not found');
      return user;
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException('Email or phone already in use');
      }
      throw error;
    }
  }

  async remove(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) throw new NotFoundException('User not found');
    return { id, deleted: true };
  }

  async findByIdentifierWithAuth(identifier: string) {
    const normalized = identifier.trim().toLowerCase();
    return this.userModel
      .findOne({
        $or: [{ phone: identifier.trim() }, { email: normalized }],
      })
      .select('+auth.passwordHash');
  }

  countByRole(role: UserRole) {
    return this.userModel.countDocuments({ role });
  }

  async touchLastLogin(id: string) {
    return this.userModel.findByIdAndUpdate(
      id,
      { 'auth.lastLoginAt': new Date() },
      { new: true },
    );
  }
}
