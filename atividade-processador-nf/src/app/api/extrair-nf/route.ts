import { NextRequest, NextResponse } from 'next/server';
import { processInvoicePdfWithGemini } from '@/lib/geminiInvoiceAgent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo PDF foi enviado na requisição.' },
        { status: 400 }
      );
    }
    const file = formData.get('file') as File | null;
    const apiKey = (formData.get('apiKey') as string | null)?.trim() || undefined;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo PDF foi enviado na requisição.' },
        { status: 400 }
      );
    }

    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      return NextResponse.json(
        { success: false, error: 'Formato de arquivo inválido. Apenas arquivos PDF (.pdf) são aceitos.' },
        { status: 400 }
      );
    }

    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'O arquivo PDF está vazio.' },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'O arquivo PDF excede o tamanho máximo de 20MB.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const data = await processInvoicePdfWithGemini(buffer, apiKey);

    return NextResponse.json({
      success: true,
      data,
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
