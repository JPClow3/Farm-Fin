import { NextRequest, NextResponse } from 'next/server';
import { processInvoicePdfWithMistral } from '@/lib/mistralInvoiceAgent';
import { getVerifiedSession } from '@/lib/session';
import { hasPermission } from '@/lib/permissions';
import { consumeRateLimit } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Limite razoável de tamanho para PDF (ex: 20MB)
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Cada extração consome créditos da Mistral: limites por sessão, por IP e global
const OCR_LIMIT_PER_SESSION_HOUR = 20;
const OCR_LIMIT_PER_IP_HOUR = 40;
const OCR_LIMIT_GLOBAL_DAY = 500;

export async function POST(request: NextRequest) {
  const session = await getVerifiedSession();
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: 'Sua sessão expirou. Faça login novamente para processar notas fiscais.',
      },
      { status: 401 }
    );
  }

  if (!hasPermission(session.role, 'processador-nf', 'manage')) {
    return NextResponse.json(
      { success: false, error: 'Seu perfil não tem permissão para processar notas fiscais.' },
      { status: 403 }
    );
  }

  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  const rateLimit = await consumeRateLimit([
    { key: `ocr:${session.subject}`, limit: OCR_LIMIT_PER_SESSION_HOUR, windowSeconds: 3600 },
    { key: `ocr:ip:${clientIp}`, limit: OCR_LIMIT_PER_IP_HOUR, windowSeconds: 3600 },
    { key: 'ocr:global', limit: OCR_LIMIT_GLOBAL_DAY, windowSeconds: 86400 },
  ]);
  if (!rateLimit.allowed) {
    const minutes = Math.max(1, Math.ceil(rateLimit.retryAfter / 60));
    return NextResponse.json(
      {
        success: false,
        error: `Limite de extrações atingido. Tente novamente em ${minutes} minuto${minutes > 1 ? 's' : ''}.`,
      },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo PDF foi enviado na requisição.' },
        { status: 400 }
      );
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      return NextResponse.json(
        {
          success: false,
          error: 'Formato de arquivo inválido. Apenas arquivos PDF (.pdf) são suportados.',
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'O arquivo PDF excede o tamanho máximo permitido de 20MB.' },
        { status: 413 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extracted = await processInvoicePdfWithMistral(buffer);

    return NextResponse.json({
      success: true,
      data: extracted.data,
      review: extracted.review,
    });
  } catch (error) {
    console.error('Erro ao processar PDF da Nota Fiscal:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno ao processar a nota fiscal.',
      },
      { status: 500 }
    );
  }
}
