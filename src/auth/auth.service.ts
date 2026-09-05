import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, signJwt, verifyJwt } from '../common/security/jwt.util';
import { verifyPassword } from '../common/security/password.util';
import { RecordStatus } from '../common/common.dto';
import { UserRole } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { BootstrapSuperUserDto } from './dto/bootstrap-super-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const identifier = dto.identifier ?? dto.phone;
    if (!identifier) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.usersService.findByIdentifierWithAuth(identifier);
    if (!user || !user.auth?.isEnabled) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = verifyPassword(
      dto.password,
      user.auth.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userId = String((user as any)._id);
    const token = signJwt(
      {
        sub: userId,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
      this.jwtSecret(),
    );
    await this.usersService.touchLastLogin(userId);

    return {
      accessToken: token,
      token,
      user: this.serializeUser(user),
    };
  }

  async bootstrapSuperUser(
    dto: BootstrapSuperUserDto,
    bootstrapToken?: string,
  ) {
    if (!bootstrapToken || bootstrapToken !== this.bootstrapToken()) {
      throw new UnauthorizedException('Invalid bootstrap token');
    }

    const existingSuperUsers = await this.usersService.countByRole(
      UserRole.NationalAdmin,
    );
    if (existingSuperUsers > 0) {
      throw new ConflictException('A super user already exists');
    }

    const user = await this.usersService.create({
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      password: dto.password,
      role: UserRole.NationalAdmin,
      scope: {},
      status: RecordStatus.Active,
      auth: { isEnabled: true },
    });

    return {
      user: this.serializeUser(user),
      payloadExample: this.superUserPayloadExample(),
    };
  }

  async me(userId: string) {
    const user = await this.usersService.get(userId);
    return this.serializeUser(user);
  }

  verifyToken(token: string): JwtPayload {
    try {
      return verifyJwt(token, this.jwtSecret());
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private jwtSecret() {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error(
        'JWT_SECRET is required. Set it in DigitalOcean App Platform environment variables or in a local .env file.',
      );
    }
    return secret;
  }

  private bootstrapToken() {
    const token = this.configService.get<string>('BOOTSTRAP_SUPER_USER_TOKEN');
    if (!token) {
      throw new Error(
        'BOOTSTRAP_SUPER_USER_TOKEN is required to create the initial super user.',
      );
    }
    return token;
  }

  private superUserPayloadExample() {
    return {
      fullName: 'Administrateur National',
      email: 'admin@vita.cd',
      phone: '+243810000000',
      password: 'mot-de-passe-fort',
    };
  }

  private serializeUser(user: any) {
    return {
      id: String(user._id),
      _id: String(user._id),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      scope: user.scope ?? {},
      notificationPrefs: user.notificationPrefs ?? {},
      status: user.status,
    };
  }
}
