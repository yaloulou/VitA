import { ConflictException, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { verifyPassword } from '../common/security/password.util';
import { User } from './schemas/user.schema';
import { UsersService } from './users.service';

describe('UsersService mutations', () => {
  const model = { findByIdAndUpdate: jest.fn(), findByIdAndDelete: jest.fn() };
  const service = new UsersService(model as unknown as Model<User>);
  beforeEach(() => jest.resetAllMocks());

  it('hashes a replacement password without replacing the auth object', async () => {
    model.findByIdAndUpdate.mockResolvedValue({ fullName: 'Alice' });
    await service.update('user-id', {
      fullName: 'Alice',
      password: 'Password123!',
    });
    const call = model.findByIdAndUpdate.mock.calls[0] as [
      string,
      { $set: Record<string, string> },
    ];
    const updates = call[1];
    expect(
      verifyPassword('Password123!', updates.$set['auth.passwordHash']),
    ).toBe(true);
    expect(updates.$set).not.toHaveProperty('password');
    expect(updates.$set).not.toHaveProperty('auth');
    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      'user-id',
      expect.anything(),
      { new: true, runValidators: true },
    );
  });

  it('keeps the existing password when no replacement is supplied', async () => {
    model.findByIdAndUpdate.mockResolvedValue({ fullName: 'Alice' });
    await service.update('user-id', { fullName: 'Alice' });
    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      'user-id',
      { $set: { fullName: 'Alice' } },
      expect.anything(),
    );
  });

  it('reports duplicate identifiers as a conflict', async () => {
    model.findByIdAndUpdate.mockRejectedValue({ code: 11000 });
    await expect(
      service.update('user-id', { email: 'used@example.org' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns not found for missing users instead of reporting a successful mutation', async () => {
    model.findByIdAndUpdate.mockResolvedValue(null);
    model.findByIdAndDelete.mockResolvedValue(null);
    await expect(
      service.update('missing', { fullName: 'Alice' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
