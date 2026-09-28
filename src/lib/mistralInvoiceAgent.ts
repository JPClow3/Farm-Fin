export interface ExtractedInvoiceFornecedor {
  razaoSocial: string;
  nomeFantasia?: string | null;
  cnpj: string;
}

export interface ExtractedInvoiceFaturado {
  nomeCompleto: string;
  cpf: string;
}

import {
  evaluateInvoiceQuality,
  type InvoiceReview,
  type OcrPageConfidence,
} from './invoiceQuality';

export interface ExtractedInvoiceParcela {
  numero: number;
  dataVencimento: string | null; // Formato AAAA-MM-DD
  valor: number | null;
}

export interface ExtractedInvoiceData {
  fornecedor: ExtractedInvoiceFornecedor;
  faturado: ExtractedInvoiceFaturado;
  numeroNotaFiscal: string;
  dataEmissao: string | null; // Formato AAAA-MM-DD
  descricaoProdutos: string[];
  quantidadeParcelas: number | null;
  parcelas: ExtractedInvoiceParcela[];
  dataVencimento: string | null; // Formato AAAA-MM-DD da primeira/principal parcela
  valorTotal: number | null;
  tipoDespesa: string;
  classificacaoDespesa: string[];
}

export const CATEGORIAS_DESPESA_OFICIAIS = [
  'INSUMOS AGRÍCOLAS',
  'MANUTENÇÃO E OPERAÇÃO',
  'RECURSOS HUMANOS',
  'SERVIÇOS OPERACIONAIS',
  'INFRAESTRUTURA E UTILIDADES',
  'ADMINISTRATIVAS',
  'SEGUROS E PROTEÇÃO',
  'IMPOSTOS E TAXAS',
  'INVESTIMENTOS',
] as const;

