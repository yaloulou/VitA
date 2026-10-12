import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Types } from 'mongoose';
import { verifyJwt } from '../../common/security/jwt.util';
import { RecordStatus } from '../../common/common.dto';
import { LocationsService } from '../../locations/locations.service';
import { UserRole } from '../schemas/user.schema';
import { UsersService } from '../users.service';
import { UpdateUserDto } from '../dto/user.dto';

@Injectable()
export class UserManagementGuard implements CanActivate {
  constructor(
    private readonly users: UsersService,
    private readonly config: ConfigService,
    private readonly locations: LocationsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request<Record<string, string>, unknown, UpdateUserDto>>();
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    let actorId: string;
    try {
      if (type !== 'Bearer' || !token) throw new Error();
      actorId = verifyJwt(
        token,
        this.config.getOrThrow<string>('JWT_SECRET'),
      ).sub;
    } catch {
      throw new UnauthorizedException('Invalid or missing bearer token');
    }
    const actor = await this.users.get(actorId).catch(() => null);
    if (!actor) throw new UnauthorizedException('Account unavailable');
    if (actor.status !== RecordStatus.Active || !actor.auth?.isEnabled) {
      throw new UnauthorizedException('Account disabled');
    }
    if (
      ![UserRole.NationalAdmin, UserRole.ProvinceAdmin].includes(actor.role)
    ) {
      throw new ForbiddenException('Administrator role required');
    }
    const targetId = request.params.id as string | undefined;
    request.body ??= {};
    if (targetId && !/^[a-f\d]{24}$/i.test(targetId)) return true;
    if (
      targetId === actorId &&
      (request.method === 'DELETE' ||
        (request.body.role && request.body.role !== actor.role) ||
        request.body.status === RecordStatus.Inactive)
    ) {
      throw new ForbiddenException(
        'You cannot delete or disable your own administrator account',
      );
    }
    const target = targetId ? await this.users.get(targetId) : undefined;
    if (
      target?.role === UserRole.NationalAdmin &&
      (request.method === 'DELETE' ||
        (request.body.role && request.body.role !== UserRole.NationalAdmin) ||
        request.body.status === RecordStatus.Inactive) &&
      (await this.users.countByRole(UserRole.NationalAdmin)) <= 1
    ) {
      throw new ForbiddenException(
        'The last national administrator must be retained',
      );
    }
    if (actor.role === UserRole.ProvinceAdmin) {
      const provinceId = String(actor.scope.provinceId ?? '');
      const allowedRoles = [
        UserRole.Relay,
        UserRole.Cac,
        UserRole.Nurse,
        UserRole.ZoneDoctor,
        UserRole.Supervisor,
      ];
      const nextRole = request.body.role ?? target?.role;
      if (
        !provinceId ||
        (target &&
          (!allowedRoles.includes(target.role) ||
            (await this.provinceFor(target.scope)) !== provinceId)) ||
        !nextRole ||
        !allowedRoles.includes(nextRole) ||
        (await this.provinceFor(request.body.scope ?? target?.scope ?? {})) !==
          provinceId
      ) {
        throw new ForbiddenException('User outside your administrative scope');
      }
    }
    return true;
  }

  private async provinceFor(scope: {
    provinceId?: string | Types.ObjectId;
    healthZoneId?: string | Types.ObjectId;
    facilityId?: string | Types.ObjectId;
  }) {
    if (scope.facilityId)
      return String(
        (await this.locations.getFacility(String(scope.facilityId))).provinceId,
      );
    if (scope.healthZoneId)
      return String(
        (await this.locations.getHealthZone(String(scope.healthZoneId)))
          .provinceId,
      );
    return String(scope.provinceId ?? '');
  }
}
