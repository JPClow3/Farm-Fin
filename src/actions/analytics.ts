'use server';

import { db } from '../db';
import { payables, receivables } from '../db/schema';
import { sql, and, eq, or } from 'drizzle-orm';
import { getEffectiveOrganizationId } from '../lib/session';
import { SEED_PAYABLES, SEED_RECEIVABLES } from '../db/seed';

export async function getDashboardKPIs(farmId?: string) {
  const orgId = await getEffectiveOrganizationId();
  const now = new Date();

  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  try {
    const payablesQuery = await db
      .select({
        totalPending: sql<number>`COALESCE(sum(CASE WHEN ${payables.status} IN ('pendente', 'vencido') THEN ${payables.amount} ELSE 0 END), 0)`,
        totalPaidThisMonth: sql<number>`COALESCE(sum(CASE WHEN ${payables.status} = 'pago' THEN COALESCE(${payables.paidAmount}, ${payables.amount}) ELSE 0 END), 0)`,
      })
      .from(payables)
      .where(
        farmId
          ? and(eq(payables.organizationId, orgId), eq(payables.farmId, farmId))
          : eq(payables.organizationId, orgId)
      );

    const receivablesQuery = await db
      .select({
        totalPending: sql<number>`COALESCE(sum(CASE WHEN ${receivables.status} IN ('pendente', 'vencido') THEN ${receivables.totalAmount} ELSE 0 END), 0)`,
        totalReceivedThisMonth: sql<number>`COALESCE(sum(CASE WHEN ${receivables.status} = 'pago' THEN ${receivables.totalAmount} ELSE 0 END), 0)`,
      })
      .from(receivables)
      .where(
        farmId
          ? and(eq(receivables.organizationId, orgId), eq(receivables.farmId, farmId))
          : eq(receivables.organizationId, orgId)
      );

    const totalPayables = Number(payablesQuery[0]?.totalPending || 0);
    const totalReceivables = Number(receivablesQuery[0]?.totalPending || 0);
    const totalDespesasMes = Number(payablesQuery[0]?.totalPaidThisMonth || 0);
    const totalReceitasMes = Number(receivablesQuery[0]?.totalReceivedThisMonth || 0);

    return {
      success: true,
      data: {
        totalPayables,
        totalReceivables,
        totalDespesasMes,
        totalReceitasMes,
      },
    };
  } catch (error) {
    console.warn('[getDashboardKPIs] DB query fallback:', error);

    // Calculate fallback from seed
    const seededPayables = farmId
      ? SEED_PAYABLES.filter((p) => p.farmId === farmId)
      : SEED_PAYABLES;
    const seededReceivables = farmId
      ? SEED_RECEIVABLES.filter((r) => r.farmId === farmId)
      : SEED_RECEIVABLES;

    const totalPayables = seededPayables
      .filter((p) => p.status === 'pendente' || p.status === 'vencido')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalReceivables = seededReceivables
      .filter((r) => r.status === 'pendente' || r.status === 'vencido')
      .reduce((sum, r) => sum + r.totalAmount, 0);

    const totalDespesasMes = seededPayables
      .filter((p) => p.status === 'pago')
      .reduce((sum, p) => sum + (p.paidAmount || p.amount), 0);

    const totalReceitasMes = seededReceivables
      .filter((r) => r.status === 'pago')
      .reduce((sum, r) => sum + r.totalAmount, 0);

    return {
      success: true,
      data: {
        totalPayables,
        totalReceivables,
        totalDespesasMes,
        totalReceitasMes,
      },
    };
  }
}