export function parseValorBR(valor: unknown): number | null {
  if (typeof valor === 'number' && Number.isFinite(valor)) return valor;
  if (typeof valor !== 'string' || !valor.trim()) return null;
  let v = valor
    .trim()
    .replace(/^R\$\s*/i, '')
    .trim();
  // "3.086,75" (BR) -> "3086.75" | "3086.75" (US) mantido | "3086,75" -> "3086.75"
  if (/^-?[\d.]+,\d{1,2}$/.test(v)) {
    v = v.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d+,\d{1,2}$/.test(v)) {
    v = v.replace(',', '.');
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function normalizarDataBR(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const v = valor.trim();
  if (!v) return null;
  // Já está em AAAA-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  // DD/MM/AAAA -> AAAA-MM-DD
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return v;
}

export function normalizarCategoria(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const v = valor.trim().toUpperCase();
  for (const oficial of CATEGORIAS_DESPESA_OFICIAIS) {
    if (v === oficial) return oficial;
  }
  // Mapeia variações comuns / sem acento para a categoria oficial.
  // Os testes de palavra-chave usam a forma sem acento (semAcento),
  // pois /i não iguala "á" a "a".
  const semAcento = v.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const oficial of CATEGORIAS_DESPESA_OFICIAIS) {
    const oficialSemAcento = oficial.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (semAcento === oficialSemAcento) return oficial;
  }
  if (
    /MANUTENCAO|OPERACAO|COMBUSTIVEL|LUBRIFICANTE|PECA|PNEU|FILTRO|CORREIA|FERRAMENTA|OFICINA|OLEO DIESEL/.test(
      semAcento
    )
  ) {
    return 'MANUTENÇÃO E OPERAÇÃO';
  }
  if (
    /HIDRAULICO|INFRAESTRUTURA|UTILIDADE|ENERGIA|ARRENDAMENTO|CONSTRUCAO|CIMENTO|TUBO PVC|CONEXAO/.test(
      semAcento
    )
  ) {
    return 'INFRAESTRUTURA E UTILIDADES';
  }
  if (/INSUMO|SEMENTE|FERTILIZANTE|DEFENSIVO|CORRETIVO|ADUBO/.test(semAcento)) {
    return 'INSUMOS AGRÍCOLAS';
  }
  if (/FRETE|TRANSPORTE|COLHEITA|SECAGEM|ARMAZENAGEM|PULVERIZACAO/.test(semAcento)) {
    return 'SERVIÇOS OPERACIONAIS';
  }
  if (/SALARIO|MAO DE OBRA|ENCARGO/.test(semAcento)) {
    return 'RECURSOS HUMANOS';
  }
  if (/HONORARIO|BANCARIA|FINANCEIRA|ADMINISTRATIV/.test(semAcento)) {
    return 'ADMINISTRATIVAS';
  }
  if (/SEGURO/.test(semAcento)) {
    return 'SEGUROS E PROTEÇÃO';
  }
  if (/ITR|IPTU|IPVA|INCRA|IMPOSTO|TAXA/.test(semAcento)) {
    return 'IMPOSTOS E TAXAS';
  }
  if (/AQUISICAO|VEICULO|IMOVEL|INVESTIMENTO|TRATOR COLHEITADEIRA/.test(semAcento)) {
    return 'INVESTIMENTOS';
  }
  return null;
}

const INVOICE_EXTRACTION_SYSTEM_PROMPT = `
Você é um Agente de Extração de Documentos Fiscais (DANFE / NF-e, Contas a Pagar).
Extraia rigorosamente os dados do PDF e devolva em JSON estruturado.

REGRAS DE EXTRAÇÃO:
1. fornecedor (emitente): razaoSocial, nomeFantasia (ou null se não houver), cnpj.
2. faturado (destinatário): nomeCompleto, cpf.
3. numeroNotaFiscal: número da NF (ex: "000.084.682").
4. dataEmissao: sempre "AAAA-MM-DD" (converta DD/MM/AAAA).
5. descricaoProdutos: array de strings com as descrições dos itens do corpo da nota.
6. Parcelas: identifique apenas faturas/duplicatas com valor ou vencimento explícito. Se não houver, use array vazio e quantidadeParcelas null. Não invente vencimento ou valor.
   - quantidadeParcelas: inteiro ou null
   - parcelas: array de { numero: inteiro, dataVencimento: "AAAA-MM-DD", valor: número }
   - dataVencimento: vencimento geral "AAAA-MM-DD", ou null se ausente
7. valorTotal: número (ex: 3086.75, sem R$, sem separador de milhar), ou null se ilegível.

Não adivinhe campos ausentes. Use null para datas/valores desconhecidos e string vazia para identificadores não encontrados. O documento do destinatário pode ser CPF ou CNPJ no campo cpf.

CLASSIFICAÇÃO SEMÂNTICA (TIPO DE DESPESA) — INTERPRETAR, NÃO extrair:
Use EXCLUSIVAMENTE uma destas 9 categorias oficiais (grafia exata, com acentos):
- "INSUMOS AGRÍCOLAS": Sementes, Fertilizantes, Defensivos Agrícolas, Corretivos.
- "MANUTENÇÃO E OPERAÇÃO": Combustíveis e Lubrificantes; Peças, Parafusos, Componentes Mecânicos; Manutenção de Máquinas e Equipamentos; Pneus, Filtros, Correias; Ferramentas e Utensílios.
  * Compra de Óleo Diesel -> "MANUTENÇÃO E OPERAÇÃO".
  * Peças de máquinas agrícolas (rolamento, bucha, anel, graxa, estopa) -> "MANUTENÇÃO E OPERAÇÃO".
- "RECURSOS HUMANOS": Mão de Obra Temporária; Salários e Encargos.
- "SERVIÇOS OPERACIONAIS": Frete e Transporte; Colheita Terceirizada; Secagem e Armazenagem; Pulverização e Aplicação.
- "INFRAESTRUTURA E UTILIDADES": Energia Elétrica; Arrendamento de Terras; Construções e Reformas; Materiais de Construção.
  * Compra de Material Hidráulico -> "INFRAESTRUTURA E UTILIDADES".
- "ADMINISTRATIVAS": Honorários (Contábeis, Advocatícios, Agronômicos); Despesas Bancárias e Financeiras.
- "SEGUROS E PROTEÇÃO": Seguro Agrícola; Seguro de Ativos (Máquinas/Veículos); Seguro Prestamista.
- "IMPOSTOS E TAXAS": ITR, IPTU, IPVA, INCRA-CCIR.
- "INVESTIMENTOS": Aquisição de Máquinas e Implementos; Aquisição de Veículos; Aquisição de Imóveis; Infraestrutura Rural.
- tipoDespesa: UMA categoria oficial (a predominante).
- classificacaoDespesa: array com 1 ou mais categorias oficiais (permite múltiplas se itens mistos).

RESPOSTA: exclusivamente JSON válido, sem markdown, sem texto extra.
`;

const MISTRAL_API_BASE_URL = 'https://api.mistral.ai/v1';
const MISTRAL_OCR_MODEL = 'mistral-ocr-latest';

// Modelos de chat que estruturam o texto do OCR, em ordem de preferência
const EXTRACTION_MODELS = ['mistral-medium-latest', 'mistral-small-latest'];

// Missing values are nullable so the model can report uncertainty instead of inventing data.
export const INVOICE_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    fornecedor: {
      type: 'object',
      additionalProperties: false,
      properties: {
        razaoSocial: { type: 'string' },
        nomeFantasia: { type: ['string', 'null'] },
        cnpj: { type: 'string' },
      },
      required: ['razaoSocial', 'nomeFantasia', 'cnpj'],
    },
    faturado: {
      type: 'object',
      additionalProperties: false,
      properties: { nomeCompleto: { type: 'string' }, cpf: { type: 'string' } },
      required: ['nomeCompleto', 'cpf'],
    },
    numeroNotaFiscal: { type: 'string' },
    dataEmissao: { type: ['string', 'null'] },
    descricaoProdutos: { type: 'array', items: { type: 'string' } },
    quantidadeParcelas: { type: ['integer', 'null'] },
    parcelas: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          numero: { type: 'integer' },
          dataVencimento: { type: ['string', 'null'] },
          valor: { type: ['number', 'null'] },
        },
        required: ['numero', 'dataVencimento', 'valor'],
      },
    },
    dataVencimento: { type: ['string', 'null'] },
    valorTotal: { type: ['number', 'null'] },
    tipoDespesa: { type: 'string' },
    classificacaoDespesa: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'fornecedor',
    'faturado',
    'numeroNotaFiscal',
    'dataEmissao',
    'descricaoProdutos',
    'quantidadeParcelas',
    'parcelas',
    'dataVencimento',
    'valorTotal',
    'tipoDespesa',
    'classificacaoDespesa',
  ],
} as const;

