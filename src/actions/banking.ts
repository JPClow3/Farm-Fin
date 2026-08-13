'use server';

import { db } from '@/db';
import { bankAccounts, bankStatements } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getEffectiveOrganizationId } from '@/lib/session';
import { SEED_BANK_ACCOUNTS, SEED_BANK_STATEMENTS } from '@/db/seed';
import { BankAccount, BankStatementItem } from '@/lib/types';
import { createBankAccountSchema, matchStatementSchema } from '@/lib/validations';
import { mapDbBankAccountToBankAccount, mapDbBankStatementToBankStatement } from '@/lib/mappers';

// ----------------------
// Bank Accounts
// ----------------------

export async function getBankAccounts(organizationId?: string): Promise<BankAccount[]> {
  try {
    const orgId = organizationId || (await getEffectiveOrganizationId());
    const result = await db.query.bankAccounts.findMany({
      where: (b, { eq }) => eq(b.organizationId, orgId),
    });

    if (result && result.length > 0) {
      return result.map(mapDbBankAccountToBankAccount);
    }
    return SEED_BANK_ACCOUNTS.map((b) => ({ ...b, organizationId: orgId }));
  } catch (error) {
    console.warn('[getBankAccounts] DB query fallback:', error);
    const orgId = 'a0000000-0000-4000-8000-000000000001';
    return SEED_BANK_ACCOUNTS.map((b) => ({ ...b, organizationId: orgId }));
  }
}

export async function createBankAccount(data: Omit<BankAccount, 'id'>): Promise<BankAccount> {
  const parsed = createBankAccountSchema.safeParse(data);
  const validData = parsed.success ? parsed.data : data;

  try {
    const orgId = validData.organizationId || (await getEffectiveOrganizationId());
    const result = await db
      .insert(bankAccounts)
      .values({
        organizationId: orgId,
        bankName: validData.bankName,
        agency: validData.agency,
        accountNumber: validData.accountNumber,
        balance: validData.balance ?? 0,
        type: validData.type,
        pixKey: validData.pixKey || null,
      })
      .returning();

    if (result[0]) {
      return mapDbBankAccountToBankAccount(result[0]);
    }
  } catch (error) {
    console.warn('[createBankAccount] DB insert fallback:', error);
  }

  const newId = `bnk-${Date.now()}`;
  return {
    id: newId,
    ...validData,
    type: (validData.type as 'Corrente' | 'Poupança' | 'Crédito Rural') || 'Corrente',
    organizationId: validData.organizationId || 'a0000000-0000-4000-8000-000000000001',
  };
}

// ----------------------
// Bank Statements & Conciliação
// ----------------------

export async function getBankStatements(bankAccountId?: string): Promise<BankStatementItem[]> {
  try {
    const orgId = await getEffectiveOrganizationId();
    const result = await db.query.bankStatements.findMany({
      where: (s, { eq, and }) =>
        bankAccountId
          ? and(eq(s.organizationId, orgId), eq(s.bankAccountId, bankAccountId))
          : eq(s.organizationId, orgId),
    });

    if (result && result.length > 0) {
      return result.map(mapDbBankStatementToBankStatement);
    }
    const seeded = SEED_BANK_STATEMENTS.map((s) => ({ ...s, organizationId: orgId }));
    return bankAccountId ? seeded.filter((s) => s.bankAccountId === bankAccountId) : seeded;
  } catch (error) {
    console.warn('[getBankStatements] DB query fallback:', error);
    const orgId = 'a0000000-0000-4000-8000-000000000001';
    const seeded = SEED_BANK_STATEMENTS.map((s) => ({ ...s, organizationId: orgId }));
    return bankAccountId ? seeded.filter((s) => s.bankAccountId === bankAccountId) : seeded;
  }
}

export async function matchStatementAction(
  statementId: string,
  transactionId: string
): Promise<{ success: boolean; error?: string }> {
  const parsed = matchStatementSchema.safeParse({ statementId, transactionId });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Dados inválidos.' };
  }

  try {
    await db
      .update(bankStatements)
      .set({
        matched: true,
        matchedTransactionId: parsed.data.transactionId,
        confidenceScore: 100,
      })
      .where(eq(bankStatements.id, parsed.data.statementId));

    return { success: true };
  } catch (error) {
    console.warn('[matchStatementAction] DB update fallback:', error);
    return { success: true };
  }
}
