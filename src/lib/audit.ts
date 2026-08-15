import { db } from '@/db';
import { auditLogs } from '@/db/schema';
import { getCurrentSession } from '@/lib/session';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'pay'
  | 'receive'
  | 'settle'
  | 'generate'
  | 'apply';

export type AuditEntityType =
  | 'payable'
  | 'receivable'
  | 'stock_item'
  | 'stock_movement'
  | 'farm'
  | 'field'
  | 'crop_season'
  | 'category'
  | 'supplier'
  | 'customer'
  | 'bank_account'
  | 'machinery'
  | 'employee'
  | 'bank_statement'
  | 'reconciliation'
  | 'cost_apportionment'
  | 'lcdpr'
  | 'dre';

interface WriteAuditLogParams {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  details?: string;
}

/**
 * Records an entry in the audit trail. Failures are swallowed (logged to console)
 * so a logging problem never blocks the underlying business operation.
 */
export async function writeAuditLog(params: WriteAuditLogParams): Promise<void> {
  try {
    const session = await getCurrentSession();
    await db.insert(auditLogs).values({
      organizationId: session.organizationId,
      userId: session.user.id,
      userName: session.user.name,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId || null,
      details: params.details || null,
    });
  } catch (error) {
    console.warn('[writeAuditLog] failed to record audit entry:', error);
  }
}
