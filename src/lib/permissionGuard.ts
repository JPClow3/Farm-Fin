import { getCurrentSession } from '@/lib/session';
import { AppModule, PermissionLevel, PermissionError, hasPermission } from '@/lib/permissions';

/**
 * Server Action guard. Throws PermissionError when the current session's role
 * doesn't meet the required level for the given module. Returns the session
 * on success so callers can reuse it (e.g. for audit logging / createdBy stamping).
 *
 * Server-only (imports next/headers transitively via session.ts) - never import
 * this from a client component. Client components should use canViewModule /
 * canManageModule from src/lib/permissions.ts against a role fetched via a
 * Server Action (see src/lib/useModuleGuard.ts).
 */
export async function requireModuleAccess(module: AppModule, level: PermissionLevel = 'manage') {
  const session = await getCurrentSession();
  if (!hasPermission(session.role, module, level)) {
    throw new PermissionError(module, level, session.role);
  }
  return session;
}
