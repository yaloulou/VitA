import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { IndicatorsService } from './indicators.service';
import { IndicatorReport } from './indicator.schema';
import { UsersService } from '../users/users.service';
import { LocationsService } from '../locations/locations.service';
import { UserRole } from '../users/schemas/user.schema';
import catalog from './catalog.json';

describe('Indicator reports', () => {
  const userId = '111111111111111111111111';
  const facilityId = '222222222222222222222222';
  const provinceId = '333333333333333333333333';
  const zoneId = '444444444444444444444444';
  const models = {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    find: jest.fn(),
    createIndexes: jest.fn(),
  };
  const users = { get: jest.fn() };
  const locations = {
    getFacility: jest.fn(),
    getHealthZone: jest.fn(),
    getProvince: jest.fn(),
  };
  const service = new IndicatorsService(
    models as unknown as Model<IndicatorReport>,
    users as unknown as UsersService,
    locations as unknown as LocationsService,
  );
  const dto = {
    clientId: '5bcb18c2-fd7d-4dc2-b580-b4270f6f6401',
    reportedBy: userId,
    moduleId: 'supplementation',
    period: '2026-10',
    facilityId,
    values: { supplementedChildren: 0 },
    status: 'submitted',
  };
  const existing = {
    _id: 'report',
    ...dto,
    provinceId,
    healthZoneId: zoneId,
    scopeKey: `facility:${facilityId}`,
    scopeName: 'CS Binza',
    reporterName: 'Alice',
    version: 1,
    formVersion: 1,
    revisions: [],
  };

  beforeEach(() => {
    jest.resetAllMocks();
    users.get.mockResolvedValue({
      role: UserRole.Relay,
      fullName: 'Alice',
      scope: { facilityId: new Types.ObjectId(facilityId) },
    });
    locations.getFacility.mockResolvedValue({
      name: 'CS Binza',
      provinceId: new Types.ObjectId(provinceId),
      healthZoneId: new Types.ObjectId(zoneId),
    });
    locations.getHealthZone.mockResolvedValue({
      name: 'Binza',
      provinceId: new Types.ObjectId(provinceId),
    });
    locations.getProvince.mockResolvedValue({ name: 'Kinshasa' });
    models.findOne.mockResolvedValue(null);
    models.findById.mockResolvedValue(existing);
    models.create.mockImplementation((data: unknown) => Promise.resolve(data));
    models.findOneAndUpdate.mockResolvedValue({ ...existing, version: 2 });
  });

  it('defines exactly seven modules and twenty-four distinct indicators', () => {
    expect(catalog).toHaveLength(7);
    const keys = catalog.flatMap((item) =>
      item.fields.map((field) => field.key),
    );
    expect(keys).toHaveLength(24);
    expect(new Set(keys).size).toBe(24);
  });

  it.each(catalog)('accepts zero and omitted fields in $id', (item) => {
    expect(() =>
      service.validateValues(item.id, { [item.fields[0].key]: 0 }),
    ).not.toThrow();
  });

  it.each([-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, null, '2'])(
    'rejects invalid counts %s',
    (value) => {
      expect(() =>
        service.validateValues('cps', { plannedCps: value } as Record<
          string,
          number
        >),
      ).toThrow(BadRequestException);
    },
  );

  it('rejects unknown keys, empty values and unknown modules', () => {
    expect(() => service.validateValues('cps', { unknown: 1 })).toThrow();
    expect(() => service.validateValues('cps', {})).toThrow();
    expect(() =>
      service.validateValues('unknown', { plannedCps: 1 }),
    ).toThrow();
  });

  it('derives the hierarchy from the assigned facility', async () => {
    await service.create(userId, dto);
    expect(models.create).toHaveBeenCalledWith(
      expect.objectContaining({
        facilityId,
        provinceId,
        healthZoneId: zoneId,
        reporterName: 'Alice',
      }),
    );
  });

  it('prevents forged authors and out-of-scope collection', async () => {
    await expect(service.create('another-user', dto)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    users.get.mockResolvedValue({
      role: UserRole.Relay,
      scope: { facilityId: new Types.ObjectId() },
    });
    await expect(service.create(userId, dto)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects inconsistent hierarchies', async () => {
    await expect(
      service.create(userId, {
        ...dto,
        provinceId: '555555555555555555555555',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('makes retried creates idempotent', async () => {
    models.findOne.mockResolvedValue(existing);
    expect(await service.create(userId, dto)).toEqual(existing);
    expect(models.create).not.toHaveBeenCalled();
  });

  it('returns a conflict for a duplicate monthly perimeter', async () => {
    models.create.mockRejectedValue({ code: 11000 });
    await expect(service.create(userId, dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('retains the old values and uses optimistic locking during correction', async () => {
    models.findById.mockResolvedValue({
      ...existing,
      status: 'correction_requested',
    });
    await service.update(userId, 'report', {
      version: 1,
      values: { supplementedChildren: 12 },
      reason: 'Correction du total',
      status: 'submitted',
    });
    expect(models.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'report', version: 1, status: 'correction_requested' },
      expect.objectContaining({
        $inc: { version: 1 },
        $push: {
          revisions: expect.objectContaining({
            values: dto.values,
            version: 1,
            changedBy: userId,
          }) as unknown,
        },
      }),
      { new: true, runValidators: true },
    );
  });

  it('rejects stale updates', async () => {
    models.findById.mockResolvedValue({ ...existing, status: 'draft' });
    models.findOneAndUpdate.mockResolvedValue(null);
    await expect(
      service.update(userId, 'report', {
        version: 1,
        values: dto.values,
        reason: 'Correction',
        status: 'submitted',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('recognizes a successful update whose response was lost', async () => {
    models.findById.mockResolvedValue({
      ...existing,
      version: 2,
      revisions: [{ version: 1, changedBy: userId }],
    });
    await service.update(userId, 'report', {
      version: 1,
      values: dto.values,
      reason: 'Correction',
      status: 'submitted',
    });
    expect(models.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('prevents self-validation and review by field profiles', async () => {
    await expect(
      service.review(userId, 'report', {
        version: 1,
        decision: 'validated',
        reason: 'Rapport correct',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    users.get.mockResolvedValue({ role: UserRole.NationalAdmin, scope: {} });
    await expect(
      service.review(userId, 'report', {
        version: 1,
        decision: 'validated',
        reason: 'Rapport correct',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows a supervisor to validate another author inside their zone', async () => {
    users.get.mockResolvedValue({
      role: UserRole.Supervisor,
      scope: { healthZoneId: new Types.ObjectId(zoneId) },
    });
    await service.review('supervisor', 'report', {
      version: 1,
      decision: 'validated',
      reason: 'Rapport verifie',
    });
    expect(models.findOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        $set: expect.objectContaining({
          status: 'validated',
          reviewedBy: 'supervisor',
        }) as unknown,
      }),
      expect.anything(),
    );
  });

  it('constrains list queries without allowing client filters to override user scope', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([]),
    };
    models.find.mockReturnValue(chain);
    await service.list(userId, { provinceId: 'foreign-province' });
    expect(models.find).toHaveBeenCalledWith({
      $and: [{ provinceId: 'foreign-province' }, { facilityId }],
    });
  });

  it('requires database indexes when autoIndex is disabled', async () => {
    await service.onModuleInit();
    expect(models.createIndexes).toHaveBeenCalledTimes(1);
  });
});
