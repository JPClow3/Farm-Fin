// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const getVerifiedSession = vi.fn();
const processInvoicePdfWithMistral = vi.fn();
const consumeRateLimit = vi.fn();

vi.mock('@/lib/session', () => ({ getVerifiedSession: () => getVerifiedSession() }));
vi.mock('@/lib/mistralInvoiceAgent', () => ({
  processInvoicePdfWithMistral: (buf: Buffer) => processInvoicePdfWithMistral(buf),
}));
vi.mock('@/lib/rateLimit', () => ({
  consumeRateLimit: (rules: unknown) => consumeRateLimit(rules),
}));

import { POST } from '../route';

function buildRequest(extra?: Record<string, string>) {
  const form = new FormData();
  form.append('file', new File([Buffer.from('%PDF-1.4')], 'nf.pdf', { type: 'application/pdf' }));
  for (const [k, v] of Object.entries(extra ?? {})) form.append(k, v);
  return new NextRequest('http://localhost/api/ai/extrair-nf', { method: 'POST', body: form });
}

const session = (role: string) => ({
  kind: 'demo',
  subject: 'demo:abc',
  role,
  organizationId: 'org',
  isAuthenticated: true,
  user: { id: 'u', name: 'U', email: 'u@x.com', role },
});

describe('POST /api/ai/extrair-nf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consumeRateLimit.mockResolvedValue({ allowed: true, retryAfter: 0 });
    processInvoicePdfWithMistral.mockResolvedValue({ numeroNotaFiscal: '1' });
  });

  it('retorna 401 sem sessão verificada e não chama a Mistral', async () => {
    getVerifiedSession.mockResolvedValue(null);
    const res = await POST(buildRequest());
    expect(res.status).toBe(401);
    expect(processInvoicePdfWithMistral).not.toHaveBeenCalled();
  });

  it('retorna 403 para perfis sem permissão de uso', async () => {
    getVerifiedSession.mockResolvedValue(session('Contador'));
    const res = await POST(buildRequest());
    expect(res.status).toBe(403);
    expect(processInvoicePdfWithMistral).not.toHaveBeenCalled();
  });

  it('retorna 429 quando o limite é atingido', async () => {
    getVerifiedSession.mockResolvedValue(session('Produtor'));
    consumeRateLimit.mockResolvedValue({ allowed: false, retryAfter: 120 });
    const res = await POST(buildRequest());
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('120');
    expect(processInvoicePdfWithMistral).not.toHaveBeenCalled();
  });

  it('processa o PDF com a chave do servidor, ignorando qualquer chave enviada', async () => {
    getVerifiedSession.mockResolvedValue(session('Produtor'));
    const res = await POST(buildRequest({ apiKey: 'client-key' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, data: { numeroNotaFiscal: '1' } });
    expect(processInvoicePdfWithMistral).toHaveBeenCalledTimes(1);
    expect(consumeRateLimit.mock.calls[0][0][0].key).toBe('ocr:demo:abc');
  });
});
