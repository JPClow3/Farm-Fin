import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public assets, Next internals, and API auth endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for auth session tokens
  const betterAuthToken =
    request.cookies.get('better-auth.session_token')?.value ||
    request.cookies.get('__Secure-better-auth.session_token')?.value ||
    request.cookies.get('neon_auth.session_token')?.value ||
    request.cookies.get('__Secure-neon_auth.session_token')?.value ||
    request.cookies.get('farmfin_session')?.value;

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  // If unauthenticated and trying to access a protected route
  if (!betterAuthToken && !isAuthPage) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already authenticated and accessing login page, redirect to home
  if (betterAuthToken && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
