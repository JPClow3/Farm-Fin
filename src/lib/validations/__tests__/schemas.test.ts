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
  createStockItemSchema,
  createStockMovementSchema,
  createMachinerySchema,
  calculateDRESchema,
  generateLCDPRSchema,
  uploadOFXSchema,
} from '../index';

describe('Zod Validation Schemas', () => {
  describe('Farm & Field Schemas', () => {
    it('validates a valid farm input', () => {
      const valid = {
        name: 'Fazenda Boa Esperança',
        location: 'Sorriso - MT',
        totalArea: 1500,
        carNumber: 'MT-5107909-1234',
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

    it('validates a valid field input', () => {
      const valid = {
        farmId: 'f0000000-0000-4000-8000-000000000001',
        name: 'Talhão Sede',
        area: 450,
        soilType: 'Latossolo Vermelho',
        currentCrop: 'Soja BRS 580',
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
