'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthSessionAction } from '../actions/auth';
import { canViewModule, AppModule } from './permissions';

/**
 * Client-side route guard: redirects to the dashboard when the current
 * session's role has no view access to `module`. Returns `true` once access
 * has been confirmed, so callers can gate rendering (avoids a flash of
 * restricted content before the redirect kicks in).
 */
export function useModuleGuard(module: AppModule): boolean {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAuthSessionAction()
      .then((session) => {
        if (cancelled) return;
        if (canViewModule(session.role, module)) {
          setAllowed(true);
        } else {
          router.replace('/');
        }
      })
      .catch(() => {
        if (!cancelled) setAllowed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [module, router]);

  return allowed;
}
