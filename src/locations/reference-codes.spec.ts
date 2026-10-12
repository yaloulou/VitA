import { model } from 'mongoose';
import { ProvinceSchema } from './schemas/province.schema';
import { HealthZoneSchema } from './schemas/health-zone.schema';
import { FacilitySchema } from './schemas/facility.schema';
import { CommoditySchema } from '../commodities/schemas/commodity.schema';

describe('References without manually entered codes', () => {
  const provinceId = '111111111111111111111111';
  const zoneId = '222222222222222222222222';
  it.each([
    ['Province', ProvinceSchema, { name: 'Kinshasa' }],
    ['HealthZone', HealthZoneSchema, { name: 'Binza', provinceId }],
    [
      'Facility',
      FacilitySchema,
      {
        name: 'CS Binza',
        provinceId,
        healthZoneId: zoneId,
        type: 'health_center',
      },
    ],
    ['Commodity', CommoditySchema, { name: 'Vitamine A', unit: 'capsule' }],
  ] as const)(
    'generates unique internal codes for %s while preserving existing codes',
    async (name, schema, fields) => {
      const Reference = model(`Test${name}`, schema);
      const first = new Reference(fields);
      const second = new Reference(fields);
      await expect(first.validate()).resolves.toBeUndefined();
      expect(first.get('code')).toBeTruthy();
      expect(first.get('code')).not.toBe(second.get('code'));
      expect(new Reference({ ...fields, code: 'EXISTING' }).get('code')).toBe(
        'EXISTING',
      );
    },
  );
});
