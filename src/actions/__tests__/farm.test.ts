import { describe, it, expect } from 'vitest';
import {
  getFarms,
  createFarm,
  getFields,
  createField,
  getCropSeasons,
  createCropSeason,
  getSuppliers,
  createSupplier,
  getCustomers,
  createCustomer,
} from '../farm';

describe('Farm Server Actions', () => {
  it('returns seeded farms with valid schema shape including CAR, CPF/CNPJ, address', async () => {
    const farms = await getFarms();
    expect(Array.isArray(farms)).toBe(true);
    expect(farms.length).toBeGreaterThan(0);
    expect(farms[0]).toHaveProperty('id');
    expect(farms[0]).toHaveProperty('name');
    expect(farms[0]).toHaveProperty('totalArea');
    expect(farms[0]).toHaveProperty('carNumber');
    expect(farms[0].carNumber).toBeDefined();
    expect(farms[0].cnpjCpf).toBeDefined();
    expect(farms[0].address).toBeDefined();
  });

  it('creates farm with complete fields (CPF/CNPJ, address, CAR)', async () => {
    const newFarm = await createFarm({
      name: 'Fazenda Vitória',
      cnpjCpf: '98.765.432/0001-10',
      address: 'Linha Pioneira, KM 12',
      location: 'Sorriso - MT',
      totalArea: 1800,
      carNumber: 'MT-5107909-VITO.0001.2026.CARX',
      active: true,
    });

    expect(newFarm).toBeDefined();
    expect(newFarm.name).toBe('Fazenda Vitória');
    expect(newFarm.cnpjCpf).toBe('98.765.432/0001-10');
    expect(newFarm.address).toBe('Linha Pioneira, KM 12');
    expect(newFarm.carNumber).toBe('MT-5107909-VITO.0001.2026.CARX');
    expect(newFarm.totalArea).toBe(1800);
  });

  it('creates field with soil type, variety, GPS coordinates and harvest dates', async () => {
    const newField = await createField({
      farmId: 'f0000000-0000-4000-8000-000000000001',
      name: 'Talhão 08 - Georreferenciado',
      area: 320,
      soilType: 'Latossolo Vermelho Argiloso',
      currentCrop: 'Soja',
      variety: 'TMG 2381 IPRO',
      latitude: -12.5491,
      longitude: -55.7105,
      coordinates: '-12.5491, -55.7105',
      plantingDate: '2025-10-10',
      expectedHarvestDate: '2026-02-15',
    });

    expect(newField).toBeDefined();
    expect(newField.name).toBe('Talhão 08 - Georreferenciado');
    expect(newField.soilType).toBe('Latossolo Vermelho Argiloso');
    expect(newField.variety).toBe('TMG 2381 IPRO');
    expect(newField.latitude).toBe(-12.5491);
    expect(newField.longitude).toBe(-55.7105);
    expect(newField.coordinates).toBe('-12.5491, -55.7105');
  });

  it('creates crop season with planting date and expected harvest date', async () => {
    const newSeason = await createCropSeason({
      name: 'Safra Soja 26/27 Verão',
      startDate: '2026-09-20',
      endDate: '2027-06-30',
      plantingDate: '2026-09-25',
      expectedHarvestDate: '2027-02-10',
      isCurrent: false,
    });

    expect(newSeason).toBeDefined();
    expect(newSeason.name).toBe('Safra Soja 26/27 Verão');
    expect(newSeason.plantingDate).toBe('2026-09-25');
    expect(newSeason.expectedHarvestDate).toBe('2027-02-10');
  });

  it('retrieves fields, crop seasons, suppliers, and customers', async () => {
    const [fields, seasons, suppliers, customers] = await Promise.all([
      getFields(),
      getCropSeasons(),
      getSuppliers(),
      getCustomers(),
    ]);

    expect(fields.length).toBeGreaterThan(0);
    expect(fields[0].soilType).toBeDefined();
    expect(fields[0].coordinates).toBeDefined();
    expect(seasons.length).toBeGreaterThan(0);
    expect(suppliers.length).toBeGreaterThan(0);
    expect(customers.length).toBeGreaterThan(0);
  });

  it('prevents creating suppliers with duplicate CNPJ/CPF', async () => {
    const existingSuppliers = await getSuppliers();
    const existingDoc = existingSuppliers[0]?.document;
    expect(existingDoc).toBeDefined();

    if (existingDoc && existingDoc !== 'N/A') {
      await expect(
        createSupplier({
          name: 'Fornecedor Duplicado Teste',
          category: 'Fertilizantes',
          document: existingDoc,
          contact: '(65) 9999-0000',
        })
      ).rejects.toThrow(/já está cadastrado/);
    }
  });

  it('prevents creating customers with duplicate CNPJ/CPF', async () => {
    const existingCustomers = await getCustomers();
    const existingDoc = existingCustomers[0]?.document;
    expect(existingDoc).toBeDefined();

    if (existingDoc && existingDoc !== 'N/A') {
      await expect(
        createCustomer({
          name: 'Cliente Duplicado Teste',
          segment: 'Trading',
          document: existingDoc,
          contact: '(65) 9999-1111',
        })
      ).rejects.toThrow(/já está cadastrado/);
    }
  });
});
