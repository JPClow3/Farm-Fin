// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { getSessionSecret, verifyDemoSession } from '@/lib/demoSession';

const post = (body: unknown, contentType = 'application/json') =>
  POST(
    new NextRequest('http://localhost/api/session/demo', {
      method: 'POST',
      headers: { 'content-type': contentType },
      body: JSON.stringify(body),
    })
  );

describe('POST /api/session/demo', () => {
  it('emite um cookie httpOnly assinado para um perfil de demonstração', async () => {
    const res = await post({ role: 'Gestor', email: 'marina@fazendasantafe.com.br' });
    expect(res.status).toBe(200);

    const cookie = res.cookies.get('farmfin_session');
    expect(cookie?.httpOnly).toBe(true);
    const payload = await verifyDemoSession(cookie?.value, getSessionSecret());
    expect(payload).toMatchObject({ role: 'Gestor', name: 'Marina Duarte' });
  });

  it('rejeita perfis inválidos e requisições que não são JSON', async () => {
    expect((await post({ role: 'Admin' })).status).toBe(400);
    expect((await post({ role: 'Produtor' }, 'text/plain')).status).toBe(415);
  });
});
