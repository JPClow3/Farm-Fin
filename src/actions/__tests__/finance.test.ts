import { describe, it, expect } from 'vitest';
import {
  getPayables,
  createPayable,
  approvePayableAction,
  rejectPayableAction,
  payPayableAction,
  getReceivables,
  createReceivable,
  receiveReceivableAction,
  fixPriceReceivableAction,
  settleBarterContractAction,
  linkBarterPayableAction,
  getCashFlowReport,
  sendDueDateAlertsNotificationAction,
} from '../finance';

describe('Finance Server Actions', () => {
  it('retrieves payables with proper schema shape', async () => {
    const payables = await getPayables();
    expect(Array.isArray(payables)).toBe(true);
    expect(payables.length).toBeGreaterThan(0);
    expect(payables[0]).toHaveProperty('id');
    expect(payables[0]).toHaveProperty('amount');
    expect(payables[0]).toHaveProperty('status');
  });

  it('creates payable with validation and fallback safety', async () => {
    const created = await createPayable({
      farmId: 'f0000000-0000-4000-8000-000000000001',
      cropSeasonId: 's0000000-0000-4000-8000-000000000001',
      supplierId: 'sup-0001',
      supplierName: 'Yara Brasil',
      category: 'Insumos > Fertilizantes',
      description: 'Adubo Safra Nova',
      amount: 50000,
      dueDate: '2026-09-30',
      status: 'pendente',
      installments: '1/1',
      hasAttachment: false,
    });

    expect(created).toBeDefined();
    expect(created.amount).toBe(50000);
    expect(created.description).toBe('Adubo Safra Nova');
  });

  it('rejects invalid payPayableAction payload safely', async () => {
    const result = await payPayableAction('', '', -10, 'invalid-date');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('creates Barter contract linked to payable and settles barter', async () => {
    const barterReceivable = await createReceivable({
      farmId: 'f0000000-0000-4000-8000-000000000001',
      cropSeasonId: 's0000000-0000-4000-8000-000000000001',
      customerId: 'cus-00000000-0002',
      customerName: 'Cargill Agrícola',
      crop: 'Soja',
      description: 'Barter Fertilizante Yara / 3000 sc Soja',
      commodityUnit: 'sc',
      quantity: 3000,
      bagsQuantity: 3000,
      unitPrice: 140,
      totalAmount: 420000,
      dueDate: '2026-09-15',
      status: 'pendente',
      contractType: 'Barter Insumos',
      linkedPayableId: 'pay-00000000-0001',
    });

    expect(barterReceivable).toBeDefined();
    expect(barterReceivable.contractType).toBe('Barter Insumos');
    expect(barterReceivable.barterStatus).toBe('vinculado');

    // Test explicit linking action
    const linkResult = await linkBarterPayableAction(barterReceivable.id, 'pay-00000000-0001');
    expect(linkResult.success).toBe(true);

    // Test settling barter
    const settleResult = await settleBarterContractAction(
      barterReceivable.id,
      'pay-00000000-0001',
      '2026-09-15',
      'Entrega de grãos efetuada'
    );
    expect(settleResult.success).toBe(true);
  });

  it('creates Hedge contract with price fixing (a_fixar -> fixado)', async () => {
    const hedgeContract = await createReceivable({
      farmId: 'f0000000-0000-4000-8000-000000000001',
      cropSeasonId: 's0000000-0000-4000-8000-000000000001',
      customerId: 'cus-00000000-0001',
      customerName: 'Bunge Brasil',
      crop: 'Soja',
      description: 'Contrato a Termo Soja Futuro (A Fixar)',
      commodityUnit: 'sc',
      quantity: 5000,
      bagsQuantity: 5000,
      unitPrice: 135,
      totalAmount: 675000,
      dueDate: '2026-10-30',
      status: 'pendente',
      contractType: 'Hedge',
      hedgeType: 'Futuro CME',
      priceFixingStatus: 'a_fixar',
      referenceIndex: 'CBOT Chicago (US¢/bu)',
      basis: 1.25,
      targetPrice: 142.0,
    });

    expect(hedgeContract.priceFixingStatus).toBe('a_fixar');
    expect(hedgeContract.hedgeType).toBe('Futuro CME');

    // Fix price to 143.50/sc
    const fixResult = await fixPriceReceivableAction(hedgeContract.id, 143.5, '2026-08-20');
    expect(fixResult.success).toBe(true);
  });

  it('creates Toneladas-based commodity receivable with normalized bags', async () => {
    const tonReceivable = await createReceivable({
      farmId: 'f0000000-0000-4000-8000-000000000001',
      cropSeasonId: 's0000000-0000-4000-8000-000000000001',
      customerId: 'cus-00000000-0004',
      customerName: 'ADM do Brasil',
      crop: 'Milho',
      description: 'Venda Exportação Milho - 600 Toneladas',
      commodityUnit: 'ton',
      quantity: 600,
      bagsQuantity: 10000,
      unitPrice: 1200,
      totalAmount: 720000,
      dueDate: '2026-08-31',
      status: 'pendente',
      contractType: 'Venda Spot',
    });

    expect(tonReceivable.commodityUnit).toBe('ton');
    expect(tonReceivable.quantity).toBe(600);
    // 600 ton * 16.6667 = ~10000 sacas de 60kg
    expect(tonReceivable.bagsQuantity).toBeGreaterThan(9900);
    expect(tonReceivable.totalAmount).toBe(720000);
  });

  it('retrieves receivables and processes cash flow report with bank and period variations', async () => {
    const [
      receivables,
      cashFlowMonthly,
      cashFlowWeekly,
      cashFlowDaily,
      cashFlowAnnual,
      cashFlowFiltered,
    ] = await Promise.all([
      getReceivables(),
      getCashFlowReport('mensal'),
      getCashFlowReport('semanal'),
      getCashFlowReport('diaria'),
      getCashFlowReport('anual'),
      getCashFlowReport('mensal', undefined, 'b0000000-0000-4000-8000-000000000001'),
    ]);

    expect(receivables.length).toBeGreaterThan(0);

    // Monthly report
    expect(cashFlowMonthly.success).toBe(true);
    if (cashFlowMonthly.success) {
      expect(cashFlowMonthly.data.length).toBeGreaterThan(0);
      expect(cashFlowMonthly.data[0]).toHaveProperty('period');
      expect(cashFlowMonthly.data[0]).toHaveProperty('inflows');
      expect(cashFlowMonthly.data[0]).toHaveProperty('outflows');
      expect(cashFlowMonthly.data[0]).toHaveProperty('finalBalance');
    }

    // Weekly report
    expect(cashFlowWeekly.success).toBe(true);
    if (cashFlowWeekly.success) {
      expect(cashFlowWeekly.data.length).toBeGreaterThan(0);
    }

    // Daily report
    expect(cashFlowDaily.success).toBe(true);
    if (cashFlowDaily.success) {
      expect(cashFlowDaily.data.length).toBeGreaterThan(0);
    }

    // Annual report
    expect(cashFlowAnnual.success).toBe(true);
    if (cashFlowAnnual.success) {
      expect(cashFlowAnnual.data.length).toBeGreaterThan(0);
    }

    // Filtered by bank account
    expect(cashFlowFiltered.success).toBe(true);
    if (cashFlowFiltered.success) {
      expect(cashFlowFiltered.data.length).toBeGreaterThan(0);
    }
  });

  it('supports recurring payables and approval workflows', async () => {
    const recurringPayable = await createPayable({
      farmId: 'f0000000-0000-4000-8000-000000000001',
      cropSeasonId: 's0000000-0000-4000-8000-000000000001',
      supplierId: 'sup-0001',
      supplierName: 'Syngenta Proteção',
      category: 'Insumos > Defensivos',
      description: 'Arrendamento Mensal Pivot 01',
      amount: 12000,
      dueDate: '2026-09-01',
      status: 'pendente',
      recurrencePattern: 'monthly',
      requiresApproval: true,
      approvalStatus: 'pendente',
    });

    expect(recurringPayable).toBeDefined();
    expect(recurringPayable.recurrencePattern).toBe('monthly');
    expect(recurringPayable.requiresApproval).toBe(true);
    expect(recurringPayable.approvalStatus).toBe('pendente');

    // Test approvePayableAction
    const approveResult = await approvePayableAction(recurringPayable.id, 'Diretor Agrícola');
    expect(approveResult.success).toBe(true);

    // Test rejectPayableAction
    const rejectResult = await rejectPayableAction(
      recurringPayable.id,
      'Valor fora do orçamento',
      'Diretor Agrícola'
    );
    expect(rejectResult.success).toBe(true);

    // Test sendDueDateAlertsNotificationAction
    const alertDispatch = await sendDueDateAlertsNotificationAction('email');
    expect(alertDispatch.success).toBe(true);
    if (alertDispatch.success && alertDispatch.data) {
      expect(alertDispatch.data.channel).toBe('email');
      expect(alertDispatch.data.dispatchedCount).toBeGreaterThanOrEqual(0);
    }
  });
});
