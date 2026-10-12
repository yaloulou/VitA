import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Server } from 'node:http';
import { signJwt } from '../common/security/jwt.util';
import { LocationsService } from '../locations/locations.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserManagementGuard } from './guards/user-management.guard';
import { UserRole } from './schemas/user.schema';

describe('User administration endpoints', () => {
  let app: INestApplication;
  const adminId = '111111111111111111111111';
  const userId = '222222222222222222222222';
  const provinceId = '333333333333333333333333';
  const facilityId = '444444444444444444444444';
  const admin = {
    _id: adminId,
    role: UserRole.NationalAdmin,
    scope: {},
    status: 'active',
    auth: { isEnabled: true },
  };
  const user = {
    _id: userId,
    fullName: 'Alice',
    role: UserRole.Nurse,
    scope: { facilityId },
    status: 'active',
    auth: { isEnabled: true },
  };
  const users = {
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    countByRole: jest.fn(),
  };
  const locations = { getFacility: jest.fn(), getHealthZone: jest.fn() };
  const token = signJwt(
    {
      sub: adminId,
      role: UserRole.NationalAdmin,
      email: 'admin@example.org',
      phone: '+243810000000',
    },
    'test-secret',
  );

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UserManagementGuard,
        { provide: UsersService, useValue: users },
        { provide: LocationsService, useValue: locations },
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => 'test-secret' },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    users.get.mockImplementation((id) =>
      Promise.resolve(id === adminId ? admin : user),
    );
    users.update.mockResolvedValue({ ...user, fullName: 'Alice modifiee' });
    users.remove.mockResolvedValue({ id: userId, deleted: true });
    users.countByRole.mockResolvedValue(1);
    locations.getFacility.mockResolvedValue({ provinceId });
  });

  afterAll(async () => app.close());

  it('rejects unauthenticated modifications', async () => {
    await request(app.getHttpServer() as Server)
      .patch(`/users/${userId}`)
      .send({ fullName: 'Test' })
      .expect(401);
    expect(users.update).not.toHaveBeenCalled();
  });

  it('updates a user with the administrator token', async () => {
    await request(app.getHttpServer() as Server)
      .patch(`/users/${userId}`)
      .auth(token, { type: 'bearer' })
      .send({ fullName: 'Alice modifiee' })
      .expect(200);
    expect(users.update).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({ fullName: 'Alice modifiee' }),
    );
  });

  it('validates email and password updates', async () => {
    await request(app.getHttpServer() as Server)
      .patch(`/users/${userId}`)
      .auth(token, { type: 'bearer' })
      .send({ email: 'incorrect', password: 'court' })
      .expect(400);
    expect(users.update).not.toHaveBeenCalled();
  });

  it('deletes a user', async () => {
    await request(app.getHttpServer() as Server)
      .delete(`/users/${userId}`)
      .auth(token, { type: 'bearer' })
      .expect(200, { id: userId, deleted: true });
  });

  it('prevents deleting your own administrator account', async () => {
    await request(app.getHttpServer() as Server)
      .delete(`/users/${adminId}`)
      .auth(token, { type: 'bearer' })
      .expect(403);
    expect(users.remove).not.toHaveBeenCalled();
  });

  it('uses the current role in the database, not an obsolete token role', async () => {
    users.get.mockResolvedValue({ ...admin, role: UserRole.Relay });
    await request(app.getHttpServer() as Server)
      .delete(`/users/${userId}`)
      .auth(token, { type: 'bearer' })
      .expect(403);
  });

  it('allows a provincial administrator to edit a facility user in their province', async () => {
    users.get.mockImplementation((id) =>
      Promise.resolve(
        id === adminId
          ? { ...admin, role: UserRole.ProvinceAdmin, scope: { provinceId } }
          : user,
      ),
    );
    await request(app.getHttpServer() as Server)
      .patch(`/users/${userId}`)
      .auth(token, { type: 'bearer' })
      .send({ fullName: 'Alice modifiee' })
      .expect(200);
  });

  it('rejects provincial changes outside their scope and national promotions', async () => {
    users.get.mockImplementation((id) =>
      Promise.resolve(
        id === adminId
          ? { ...admin, role: UserRole.ProvinceAdmin, scope: { provinceId } }
          : user,
      ),
    );
    await request(app.getHttpServer() as Server)
      .patch(`/users/${userId}`)
      .auth(token, { type: 'bearer' })
      .send({ role: UserRole.NationalAdmin })
      .expect(403);
    locations.getFacility.mockResolvedValue({
      provinceId: '555555555555555555555555',
    });
    await request(app.getHttpServer() as Server)
      .delete(`/users/${userId}`)
      .auth(token, { type: 'bearer' })
      .expect(403);
  });
});
