/** Compare the production OCR + chat path with Mistral document annotations.
 * Run with MISTRAL_API_KEY set. Logs only aggregate field results, latency and usage.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { evaluateInvoiceQuality } from '../src/lib/invoiceQuality';
import {
  INVOICE_RESPONSE_SCHEMA,
  processInvoicePdfWithMistral,
  sanitizeExtraction,
  type ExtractedInvoiceData,
} from '../src/lib/mistralInvoiceAgent';

interface Case {
  name: string;
  pdf: string;
  expected: {
    numeroNotaFiscal: string;
    dataEmissao: string;
    fornecedorCnpj: string;
    faturadoDocumento: string;
    dataVencimento: string;
    valorTotal: number;
  };
}

const key = process.env.MISTRAL_API_KEY?.trim();

function digits(value: string): string {
  return value.replace(/\D/g, '');
}
function score(data: ExtractedInvoiceData, expected: Case['expected']) {
  return {
    invoiceNumber: digits(data.numeroNotaFiscal) === expected.numeroNotaFiscal,
    issued: data.dataEmissao === expected.dataEmissao,
    supplier: digits(data.fornecedor.cnpj) === expected.fornecedorCnpj,
    recipient: digits(data.faturado.cpf) === expected.faturadoDocumento,
    due: data.dataVencimento === expected.dataVencimento,
    total: data.valorTotal !== null && Math.abs(data.valorTotal - expected.valorTotal) < 0.01,
  };
}

async function runAnnotation(pdf: Buffer) {
  const response = await fetch('https://api.mistral.ai/v1/ocr', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'mistral-ocr-latest',
      document: {
        type: 'document_url',
        document_url: `data:application/pdf;base64,${pdf.toString('base64')}`,
      },
      include_image_base64: false,
      confidence_scores_granularity: 'page',
      document_annotation_format: {
        type: 'json_schema',
        json_schema: { name: 'invoice_extraction', schema: INVOICE_RESPONSE_SCHEMA, strict: true },
      },
      document_annotation_prompt:
        'Extraia os dados da nota fiscal. Não invente valores ausentes. Use null para datas e valores desconhecidos.',
    }),
  });
  if (!response.ok) throw new Error(`Annotation request failed: HTTP ${response.status}`);
  const body = (await response.json()) as {
    document_annotation?: string | Record<string, unknown> | null;
    pages?: {
      index: number;
      confidence_scores?: {
        average_page_confidence_score?: number;
        minimum_page_confidence_score?: number;
      };
    }[];
    usage_info?: unknown;
  };
  if (!body.document_annotation) throw new Error('No document annotation returned.');
  const raw =
    typeof body.document_annotation === 'string'
      ? JSON.parse(body.document_annotation)
      : body.document_annotation;
  const data = sanitizeExtraction(raw as ExtractedInvoiceData);
  const review = evaluateInvoiceQuality(
    data,
    (body.pages ?? []).map((page) => ({
      index: page.index,
      average: page.confidence_scores?.average_page_confidence_score ?? null,
      minimum: page.confidence_scores?.minimum_page_confidence_score ?? null,
    }))
  );
  return { data, review, usage: body.usage_info ?? null };
}

async function runBaseline(pdf: Buffer) {
  const originalFetch = globalThis.fetch;
  const usage: { path: string; model: string | null; usage: unknown }[] = [];
  globalThis.fetch = async (input, init) => {
    const response = await originalFetch(input, init);
    if (response.ok) {
      const body = (await response
        .clone()
        .json()
        .catch(() => null)) as { model?: string; usage?: unknown; usage_info?: unknown } | null;
      usage.push({
        path: String(input).endsWith('/ocr') ? 'ocr' : 'chat',
        model: body?.model ?? null,
        usage: body?.usage ?? body?.usage_info ?? null,
      });
    }
    return response;
  };
  try {
    return { result: await processInvoicePdfWithMistral(pdf), usage };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function main() {
  if (!key) throw new Error('Set MISTRAL_API_KEY locally before running this benchmark.');
  const cases = JSON.parse(
    await readFile(resolve('scripts/ocr-benchmark-cases.json'), 'utf8')
  ) as Case[];
  for (const entry of cases) {
    const pdf = await readFile(resolve(entry.pdf));
    const startedBaseline = performance.now();
    const baseline = await runBaseline(pdf);
    const baselineMs = Math.round(performance.now() - startedBaseline);
    const startedAnnotation = performance.now();
    const annotation = await runAnnotation(pdf);
    const annotationMs = Math.round(performance.now() - startedAnnotation);
    console.log(
      JSON.stringify({
        case: entry.name,
        baseline: {
          matches: score(baseline.result.data, entry.expected),
          reviewIssues: baseline.result.review.issues.map((x) => x.field),
          minimumPageConfidence: baseline.result.review.ocrMinimumPageConfidence,
          latencyMs: baselineMs,
          calls: baseline.usage.length,
          usage: baseline.usage,
        },
        annotation: {
          matches: score(annotation.data, entry.expected),
          reviewIssues: annotation.review.issues.map((x) => x.field),
          minimumPageConfidence: annotation.review.ocrMinimumPageConfidence,
          latencyMs: annotationMs,
          calls: 1,
          usage: annotation.usage,
        },
      })
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
