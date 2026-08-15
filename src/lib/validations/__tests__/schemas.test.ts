import { describe, it, expect } from 'vitest';
import {
  createFarmSchema,
  createFieldSchema,
  createCropSeasonSchema,
  createSupplierSchema,
  createCustomerSchema,
  createPayableSchema,
  payPayableInputSchema,
  createReceivableSchema,
  receiveReceivableInputSchema,
  fixPriceReceivableSchema,
  settleBarterContractSchema,
  createStockItemSchema,
  createStockMovementSchema,
  createMachinerySchema,
  calculateDRESchema,
  generateLCDPRSchema,
  uploadOFXSchema,
  cleanDocument,
  isValidCpfCnpj,
  isValidCarNumber,
} from '../index';

describe('Zod Validation Schemas', () => {
  describe('Farm & Field Schemas', () => {
    it('validates a valid farm input with CAR, CPF/CNPJ, and address', () => {
      const valid = {
        name: 'Fazenda Boa Esperança',
        cnpjCpf: '12.345.678/0001-90',
        address: 'Rodovia MT-249 Km 15',
        location: 'Sorriso - MT',
        totalArea: 1500,
        carNumber: 'MT-5107909-ABCD.1234.EFGH.5678',
        active: true,
      };
      const result = createFarmSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects an invalid farm with negative area', () => {
      const invalid = {
        name: 'Fazenda Teste',
        totalArea: -50,
      };
      const result = createFarmSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('validates a valid field input with soil type, variety, GPS, and harvest dates', () => {
      const valid = {
        farmId: 'f0000000-0000-4000-8000-000000000001',
        name: 'Talhão Sede',
        area: 450,
        soilType: 'Latossolo Vermelho',
        currentCrop: 'Soja',
        variety: 'BRS 580',
        latitude: -12.5428,
        longitude: -55.7214,
        coordinates: '-12.5428, -55.7214',
        plantingDate: '2025-10-05',
        expectedHarvestDate: '2026-02-10',
      };
      const result = createFieldSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects field with 0 or negative area', () => {
      const invalid = {
        farmId: 'f0000000-0000-4000-8000-000000000001',
        name: 'Talhão Inválido',
        area: 0,
      };
      const result = createFieldSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('validates crop season with planting and expected harvest dates', () => {
      const valid = {
        name: 'Safra 2026/2027',
        startDate: '2026-09-15',
        endDate: '2027-06-30',
        plantingDate: '2026-09-20',
        expectedHarvestDate: '2027-02-28',
        isCurrent: true,
      };
      const result = createCropSeasonSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('validates CPF/CNPJ and CAR sanitization helpers', () => {
      expect(cleanDocument('12.345.678/0001-90')).toBe('12345678000190');
      expect(cleanDocument('123.456.789-00')).toBe('12345678900');
      expect(isValidCpfCnpj('12.345.678/0001-90')).toBe(true);
      expect(isValidCpfCnpj('123.456.789-00')).toBe(true);
      expect(isValidCpfCnpj('123')).toBe(false);
      expect(isValidCarNumber('MT-5107909-ABCD')).toBe(true);
    });
  });

  describe('Financial Schemas (Payables & Receivables)', () => {
    it('validates a valid payable payload', () => {
      const valid = {
        farmId: 'f0000000-0000-4000-8000-000000000001',
        cropSeasonId: 's0000000-0000-4000-8000-000000000001',
        supplierId: 'sup-0001',
        supplierName: 'Yara Fertilizantes',
        category: 'Insumos > Fertilizantes',
        description: 'Adubo NPK Safra 25/26',
        amount: 145000,
        dueDate: '2026-08-25',
        status: 'pendente' as const,
        installments: '1/3',
        hasAttachment: false,
      };
      const result = createPayableSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects a payable with negative or 0 amount', () => {
      const invalid = {
        farmId: 'f1',
        cropSeasonId: 's1',
        supplierId: 'sup1',
        description: 'Teste',
        amount: 0,
        dueDate: '2026-08-25',
      };
      const result = createPayableSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('validates payPayableInputSchema', () => {
      const valid = {
        id: 'pay-001',
        bankAccountId: 'bnk-001',
        paidAmount: 50000,
        paymentDate: '2026-08-14',
      };
      const result = payPayableInputSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('validates a valid receivable payload', () => {
      const valid = {
        farmId: 'f0000000-0000-4000-8000-000000000001',
        cropSeasonId: 's0000000-0000-4000-8000-000000000001',
        customerId: 'cus-0001',
        customerName: 'Bunge Brasil',
        crop: 'Soja',
        description: 'Contrato Futuro Soja 15.000 sacas',
        bagsQuantity: 15000,
        unitPrice: 138,
        totalAmount: 2070000,
        dueDate: '2026-08-30',
        status: 'pendente' as const,
        contractType: 'Contrato Futuro' as const,
      };
      const result = createReceivableSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('validates receiveReceivableInputSchema', () => {
      const valid = {
        id: 'rec-001',
        bankAccountId: 'bnk-001',
        receivedDate: '2026-08-14',
        amount: 480000,
      };
      const result = receiveReceivableInputSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('validates a Barter receivable payload with linked payable', () => {
      const valid = {
        farmId: 'f0000000-0000-4000-8000-000000000001',
        cropSeasonId: 's0000000-0000-4000-8000-000000000001',
        customerId: 'cus-0002',
        customerName: 'Cargill Agrícola',
        crop: 'Soja',
        description: 'Barter Fertilizante Yara / 5.000 sc Soja',
        commodityUnit: 'sc' as const,
        quantity: 5000,
        bagsQuantity: 5000,
        unitPrice: 138,
        totalAmount: 690000,
        dueDate: '2026-09-15',
        status: 'pendente' as const,
        contractType: 'Barter Insumos' as const,
        linkedPayableId: 'pay-0001',
        barterStatus: 'vinculado' as const,
        barterExchangeRate: 41.67,
      };
      const result = createReceivableSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('validates a Hedge receivable payload with a_fixar status and CBOT index', () => {
      const valid = {
        farmId: 'f0000000-0000-4000-8000-000000000001',
        cropSeasonId: 's0000000-0000-4000-8000-000000000001',
        customerId: 'cus-0001',
        customerName: 'Bunge Brasil',
        crop: 'Soja',
        description: 'Contrato a Termo Soja Futuro (A Fixar)',
        commodityUnit: 'sc' as const,
        quantity: 10000,
        bagsQuantity: 10000,
        unitPrice: 135,
        totalAmount: 1350000,
        dueDate: '2026-10-30',
        status: 'pendente' as const,
        contractType: 'Hedge' as const,
        hedgeType: 'Futuro CME' as const,
        priceFixingStatus: 'a_fixar' as const,
        referenceIndex: 'CBOT Chicago (US¢/bu)',
        basis: 1.25,
        targetPrice: 145.0,
      };
      const result = createReceivableSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('validates fixPriceReceivableSchema and settleBarterContractSchema', () => {
      const fixValid = {
        id: 'rec-001',
        unitPrice: 142.5,
        fixingDate: '2026-08-20',
      };
      expect(fixPriceReceivableSchema.safeParse(fixValid).success).toBe(true);
      expect(fixPriceReceivableSchema.safeParse({ id: 'rec-1', unitPrice: -5 }).success).toBe(
        false
      );

      const settleValid = {
        receivableId: 'rec-001',
        payableId: 'pay-001',
        settlementDate: '2026-08-20',
        notes: 'Entrega física efetuada',
      };
      expect(settleBarterContractSchema.safeParse(settleValid).success).toBe(true);
    });
  });

  describe('Stock & Machinery Schemas', () => {
    it('validates createStockItemSchema', () => {
      const valid = {
        farmId: 'f1',
        name: 'Óleo Diesel S10',
        category: 'Combustíveis' as const,
        unit: 'L' as const,
        quantity: 5000,
        minQuantity: 1000,
        averageCost: 6.15,
        lastSupplier: 'Ipiranga Agro',
      };
      const result = createStockItemSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('validates createMachinerySchema', () => {
      const valid = {
        farmId: 'f1',
        name: 'Trator John Deere 8R',
        type: 'Trator Pesado',
        plate: 'AGRO-JD01',
        hourCost: 320,
        status: 'Operacional' as const,
      };
      const result = createMachinerySchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('Analytics & Tax Schemas', () => {
    it('validates calculateDRESchema', () => {
      const valid = { seasonId: 's0000000-0000-4000-8000-000000000001' };
      expect(calculateDRESchema.safeParse(valid).success).toBe(true);
      expect(calculateDRESchema.safeParse({ seasonId: '' }).success).toBe(false);
    });

    it('validates generateLCDPRSchema', () => {
      const valid = { year: 2026, farmId: 'f0000000-0000-4000-8000-000000000001' };
      expect(generateLCDPRSchema.safeParse(valid).success).toBe(true);
      expect(generateLCDPRSchema.safeParse({ year: 1800, farmId: 'f1' }).success).toBe(false);
    });

    it('validates uploadOFXSchema', () => {
      const valid = { fileContent: '<OFX><BANKMSGSRSV1></OFX>' };
      expect(uploadOFXSchema.safeParse(valid).success).toBe(true);
      expect(uploadOFXSchema.safeParse({ fileContent: '' }).success).toBe(false);
    });
  });
});
