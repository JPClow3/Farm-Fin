// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getBankAccounts,
  createBankAccount,
  getBankStatements,
  matchStatementAction,
} from '../banking';
import { BankAccount } from '@/lib/types';
import * as permissionGuard from '@/lib/permissionGuard';
import { PermissionError } from '@/lib/permissions';

describe('Banking Actions & Financial Balance Engine (src/actions/banking.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Bank Account Retrieval (getBankAccounts)', () => {
    it('retrieves default/seed bank accounts when DB is offline or empty', async () => {
      const accounts = await getBankAccounts();
      expect(Array.isArray(accounts)).toBe(true);
      expect(accounts.length).toBeGreaterThan(0);

      const firstAccount = accounts[0];
      expect(firstAccount).toHaveProperty('id');
      expect(firstAccount).toHaveProperty('bankName');
      expect(firstAccount).toHaveProperty('agency');
      expect(firstAccount).toHaveProperty('accountNumber');
      expect(firstAccount).toHaveProperty('balance');
      expect(firstAccount).toHaveProperty('type');
      expect(typeof firstAccount.balance).toBe('number');
    });

    it('returns bank accounts with valid organizationId scoping', async () => {
      const accounts = await getBankAccounts();
      expect(accounts.length).toBeGreaterThan(0);
      for (const acc of accounts) {
        expect(acc.organizationId).toBeDefined();
        expect(typeof acc.organizationId).toBe('string');
        expect(acc.organizationId?.length).toBeGreaterThan(0);
      }
    });
  });

  describe('2. Bank Account Creation & Validation (createBankAccount)', () => {
    it('creates a new bank account with valid attributes and initial balance', async () => {
      const newAccountData: Omit<BankAccount, 'id'> = {
        organizationId: 'a0000000-0000-4000-8000-000000000001',
        bankName: 'Banco do Brasil',
        agency: '1234-5',
        accountNumber: '98765-4',
        balance: 250000.75,
        type: 'Corrente',
        pixKey: 'financeiro@fazenda.com.br',
      };

      const created = await createBankAccount(newAccountData);
      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.bankName).toBe('Banco do Brasil');
      expect(created.agency).toBe('1234-5');
      expect(created.accountNumber).toBe('98765-4');
      expect(created.balance).toBe(250000.75);
      expect(created.type).toBe('Corrente');
      expect(created.pixKey).toBe('financeiro@fazenda.com.br');
    });

    it('defaults balance to 0 and type to Corrente when optional values are omitted', async () => {
      const minimalData: Omit<BankAccount, 'id'> = {
        organizationId: 'a0000000-0000-4000-8000-000000000001',
        bankName: 'Sicredi Agro',
        agency: '0001',
        accountNumber: '11223-4',
      } as any;

      const created = await createBankAccount(minimalData);
      expect(created).toBeDefined();
      expect(created.bankName).toBe('Sicredi Agro');
      expect(created.type).toBe('Corrente');
      expect(created.balance).toBe(0);
    });

    it('blocks bank account creation when user lacks cadastros:manage permission', async () => {
      vi.spyOn(permissionGuard, 'requireModuleAccess').mockRejectedValueOnce(
        new PermissionError('cadastros', 'manage', 'Operador')
      );

      await expect(
        createBankAccount({
          bankName: 'Bradesco',
          agency: '0001',
          accountNumber: '55555',
          balance: 1000,
          type: 'Corrente',
          organizationId: 'a0000000-0000-4000-8000-000000000001',
        })
      ).rejects.toThrow(PermissionError);
    });
  });

  describe('3. Bank Statements & Statement Line Retrieval (getBankStatements)', () => {
    it('retrieves all bank statements for current organization', async () => {
      const statements = await getBankStatements();
      expect(Array.isArray(statements)).toBe(true);
      expect(statements.length).toBeGreaterThan(0);
      for (const item of statements) {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('bankAccountId');
        expect(item).toHaveProperty('amount');
        expect(item).toHaveProperty('date');
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('matched');
      }
    });

    it('filters statements by specific bankAccountId', async () => {
      const allStatements = await getBankStatements();
      const targetAccountId = allStatements[0]?.bankAccountId || 'bnk-00000000-0001';

      const filtered = await getBankStatements(targetAccountId);
      expect(Array.isArray(filtered)).toBe(true);
      for (const item of filtered) {
        expect(item.bankAccountId).toBe(targetAccountId);
      }
    });
  });

  describe('4. Statement Reconciliation & Transfer Matching (matchStatementAction)', () => {
    it('reconciles single transaction to statement line (1:1 bank transfer match)', async () => {
      const result = await matchStatementAction('stmt-0001', 'pay-0001');
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('reconciles multiple transactions to statement line (N:M combined transfer match)', async () => {
      const result = await matchStatementAction('stmt-0002', ['pay-0001', 'pay-0002', 'pay-0003']);
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects invalid or empty statement matching request', async () => {
      const emptyStatementResult = await matchStatementAction('', ['pay-0001']);
      expect(emptyStatementResult.success).toBe(false);
      expect(emptyStatementResult.error).toBeDefined();

      const emptyTransactionsResult = await matchStatementAction('stmt-0001', []);
      expect(emptyTransactionsResult.success).toBe(false);
      expect(emptyTransactionsResult.error).toBeDefined();
    });

    it('blocks statement matching when user lacks conciliacao:manage permission', async () => {
      vi.spyOn(permissionGuard, 'requireModuleAccess').mockRejectedValueOnce(
        new PermissionError('conciliacao', 'manage', 'Operador')
      );

      await expect(matchStatementAction('stmt-0001', 'pay-0001')).rejects.toThrow(PermissionError);
    });
  });

  describe('5. Bank Transfers & Account Balance Mathematics', () => {
    /**
     * Models internal bank transfer logic: transferring funds from Account A to Account B.
     */
    function executeInternalTransfer(
      sourceAccount: BankAccount,
      destAccount: BankAccount,
      amount: number
    ): { source: BankAccount; dest: BankAccount } {
      if (amount <= 0) {
        throw new Error('Transfer amount must be strictly positive.');
      }
      const roundedAmount = Math.round((amount + Number.EPSILON) * 100) / 100;
      const newSourceBalance = Math.round((sourceAccount.balance - roundedAmount + Number.EPSILON) * 100) / 100;
      const newDestBalance = Math.round((destAccount.balance + roundedAmount + Number.EPSILON) * 100) / 100;

      return {
        source: { ...sourceAccount, balance: newSourceBalance },
        dest: { ...destAccount, balance: newDestBalance },
      };
    }

    /**
     * Models multi-entry balance aggregation from transactions:
     * Balance = Initial + Sum(Credits) - Sum(Debits)
     */
    function calculateAccountEndingBalance(
      initialBalance: number,
      entries: Array<{ type: 'CREDIT' | 'DEBIT'; amount: number }>
    ): number {
      const netMovement = entries.reduce((acc, entry) => {
        const val = Math.round((entry.amount + Number.EPSILON) * 100) / 100;
        return entry.type === 'CREDIT' ? acc + val : acc - val;
      }, 0);
      return Math.round((initialBalance + netMovement + Number.EPSILON) * 100) / 100;
    }

    it('maintains total liquidity conservation invariant during internal bank transfer', () => {
      const source: BankAccount = {
        id: 'bnk-bb-01',
        organizationId: 'org-1',
        bankName: 'Banco do Brasil',
        agency: '1234',
        accountNumber: '1111-1',
        balance: 500000.0,
        type: 'Corrente',
      };
      const dest: BankAccount = {
        id: 'bnk-sicoob-02',
        organizationId: 'org-1',
        bankName: 'Sicoob Agronegócio',
        agency: '4321',
        accountNumber: '2222-2',
        balance: 120500.25,
        type: 'Crédito Rural',
      };

      const transferAmount = 75450.75;
      const totalBefore = source.balance + dest.balance;

      const { source: updatedSource, dest: updatedDest } = executeInternalTransfer(source, dest, transferAmount);

      expect(updatedSource.balance).toBe(424549.25);
      expect(updatedDest.balance).toBe(195951.0);
      expect(updatedSource.balance + updatedDest.balance).toBeCloseTo(totalBefore, 2);
    });

    it('rejects zero and negative transfer amounts', () => {
      const source: BankAccount = {
        id: 'bnk-01',
        organizationId: 'org-1',
        bankName: 'BB',
        agency: '1',
        accountNumber: '1',
        balance: 10000,
        type: 'Corrente',
      };
      const dest: BankAccount = { ...source, id: 'bnk-02', accountNumber: '2' };

      expect(() => executeInternalTransfer(source, dest, 0)).toThrow('Transfer amount must be strictly positive.');
      expect(() => executeInternalTransfer(source, dest, -500)).toThrow('Transfer amount must be strictly positive.');
    });

    it('correctly calculates ending balance with mixed credits, debits, and cent fractions', () => {
      const initial = 100000.0;
      const entries: Array<{ type: 'CREDIT' | 'DEBIT'; amount: number }> = [
        { type: 'CREDIT', amount: 48500.5 }, // Soja trade receipt
        { type: 'DEBIT', amount: 12340.25 }, // Adubo payment
        { type: 'DEBIT', amount: 6780.12 }, // Combustível payment
        { type: 'CREDIT', amount: 15000.0 }, // Barter surplus
        { type: 'DEBIT', amount: 450.33 }, // Bank maintenance fee
      ];

      // 100000 + 48500.50 - 12340.25 - 6780.12 + 15000.00 - 450.33 = 143929.80
      const endingBalance = calculateAccountEndingBalance(initial, entries);
      expect(endingBalance).toBe(143929.8);
    });

    it('handles negative balance (overdraft / cheque especial) correctly', () => {
      const initial = 5000.0;
      const entries: Array<{ type: 'CREDIT' | 'DEBIT'; amount: number }> = [
        { type: 'DEBIT', amount: 12000.0 }, // Emergency equipment repair
      ];

      const endingBalance = calculateAccountEndingBalance(initial, entries);
      expect(endingBalance).toBe(-7000.0);
    });
  });
});
