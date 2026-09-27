import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SEED_USERS } from '@/db/seed';
import {
  DEMO_ROLES,
  DEMO_SESSION_COOKIE,
  DEMO_SESSION_MAX_AGE,
  createDemoSessionPayload,
  getSessionSecret,
  signDemoSession,
} from '@/lib/demoSession';
import type { UserRoleType } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const demoSessionSchema = z.object({
  role: z.enum(DEMO_ROLES as [UserRoleType, ...UserRoleType[]]),
  email: z.string().trim().email().max(254).optional(),
  name: z.string().trim().min(1).max(120).optional(),
});

/**
 * Issues a server-signed demo session (httpOnly cookie) for a demo persona,
 * a simulated role, or the registration fallback.
 */
export async function POST(request: NextRequest) {
  const secret = getSessionSecret();
  if (!secret) {
    return NextResponse.json(
      { success: false, error: 'Sessões de demonstração indisponíveis: BETTER_AUTH_SECRET não configurado no servidor.' },
      { status: 503 }
    );
  }

  // JSON only: a cross-site form/text POST can't be sent without a CORS preflight
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ success: false, error: 'Content-Type inválido.' }, { status: 415 });
  }

  const parsed = demoSessionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Perfil de demonstração inválido.' }, { status: 400 });
  }

  const { role } = parsed.data;
  const seedUser =
    (parsed.data.email &&
      SEED_USERS.find((u) => u.email.toLowerCase() === parsed.data.email!.toLowerCase())) ||
    SEED_USERS.find((u) => u.role === role);
  const email = parsed.data.email || seedUser?.email || 'demo@farmfin.com.br';
  const name = parsed.data.name || seedUser?.name || 'Usuário Demonstração';

  const payload = createDemoSessionPayload({ email, name, role });
  const token = await signDemoSession(payload, secret);

  const response = NextResponse.json({
    success: true,
    user: {
      id: seedUser && seedUser.email === email ? seedUser.id : `demo-${payload.sid}`,
      organizationId: seedUser?.organizationId,
      name,
      email,
      role,
    },
  });
  response.cookies.set(DEMO_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: DEMO_SESSION_MAX_AGE,
  });
  // Legacy client-written cookie, no longer trusted anywhere
  response.cookies.delete('farmfin_demo_role');
  return response;
}

/**
 * Ends the demo session (the cookie is httpOnly, so the client can't clear it
 * itself). Also clears fake `better-auth.session_token` values written by
 * JavaScript in older versions of the login page; a real Better Auth session
 * is ended by authClient.signOut() before this is called.
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(DEMO_SESSION_COOKIE);
  response.cookies.delete('farmfin_demo_role');
  response.cookies.delete('better-auth.session_token');
  return response;
}
