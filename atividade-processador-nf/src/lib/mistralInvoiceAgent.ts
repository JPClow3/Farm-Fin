export interface ExtractedInvoiceFornecedor {
  razaoSocial: string;
  nomeFantasia?: string | null;
  cnpj: string;
}

export interface ExtractedInvoiceFaturado {
  nomeCompleto: string;
  cpf: string;
}

export interface ExtractedInvoiceParcela {
  numero: number;
  dataVencimento: string; // Formato AAAA-MM-DD
  valor: number;
}

export interface ExtractedInvoiceData {
  fornecedor: ExtractedInvoiceFornecedor;
  faturado: ExtractedInvoiceFaturado;
  numeroNotaFiscal: string;
  dataEmissao: string; // Formato AAAA-MM-DD
  descricaoProdutos: string[];
  quantidadeParcelas: number;
  parcelas: ExtractedInvoiceParcela[];
  dataVencimento: string; // Formato AAAA-MM-DD da parcela principal/primeira
  valorTotal: number;
  tipoDespesa: string;
  classificacaoDespesa: string[];
}

const INVOICE_EXTRACTION_SYSTEM_PROMPT = `
Você é um Agente Especialista em Engenharia de Software e Processamento Inteligente de Documentos Fiscais (DANFE / NF-e / NFS-e / Contas a Pagar).
Sua missão é extrair rigorosamente os dados fiscais do documento PDF fornecido e classificá-los em formato JSON estruturado.

REGRAS DE EXTRAÇÃO:
1. Fornecedor (Emitente da Nota):
   - razaoSocial: Razão Social ou Nome do emitente
   - nomeFantasia: Nome Fantasia (se houver, senão null)
   - cnpj: CNPJ formatado ou apenas dígitos conforme o documento
2. Faturado (Destinatário / Tomador do Serviço / Cliente):
   - nomeCompleto: Nome completo da pessoa física ou destinatário
   - cpf: CPF formatado ou número do documento do faturado
3. Número da Nota Fiscal: número da NF / DANFE / NFS-e
4. Data de Emissão: no formato "AAAA-MM-DD"
5. Descrição dos produtos: lista com as descrições dos produtos ou serviços constantes no corpo da nota (NÃO crie entidade produtos complexa, apenas lista de strings descritivas)
6. Parcelas e Vencimento:
   - Identifique as faturas/duplicatas/parcelas. Se houver apenas uma ou não estiver explícito, considere 1 parcela.
   - quantidadeParcelas: número inteiro indicando o total de parcelas (mínimo 1)
   - parcelas: array com os objetos { numero: 1, dataVencimento: "AAAA-MM-DD", valor: 123.45 }
   - dataVencimento: data de vencimento da primeira parcela ou vencimento geral no formato "AAAA-MM-DD"
7. Valor Total: valor total da nota fiscal (numérico float, ex: 1250.50)

REGRA ESPECIAL DE CLASSIFICAÇÃO SEMÂNTICA (TIPO DE DESPESA):
O campo DESPESA NÃO é um campo extraído diretamente do texto da nota fiscal.
Você DEVE interpretar a natureza dos produtos ou serviços descritos e classificá-los nas categorias adequadas:
- "MANUTENÇÃO E OPERAÇÃO": Peças mecânicas, óleo diesel, lubrificantes, filtros, manutenções em tratores, máquinas agrícolas e implementos, oficinas.
  * EXEMPLO OBRIGATÓRIO: Compra de Oleo Diesel -> "MANUTENÇÃO E OPERAÇÃO"
- "INFRAESTRUTURA E UTILIDADES": Materiais hidráulicos (canos, tubos, conexões), materiais elétricos, mourões, arames, telas, cercas, cimento, tintas, reformas civis.
  * EXEMPLO OBRIGATÓRIO: Compra de Material Hidráulico -> "INFRAESTRUTURA E UTILIDADES"
- "INSUMOS AGRÍCOLAS": Adubos, fertilizantes, sementes, mudas, defensivos agrícolas, herbicidas, fungicidas, corretivos de solo.
- "COMBUSTÍVEIS E ENERGIA": Gasolina, etanol, energia elétrica, gás.
- "SERVIÇOS E MÃO DE OBRA": Fretes, consultoria agronômica, pulverização terceirizada, diaristas, honorários de serviços técnicos.
- "ADMINISTRATIVO E TRIBUTÁRIO": Materiais de escritório, licenças de software, certificação digital, tarifas e taxas.
- "OUTROS": Despesas que não se enquadrem nas categorias acima.

Campos de despesa no JSON:
- tipoDespesa: a categoria principal predominante (string única)
- classificacaoDespesa: array de strings com todas as classificações aplicáveis aos produtos (permite mais de uma categoria caso haja itens mistos)

FORMATO DE RESPOSTA:
Devolva EXCLUSIVAMENTE o objeto JSON válido, sem qualquer texto introdutório, sem tags de markdown, apenas o JSON puro.
`;

