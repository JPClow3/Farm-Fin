import { describe, it, expect } from 'vitest';
import {
  getFarms,
  createFarm,
  getFields,
  getCropSeasons,
  getSuppliers,
  getCustomers,
} from '../farm';

describe('Farm Server Actions', () => {
  it('returns seeded farms with valid schema shape', async () => {
    const farms = await getFarms();
    expect(Array.isArray(farms)).toBe(true);
    expect(farms.length).toBeGreaterThan(0);
    expect(farms[0]).toHaveProperty('id');
    expect(farms[0]).toHaveProperty('name');
    expect(farms[0]).toHaveProperty('totalArea');
  });

  it('creates farm with fallback safety and proper structure', async () => {
    const newFarm = await createFarm({
      name: 'Fazenda Vitória',
      location: 'Sorriso - MT',
      totalArea: 1800,
      carNumber: 'MT-0001',
      active: true,
    });

    expect(newFarm).toBeDefined();
    expect(newFarm.name).toBe('Fazenda Vitória');
    expect(newFarm.totalArea).toBe(1800);
  });

  it('retrieves fields, crop seasons, suppliers, and customers', async () => {
    const [fields, seasons, suppliers, customers] = await Promise.all([
      getFields(),
      getCropSeasons(),
      getSuppliers(),
      getCustomers(),
    ]);

    expect(fields.length).toBeGreaterThan(0);
    expect(seasons.length).toBeGreaterThan(0);
    expect(suppliers.length).toBeGreaterThan(0);
    expect(customers.length).toBeGreaterThan(0);
  });
});
