# Atividade 1° Etapa — Processador de PDF de Nota Fiscal (Contas a Pagar)

Página única e simples: o usuário anexa o PDF da nota fiscal, clica em **Extrair dados** e o sistema devolve o resultado em **JSON na tela**, usando Google Gemini.

> **Para rodar o projeto, siga o passo a passo detalhado em [COMO_EXECUTAR.md](./COMO_EXECUTAR.md).**

## Como executar

Pré-requisitos: Node.js 18+ e npm.

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

O arquivo `.env` já vai incluso no ZIP com a `GEMINI_API_KEY` configurada. Sem ele o professor não terá acesso ao Gemini. Não é preciso digitar chave na tela.

## Como testar

1. Selecione o PDF da nota fiscal (ex.: `exemplo-nota-fiscal/DANFE_000084682_IGUACU_teste_professor.pdf` — DANFE 000.084.682 da Iguacu Maquinas Agricolas Ltda).
2. Clique em **Extrair dados**.
3. O JSON aparece na tela, com botão **Copiar JSON**.

## Campos extraídos (obrigatórios)

- Fornecedor: Razão Social / Fantasia / CNPJ
- Faturado: Nome Completo / CPF
- Número da Nota Fiscal
- Data de Emissão (AAAA-MM-DD)
- Descrição dos produtos (lista de strings)
- Quantidade de Parcelas (estrutura preparada para N parcelas; hoje 1)
- Parcelas: `[{ numero, dataVencimento, valor }]`
- Data de Vencimento (AAAA-MM-DD)
- ValorTotal (número)
- Classificação da DESPESA (interpretada pelo Gemini, estrutura em array para N classificações)

A DESPESA não é extraída do texto: o Gemini interpreta os produtos e classifica em uma das 9 categorias oficiais:

- INSUMOS AGRÍCOLAS
- MANUTENÇÃO E OPERAÇÃO
- RECURSOS HUMANOS
- SERVIÇOS OPERACIONAIS
- INFRAESTRUTURA E UTILIDADES
- ADMINISTRATIVAS
- SEGUROS E PROTEÇÃO
- IMPOSTOS E TAXAS
- INVESTIMENTOS

Ex.: Óleo Diesel → MANUTENÇÃO E OPERAÇÃO. Material Hidráulico → INFRAESTRUTURA E UTILIDADES.

## Retorno esperado — DANFE 000.084.682 (teste do professor)

```json
{
  "fornecedor": {
    "razaoSocial": "IGUACU MAQUINAS AGRICOLAS LTDA",
    "nomeFantasia": null,
    "cnpj": "33.656.729/0023-85"
  },
  "faturado": {
    "nomeCompleto": "CICLANO DA SILVA",
    "cpf": "999.999.999-99"
  },
  "numeroNotaFiscal": "000.084.682",
  "dataEmissao": "2025-09-19",
  "descricaoProdutos": [
    "GRAXA DE POLIUREIA MP SD 400G",
    "ANEL O",
    "KIT DA BUCHA",
    "APOIO",
    "ANEL",
    "ROLAMENTO DE ESFERAS",
    "ROLAMENTO DE ROLOS CONICOS",
    "ESTOPA",
    "PANO PARA LIMPEZA",
    "LIMPADOR PREMIUM 115"
  ],
  "quantidadeParcelas": 1,
  "parcelas": [
    {
      "numero": 1,
      "dataVencimento": "2025-10-17",
      "valor": 3086.75
    }
  ],
  "dataVencimento": "2025-10-17",
  "valorTotal": 3086.75,
  "tipoDespesa": "MANUTENÇÃO E OPERAÇÃO",
  "classificacaoDespesa": ["MANUTENÇÃO E OPERAÇÃO"]
}
```

Peças de máquinas agrícolas (rolamento, bucha, anel, graxa) → MANUTENÇÃO E OPERAÇÃO.

## Estrutura

```
atividade-processador-nf/
├── COMO_EXECUTAR.md              # Passo a passo em português para rodar
├── README.md                     # Documentação técnica do projeto
├── .env                          # GEMINI_API_KEY (vai no ZIP)
├── .env.example
├── package.json
├── next.config.ts
├── tsconfig.json
├── exemplo-nota-fiscal/        # PDFs de teste
├── public/
└── src/
    ├── app/
    │   ├── page.tsx            # Página única: upload + botão + JSON
    │   ├── layout.tsx
    │   ├── globals.css
    │   └── api/extrair-nf/route.ts
    └── lib/geminiInvoiceAgent.ts
```

## Tecnologias

Next.js 15 (App Router), React 19, TypeScript, `@google/genai` (Gemini Flash + fallbacks lite com retry).
