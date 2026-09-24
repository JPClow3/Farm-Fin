import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { DEMO_SESSION_COOKIE, getSessionSecret, verifyDemoSession } from '@/lib/demoSession';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public assets, Next internals, and the endpoints that create sessions
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/session') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Better Auth cookies are only checked for presence here (optimistic); the
  // session itself is validated server-side (see getVerifiedSession). Demo
  // sessions are server-signed, so their signature is verified right away.
  const hasBetterAuthCookie = Boolean(
    request.cookies.get('better-auth.session_token')?.value ||
      request.cookies.get('__Secure-better-auth.session_token')?.value ||
      request.cookies.get('neon_auth.session_token')?.value ||
      request.cookies.get('__Secure-neon_auth.session_token')?.value
  );
  const demoCookie = request.cookies.get(DEMO_SESSION_COOKIE)?.value;
  const secret = getSessionSecret();
  // Without the secret in this runtime, fall back to a presence check; route
  // handlers still verify the signature before doing anything sensitive.
  const hasDemoSession = secret
    ? Boolean(await verifyDemoSession(demoCookie, secret))
    : Boolean(demoCookie);
  const hasSession = hasBetterAuthCookie || hasDemoSession;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  // If unauthenticated and trying to access a protected route
  if (!hasSession && !isAuthPage) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Sessão expirada ou inválida. Faça login novamente.' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated and accessing login page, redirect to home. Only a
  // verified demo session counts here: an unverified Better Auth cookie may be a
  // stale value left by older versions, and must not lock the user out of /login.
  if (hasDemoSession && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