const MISTRAL_API_BASE_URL = 'https://api.mistral.ai/v1';
const MISTRAL_OCR_MODEL = 'mistral-ocr-latest';

// Modelos de chat usados para estruturar o texto do OCR, em ordem de preferência
const EXTRACTION_MODELS = ['mistral-medium-latest', 'mistral-small-latest'];

interface MistralOcrResponse {
  pages?: { index: number; markdown: string }[];
}

interface MistralChatResponse {
  choices?: { message?: { content?: string | null } }[];
}

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
    throw new Error(`Mistral API ${path} respondeu ${response.status}: ${errorText || response.statusText}`);
  }

  return (await response.json()) as T;
}

async function extractPdfTextWithMistralOcr(apiKey: string, pdfBuffer: Buffer): Promise<string> {
  const ocr = await callMistral<MistralOcrResponse>(apiKey, '/ocr', {
    model: MISTRAL_OCR_MODEL,
    document: {
      type: 'document_url',
      document_url: `data:application/pdf;base64,${pdfBuffer.toString('base64')}`,
    },
    include_image_base64: false,
  });

  const markdown = (ocr.pages ?? [])
    .sort((a, b) => a.index - b.index)
    .map((page) => `--- Página ${page.index + 1} ---\n${page.markdown}`)
    .join('\n\n')
    .trim();

  if (!markdown) {
    throw new Error('O Mistral OCR não retornou texto para o documento enviado.');
  }

  return markdown;
}

function sanitizeExtraction(parsed: ExtractedInvoiceData): ExtractedInvoiceData {
  if (!parsed.fornecedor) {
    parsed.fornecedor = { razaoSocial: 'Não identificado', nomeFantasia: null, cnpj: '' };
  }
  if (!parsed.faturado) {
    parsed.faturado = { nomeCompleto: 'Não identificado', cpf: '' };
  }
  if (!Array.isArray(parsed.descricaoProdutos)) {
    parsed.descricaoProdutos = parsed.descricaoProdutos ? [String(parsed.descricaoProdutos)] : [];
  }
  if (!Array.isArray(parsed.parcelas)) {
    parsed.parcelas = [
      {
        numero: 1,
        dataVencimento: parsed.dataVencimento || '',
        valor: Number(parsed.valorTotal) || 0,
      },
    ];
  }
  if (!parsed.quantidadeParcelas) {
    parsed.quantidadeParcelas = parsed.parcelas.length || 1;
  }
  if (!Array.isArray(parsed.classificacaoDespesa)) {
    parsed.classificacaoDespesa = parsed.tipoDespesa ? [parsed.tipoDespesa] : ['OUTROS'];
  }
  if (!parsed.tipoDespesa && parsed.classificacaoDespesa.length > 0) {
    parsed.tipoDespesa = parsed.classificacaoDespesa[0];
  }
  return parsed;
}

export async function processInvoicePdfWithMistral(
  pdfBuffer: Buffer,
  customApiKey?: string
): Promise<ExtractedInvoiceData> {
  const apiKey = (customApiKey || process.env.MISTRAL_API_KEY || '').trim();

  if (!apiKey) {
    throw new Error(
      'Chave da API da Mistral não configurada. Defina MISTRAL_API_KEY no arquivo .env.local ou informe a chave na interface.'
    );
  }

  let ocrText: string;
  try {
    ocrText = await extractPdfTextWithMistralOcr(apiKey, pdfBuffer);
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
${ocrText}`;

  let lastError: unknown = null;

  for (const modelName of EXTRACTION_MODELS) {
    try {
      const completion = await callMistral<MistralChatResponse>(apiKey, '/chat/completions', {
        model: modelName,
        messages: [
          { role: 'system', content: INVOICE_EXTRACTION_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      const rawText = completion.choices?.[0]?.message?.content?.trim() || '';

      // Limpeza caso venha envolvido em blocos ```json ... ```
      const cleanedJson = rawText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      return sanitizeExtraction(JSON.parse(cleanedJson) as ExtractedInvoiceData);
    } catch (err) {
      lastError = err;
      console.warn(`Tentativa com o modelo ${modelName} falhou, tentando próximo modelo se disponível...`, err);
    }
  }

  throw new Error(
    `Falha ao processar a nota fiscal com a Mistral: ${lastError instanceof Error ? lastError.message : String(lastError)}`
  );
}
