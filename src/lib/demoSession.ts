import type { UserRoleType } from './types';

/**
 * Server-signed demo session.
 *
 * Demo personas (quick-login buttons, role simulation in /configuracoes and the
 * registration fallback) don't have a Better Auth session. Instead the server
 * issues this HMAC-SHA256 signed, httpOnly cookie, so a browser can no longer
 * mint a session just by writing a cookie value.
 *
 * Uses Web Crypto only, so it runs both in the middleware (edge) and in
 * Node/Workers route handlers.
 */

export const DEMO_SESSION_COOKIE = 'farmfin_session';
export const DEMO_SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 dias

export const DEMO_ROLES: UserRoleType[] = ['Produtor', 'Gestor', 'Financeiro', 'Contador', 'Operador'];

export interface DemoSessionPayload {
  /** Random id, used e.g. as the rate-limit subject */
  sid: string;
  email: string;
  name: string;
  role: UserRoleType;
  /** Expiration, unix seconds */
  exp: number;
}

// Only used outside production so local dev works without extra setup.
const DEV_FALLBACK_SECRET = 'farmfin-dev-only-demo-session-secret';

/**
 * Secret used to sign demo sessions. In production it must come from
 * BETTER_AUTH_SECRET; returns null when it is missing so callers refuse to
 * issue/accept sessions instead of signing with a public default.
 */
export function getSessionSecret(): string | null {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (secret) return secret;
  return process.env.NODE_ENV === 'production' ? null : DEV_FALLBACK_SECRET;
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signDemoSession(payload: DemoSessionPayload, secret: string): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign('HMAC', await importKey(secret), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

/** Returns the payload when the signature is valid and the session hasn't expired. */
export async function verifyDemoSession(
  value: string | undefined,
  secret: string | null
): Promise<DemoSessionPayload | null> {
  if (!value || !secret) return null;
  const [body, signature, extra] = value.split('.');
  if (!body || !signature || extra !== undefined) return null;

  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      await importKey(secret),
      fromBase64Url(signature) as BufferSource,
      encoder.encode(body)
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as DemoSessionPayload;
    if (
      typeof payload.exp !== 'number' ||
      payload.exp * 1000 < Date.now() ||
      !DEMO_ROLES.includes(payload.role)
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function createDemoSessionPayload(input: {
  email: string;
  name: string;
  role: UserRoleType;
}): DemoSessionPayload {
  return {
    sid: crypto.randomUUID(),
    email: input.email,
    name: input.name,
    role: input.role,
    exp: Math.floor(Date.now() / 1000) + DEMO_SESSION_MAX_AGE,
  };
}
