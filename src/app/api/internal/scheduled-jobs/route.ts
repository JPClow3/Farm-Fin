import { NextRequest, NextResponse } from 'next/server';
import { verifyScheduledJobSignature } from '@/workers/cron-signature';
import { readCronSecret } from '@/workers/cron-secret';
import { runScheduledJob } from '@/workers/run-scheduled-job';
import { SCHEDULED_JOB_SIGNATURE_HEADER } from '@/workers/dispatch-scheduled-cron';
import { parseScheduledJobMessage } from '@/workers/scheduled-jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 2048;

/**
 * Internal entry for the Worker cron triggers. Middleware lets this path
 * through without a session; the HMAC over the raw body is the authorization.
 */
export async function POST(request: NextRequest) {
  const secret = readCronSecret();
  if (!secret) {
    return NextResponse.json(
      { success: false, error: 'BETTER_AUTH_SECRET não configurado no servidor.' },
      { status: 503 }
    );
  }

  if (!request.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ success: false, error: 'Content-Type inválido.' }, { status: 415 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ success: false, error: 'Payload grande demais.' }, { status: 413 });
  }

  const signature = request.headers.get(SCHEDULED_JOB_SIGNATURE_HEADER);
  const valid = await verifyScheduledJobSignature(raw, signature, secret);
  if (!valid) {
    return NextResponse.json({ success: false, error: 'Assinatura inválida.' }, { status: 401 });
  }

  const message = parseScheduledJobMessage(raw);
  if (!message) {
    return NextResponse.json({ success: false, error: 'Job agendado inválido.' }, { status: 400 });
  }

  try {
    const result = await runScheduledJob(message);
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error) {
    console.error('[scheduled-jobs] job failed', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao executar o job agendado.' },
      { status: 500 }
    );
  }
}
