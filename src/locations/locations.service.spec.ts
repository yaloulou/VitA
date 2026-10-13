import { Model } from 'mongoose';
import { LocationsService } from './locations.service';
import { Facility } from './schemas/facility.schema';
import { HealthZone } from './schemas/health-zone.schema';
import { Province } from './schemas/province.schema';

describe('Facility scope filtering', () => {
  const query = { populate: jest.fn().mockReturnThis(), sort: jest.fn() };
  const facilities = { find: jest.fn().mockReturnValue(query) };
  const service = new LocationsService(
    {} as Model<Province>,
    {} as Model<HealthZone>,
    facilities as unknown as Model<Facility>,
  );

  beforeEach(() => facilities.find.mockClear());

  it('matches an assigned facility by its MongoDB id', () => {
    service.listFacilities({ facilityId: '111111111111111111111111' });
    expect(facilities.find).toHaveBeenCalledWith({
      _id: '111111111111111111111111',
    });
  });

  it('retains province, zone and status filters', () => {
    service.listFacilities({
      provinceId: 'province-id',
      healthZoneId: 'zone-id',
      facilityId: 'facility-id',
      status: 'active',
    });
    expect(facilities.find).toHaveBeenCalledWith({
      provinceId: 'province-id',
      healthZoneId: 'zone-id',
      _id: 'facility-id',
      status: 'active',
    });
  });

  it('does not introduce a facility filter for unassigned profiles', () => {
    service.listFacilities({ healthZoneId: 'zone-id' });
    expect(facilities.find).toHaveBeenCalledWith({ healthZoneId: 'zone-id' });
  });
});
