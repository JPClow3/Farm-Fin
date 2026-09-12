# Prática de Engenharia de Software — Atividade 1° Etapa

## Processador Inteligente de PDF de Nota Fiscal (Contas a Pagar) com Agents Gemini

Demonstração funcional desenvolvida exclusivamente para a entrega da **ATIVIDADE 1° ETAPA** da disciplina de **Prática de Engenharia de Software**.

O sistema implementa um processador inteligente de documentos fiscais em PDF utilizando o modelo multimodal **Google Gemini (Vision)** para extrair os dados de uma nota fiscal (Contas a Pagar), interpretar semanticamente a despesa e devolver o resultado estritamente em formato **JSON na tela**.

---

## 📋 Requisitos e Campos Extraídos

Conforme as especificações obrigatórias da atividade:

1. **Fornecedor**: Razão Social / Fantasia / CNPJ
2. **Faturado**: Nome Completo / CPF
3. **Número da Nota Fiscal**: Identificador oficial do documento
4. **Data de Emissão**: Formato `AAAA-MM-DD`
5. **Descrição dos produtos**: Lista com as descrições dos itens/serviços faturados (sem necessidade de entidade complexa)
6. **Quantidade de Parcelas**: Número de parcelas (com estrutura para receber múltiplas parcelas)
7. **Data de Vencimento**: Vencimento da fatura/parcela
8. **Valor Total**: Montante total da nota fiscal
9. **Tipo de Despesa (Classificação Semântica Inteligente)**:
   - **A despesa NÃO é um campo extraído do texto físico da nota.**
   - O agente **Gemini** analisa a natureza dos produtos faturados e infere a categoria adequada.
   - *Exemplos atendidos conforme o enunciado:*
     - **Compra de Óleo Diesel** &rarr; Classifica-se na categoria `MANUTENÇÃO E OPERAÇÃO`
     - **Compra de Material Hidráulico** &rarr; Classifica-se na categoria `INFRAESTRUTURA E UTILIDADES`
     - Outras categorias: `INSUMOS AGRÍCOLAS`, `COMBUSTÍVEIS E ENERGIA`, `SERVIÇOS E MÃO DE OBRA`, `ADMINISTRATIVO E TRIBUTÁRIO`, `OUTROS`.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Node.js**: Versão 18 ou superior instalada.
- **NPM**: Gerenciador de pacotes padrão.

### Passo 1: Instalar dependências
Abra o terminal na pasta do projeto e execute:
```bash
npm install
```

### Passo 2: Configuração da Chave de API
O arquivo `.env` já está incluso na raiz do projeto com a chave da API do Gemini pronta para uso:
```env
GEMINI_API_KEY="AQ.Ab8RN6JKGPkySYhtciwzp7VprS_RlYu6-vIV_OatV7XbZTvHVw"
```
*(Caso queira utilizar outra chave, basta alterar o `.env` ou informá-la diretamente na interface gráfica).*

### Passo 3: Iniciar o servidor de desenvolvimento
```bash
npm run dev
```

### Passo 4: Acessar a aplicação
Abra o navegador no endereço:
```
http://localhost:3000
```

---

## 🧪 Como Testar a Extração

1. Na tela inicial, clique no botão **"Carregar PDF de Exemplo (Teste Rápido)"** para testar instantaneamente com a DANFE inclusa (compra de Óleo Diesel e Filtro de Combustível).
   - *Ou arraste/selecione qualquer outro PDF de nota fiscal do seu computador.*
2. Clique no botão **"Extrair Dados da Nota Fiscal"**.
3. O agente aciona o Google Gemini, que processa a visão do documento PDF, extrai os campos e classifica a despesa.
4. O resultado é exibido **estritamente em formato JSON na tela**, com botões para **Copiar JSON** e **Baixar .json**.

---

## 📂 Estrutura do Projeto

```
atividade-processador-nf/
├── .env                       # Chave da API do Gemini pré-configurada
├── .env.example               # Exemplo de configuração de variáveis
├── package.json               # Dependências do Next.js e @google/genai
├── tsconfig.json              # Configuração do compilador TypeScript
├── next.config.ts             # Configuração do Next.js
├── README.md                  # Este guia de execução
├── exemplo-nota-fiscal/       # Arquivo PDF de exemplo (DANFE Óleo Diesel)
│   └── DANFE_Oleo_Diesel_Exemplo.pdf
├── public/                    # Arquivos públicos estáticos
│   └── exemplo-danfe.pdf
└── src/
    ├── app/
    │   ├── layout.tsx         # Layout base da aplicação
    │   ├── page.tsx           # Interface gráfica Web com dropzone e visualizador JSON
    │   ├── globals.css        # Estilos modernos e responsivos
    │   └── api/
    │       └── extrair-nf/    # Endpoint backend para upload e acionamento da IA
    │           └── route.ts
    └── lib/
        └── geminiInvoiceAgent.ts  # Agente Gemini com prompt, schema e lógica semântica
```

---

## 🛠️ Tecnologias Utilizadas

- **Next.js 15 (App Router)** &mdash; Framework React fullstack para Web UI e API Routes.
- **React 19** &mdash; Biblioteca de componentes de interface de usuário.
- **TypeScript** &mdash; Tipagem estrita para schemas fiscais e integração.
- **Google Gen AI SDK (`@google/genai`)** &mdash; SDK oficial do Google para modelos multimodais Gemini.
- **Gemini 3.6 Flash / Vision** &mdash; Processamento nativo de documentos PDF e inferência semântica.
- **Lucide React** &mdash; Ícones da interface gráfica.
