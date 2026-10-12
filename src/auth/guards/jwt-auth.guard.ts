import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { RecordStatus } from '../../common/common.dto';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: any }>();
    const token = this.extractBearerToken(request);
    const payload = this.authService.verifyToken(token);
    const user = await this.usersService.get(payload.sub).catch(() => null);
    if (!user || user.status !== RecordStatus.Active || !user.auth?.isEnabled) {
      throw new UnauthorizedException('Account unavailable');
    }
    request.user = {
      id: payload.sub,
      phone: payload.phone,
      role: user.role,
    };
    return true;
  }

  private extractBearerToken(request: Request) {
    const authorization = request.headers.authorization;
    const [type, token] = authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing bearer token');
    }
    return token;
  }
}