export interface InvoiceExtractionResult {
  data: ExtractedInvoiceData;
  review: InvoiceReview;
}

interface MistralOcrResponse {
  pages?: {
    index: number;
    markdown: string;
    confidence_scores?: {
      average_page_confidence_score?: number;
      minimum_page_confidence_score?: number;
    } | null;
  }[];
}

interface MistralChatResponse {
  choices?: { message?: { content?: string | null } }[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callMistral<T>(apiKey: string, path: string, body: unknown): Promise<T> {
  const response = await fetch(`${MISTRAL_API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `Mistral API ${path} respondeu ${response.status}: ${errorText || response.statusText}`
    );
  }

  return (await response.json()) as T;
}

/** Tenta de novo uma vez quando a API está sobrecarregada (429/503). */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!/ 429| 503|rate limit|overloaded|unavailable/i.test(msg)) throw err;
    console.warn('Mistral sobrecarregada, aguardando antes de tentar novamente...');
    await sleep(2500);
    return fn();
  }
}

async function extractPdfTextWithMistralOcr(
  apiKey: string,
  pdfBuffer: Buffer
): Promise<{ text: string; pages: OcrPageConfidence[] }> {
  const ocr = await withRetry(() =>
    callMistral<MistralOcrResponse>(apiKey, '/ocr', {
      model: MISTRAL_OCR_MODEL,
      document: {
        type: 'document_url',
        document_url: `data:application/pdf;base64,${pdfBuffer.toString('base64')}`,
      },
      include_image_base64: false,
      confidence_scores_granularity: 'page',
    })
  );

  const markdown = (ocr.pages ?? [])
    .sort((a, b) => a.index - b.index)
    .map((page) => `--- Página ${page.index + 1} ---\n${page.markdown}`)
    .join('\n\n')
    .trim();

  if (!markdown) {
    throw new Error('O Mistral OCR não retornou texto para o documento enviado.');
  }

  const pages = (ocr.pages ?? []).map((page) => ({
    index: page.index,
    average: page.confidence_scores?.average_page_confidence_score ?? null,
    minimum: page.confidence_scores?.minimum_page_confidence_score ?? null,
  }));
  return { text: markdown, pages };
}

/** Normaliza tipos, datas, valores e categorias do JSON devolvido pelo modelo. */
export function sanitizeExtraction(parsed: ExtractedInvoiceData): ExtractedInvoiceData {
  // Sanitizações de integridade
  if (!parsed.fornecedor) {
    parsed.fornecedor = { razaoSocial: '', nomeFantasia: null, cnpj: '' };
  }
  if (typeof parsed.fornecedor.razaoSocial !== 'string') {
    parsed.fornecedor.razaoSocial = String(parsed.fornecedor.razaoSocial ?? '');
  }
  if (typeof parsed.fornecedor.cnpj !== 'string') {
    parsed.fornecedor.cnpj = String(parsed.fornecedor.cnpj ?? '');
  }
  if (parsed.fornecedor.nomeFantasia === undefined) {
    parsed.fornecedor.nomeFantasia = null;
  }
  if (!parsed.faturado) {
    parsed.faturado = { nomeCompleto: '', cpf: '' };
  }
  if (typeof parsed.faturado.nomeCompleto !== 'string') {
    parsed.faturado.nomeCompleto = String(parsed.faturado.nomeCompleto ?? '');
  }
  if (typeof parsed.faturado.cpf !== 'string') {
    parsed.faturado.cpf = String(parsed.faturado.cpf ?? '');
  }
  if (typeof parsed.numeroNotaFiscal !== 'string') {
    parsed.numeroNotaFiscal = String(parsed.numeroNotaFiscal ?? '');
  }
  parsed.dataEmissao = normalizarDataBR(parsed.dataEmissao);
  parsed.dataVencimento = normalizarDataBR(parsed.dataVencimento);
  if (!Array.isArray(parsed.descricaoProdutos)) {
    parsed.descricaoProdutos = parsed.descricaoProdutos ? [String(parsed.descricaoProdutos)] : [];
  }
  parsed.descricaoProdutos = parsed.descricaoProdutos.map((d) => String(d));
  parsed.valorTotal = parseValorBR(parsed.valorTotal);
  if (!Array.isArray(parsed.parcelas)) parsed.parcelas = [];
  parsed.parcelas = parsed.parcelas.map((p, idx) => ({
    numero: Number.parseInt(String(p.numero), 10) || idx + 1,
    dataVencimento: normalizarDataBR(p.dataVencimento),
    valor: parseValorBR(p.valor),
  }));
  parsed.quantidadeParcelas =
    Number.parseInt(String(parsed.quantidadeParcelas), 10) || parsed.parcelas.length || null;
  if (!parsed.dataVencimento && parsed.parcelas.length > 0) {
    parsed.dataVencimento = parsed.parcelas[0].dataVencimento;
  }
  // Normaliza categorias para o padrão oficial da atividade
  if (typeof parsed.tipoDespesa !== 'string') {
    parsed.tipoDespesa = String(parsed.tipoDespesa ?? '');
  }
  const tipoNormalizado = normalizarCategoria(parsed.tipoDespesa);
  parsed.tipoDespesa = tipoNormalizado || '';
  if (!Array.isArray(parsed.classificacaoDespesa)) {
    parsed.classificacaoDespesa = parsed.tipoDespesa ? [parsed.tipoDespesa] : [];
  }
  parsed.classificacaoDespesa = parsed.classificacaoDespesa
    .map((c) => normalizarCategoria(c) || '')
    .filter(Boolean);
  if (parsed.classificacaoDespesa.length === 0 && parsed.tipoDespesa)
    parsed.classificacaoDespesa = [parsed.tipoDespesa];
  if (!parsed.tipoDespesa && parsed.classificacaoDespesa.length > 0) {
    parsed.tipoDespesa = parsed.classificacaoDespesa[0];
  }
  return parsed;
}

// A chave fica só no servidor: nunca é aceita do navegador
export async function processInvoicePdfWithMistral(
  pdfBuffer: Buffer
): Promise<InvoiceExtractionResult> {
  const apiKey = process.env.MISTRAL_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      'Serviço de leitura de notas não configurado: defina o segredo MISTRAL_API_KEY no servidor (ou em .env.local no desenvolvimento).'
    );
  }

  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error('Arquivo PDF vazio ou inválido.');
  }

  if (!pdfBuffer.subarray(0, 5).toString('latin1').startsWith('%PDF')) {
    throw new Error('Arquivo inválido: o conteúdo não é um PDF.');
  }

  let ocr: { text: string; pages: OcrPageConfidence[] };
  try {
    ocr = await extractPdfTextWithMistralOcr(apiKey, pdfBuffer);
  } catch (err) {
    throw new Error(
      `Falha ao ler a nota fiscal com o Mistral OCR: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const prompt = `Abaixo está o texto (em markdown) extraído por OCR de um documento fiscal em PDF.
Extraia todos os campos obrigatórios conforme as instruções do sistema.
Devolva rigorosamente o JSON contendo:
- fornecedor (razaoSocial, nomeFantasia, cnpj)
- faturado (nomeCompleto, cpf)
- numeroNotaFiscal
- dataEmissao
- descricaoProdutos (array de strings)
- quantidadeParcelas (número)
- parcelas (array com numero, dataVencimento, valor)
- dataVencimento
- valorTotal (número)
- tipoDespesa (classificação interpretada)
- classificacaoDespesa (array de strings)

TEXTO DO DOCUMENTO:
${ocr.text}`;

  let lastError: unknown = null;

  for (const modelName of EXTRACTION_MODELS) {
    try {
      const completion = await withRetry(() =>
        callMistral<MistralChatResponse>(apiKey, '/chat/completions', {
          model: modelName,
          messages: [
            { role: 'system', content: INVOICE_EXTRACTION_SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'invoice_extraction',
              schema: INVOICE_RESPONSE_SCHEMA,
              strict: true,
            },
          },
          temperature: 0.1,
        })
      );

      const rawText = completion.choices?.[0]?.message?.content?.trim() || '';

      // Limpeza caso venha envolvido em blocos ```json ... ```
      const cleanedJson = rawText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const data = sanitizeExtraction(JSON.parse(cleanedJson) as ExtractedInvoiceData);
      return { data, review: evaluateInvoiceQuality(data, ocr.pages) };
    } catch (err) {
      lastError = err;
      console.warn(
        `Tentativa com o modelo ${modelName} falhou, tentando próximo modelo se disponível...`,
        err
      );
    }
  }

  throw new Error(
    `Falha ao processar a nota fiscal com a Mistral: ${lastError instanceof Error ? lastError.message : String(lastError)}`
  );
}
