import { describe, it, expect } from 'vitest';
import {
  mapDbFarmToFarm,
  mapDbFieldToField,
  mapDbSeasonToSeason,
  mapDbSupplierToSupplier,
  mapDbCustomerToCustomer,
  mapDbBankAccountToBankAccount,
  mapDbPayableToPayable,
  mapDbReceivableToReceivable,
  mapDbStockItemToStockItem,
  mapDbStockMovementToStockMovement,
  mapDbMachineryToMachinery,
  mapDbBankStatementToBankStatement,
} from '../mappers';

describe('DB to Domain Mappers', () => {
  it('correctly maps DbFarm to Farm with defaults', () => {
    const dbFarm = {
      id: 'f-1',
      organizationId: 'org-1',
      name: 'Fazenda Santa Fé',
      cnpjCpf: '12.345.678/0001-90',
      address: 'Rodovia BR-163 Km 740',
      location: 'Sorriso - MT',
      totalArea: 2400,
      carNumber: 'MT-5107909-ABCD.1234.EFGH.5678',
      active: true,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    };

    const mapped = mapDbFarmToFarm(dbFarm as any);
    expect(mapped.id).toBe('f-1');
    expect(mapped.name).toBe('Fazenda Santa Fé');
    expect(mapped.cnpjCpf).toBe('12.345.678/0001-90');
    expect(mapped.address).toBe('Rodovia BR-163 Km 740');
    expect(mapped.carNumber).toBe('MT-5107909-ABCD.1234.EFGH.5678');
    expect(mapped.totalArea).toBe(2400);
    expect(mapped.active).toBe(true);
    expect(mapped.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('correctly maps DbField with soil type, variety, GPS, and harvest dates', () => {
    const dbField = {
      id: 'fld-1',
      farmId: 'f-1',
      name: 'Talhão 01',
      area: 450,
      soilType: 'Latossolo Vermelho Argiloso',
      currentCrop: 'Soja',
      variety: 'BRS 580',
      latitude: -12.5428,
      longitude: -55.7214,
      coordinates: '-12.5428, -55.7214',
      plantingDate: '2025-10-05',
      expectedHarvestDate: '2026-02-10',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    };

    const mapped = mapDbFieldToField(dbField as any);
    expect(mapped.id).toBe('fld-1');
    expect(mapped.soilType).toBe('Latossolo Vermelho Argiloso');
    expect(mapped.variety).toBe('BRS 580');
    expect(mapped.latitude).toBe(-12.5428);
    expect(mapped.longitude).toBe(-55.7214);
    expect(mapped.coordinates).toBe('-12.5428, -55.7214');
    expect(mapped.plantingDate).toBe('2025-10-05');
    expect(mapped.expectedHarvestDate).toBe('2026-02-10');
  });

  it('correctly maps DbCropSeason with planting and expected harvest dates', () => {
    const dbSeason = {
      id: 's-1',
      organizationId: 'org-1',
      name: 'Safra 2025/2026',
      startDate: '2025-09-15',
      endDate: '2026-06-30',
      plantingDate: '2025-09-15',
      expectedHarvestDate: '2026-02-28',
      isCurrent: true,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    };

    const mapped = mapDbSeasonToSeason(dbSeason as any);
    expect(mapped.id).toBe('s-1');
    expect(mapped.name).toBe('Safra 2025/2026');
    expect(mapped.plantingDate).toBe('2025-09-15');
    expect(mapped.expectedHarvestDate).toBe('2026-02-28');
    expect(mapped.isCurrent).toBe(true);
  });

  it('correctly maps DbPayable with relations', () => {
    const dbPayable = {
      id: 'pay-1',
      organizationId: 'org-1',
      farmId: 'f-1',
      cropSeasonId: 's-1',
      fieldId: 'fld-1',
      supplierId: 'sup-1',
      categoryId: 'cat-1',
      description: 'Adubo NPK Granel',
      category: 'Insumos > Fertilizantes',
      supplierName: 'Yara Brasil',
      amount: 145000,
      dueDate: '2026-08-25',
      status: 'pendente',
      installments: '1/3',
      hasAttachment: true,
      attachmentUrl: 'https://r2.com/doc.pdf',
      paymentDate: null,
      paidAmount: null,
      bankAccountId: null,
      createdAt: new Date('2026-08-01T00:00:00Z'),
      updatedAt: new Date('2026-08-01T00:00:00Z'),
    };

    const mapped = mapDbPayableToPayable(dbPayable as any);
    expect(mapped.id).toBe('pay-1');
    expect(mapped.supplierName).toBe('Yara Brasil');
    expect(mapped.amount).toBe(145000);
    expect(mapped.status).toBe('pendente');
    expect(mapped.hasAttachment).toBe(true);
  });

  it('correctly maps DbReceivable', () => {
    const dbReceivable = {
      id: 'rec-1',
      organizationId: 'org-1',
      farmId: 'f-1',
      cropSeasonId: 's-1',
      customerId: 'cus-1',
      categoryId: null,
      customerName: 'Bunge Brasil',
      crop: 'Soja',
      description: 'Venda Futura Soja',
      bagsQuantity: 15000,
      unitPrice: 138,
      totalAmount: 2070000,
      dueDate: '2026-08-30',
      status: 'pendente',
      contractType: 'Contrato Futuro',
      receivedDate: null,
      bankAccountId: null,
      createdAt: new Date('2026-08-01T00:00:00Z'),
      updatedAt: new Date('2026-08-01T00:00:00Z'),
    };

    const mapped = mapDbReceivableToReceivable(dbReceivable as any);
    expect(mapped.id).toBe('rec-1');
    expect(mapped.totalAmount).toBe(2070000);
    expect(mapped.contractType).toBe('Contrato Futuro');
  });

  it('correctly maps DbStockItem and DbMachinery', () => {
    const dbStock = {
      id: 'stk-1',
      organizationId: 'org-1',
      farmId: 'f-1',
      name: 'Diesel S10',
      category: 'Combustíveis',
      unit: 'L',
      quantity: 5000,
      minQuantity: 1000,
      averageCost: 6.15,
      lastSupplier: 'Ipiranga Agro',
      batchNumber: null,
      location: null,
      expiryDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mappedStock = mapDbStockItemToStockItem(dbStock as any);
    expect(mappedStock.name).toBe('Diesel S10');
    expect(mappedStock.quantity).toBe(5000);

    const dbMach = {
      id: 'mac-1',
      organizationId: 'org-1',
      farmId: 'f-1',
      name: 'Trator JD 8R',
      type: 'Trator Pesado',
      brand: 'John Deere',
      model: '8R 370',
      chassis: 'CHAS-12345',
      year: 2024,
      fuelConsumption: 28.5,
      plate: 'AGRO-01',
      hourCost: 320,
      status: 'Operacional',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mappedMach = mapDbMachineryToMachinery(dbMach as any);
    expect(mappedMach.name).toBe('Trator JD 8R');
    expect(mappedMach.hourCost).toBe(320);
    expect(mappedMach.status).toBe('Operacional');
  });
});
