# Farm-Fin 🌾🚜

> **Sistema Completo de Gestão Financeira, Orçamentária e Agronômica para Produtores Rurais e Fazendas**

O **Farm-Fin** é uma plataforma moderna desenvolvida especificamente para o agronegócio brasileiro, unindo rigor contábil-financeiro a controles operacionais de campo (safras, talhões, insumos, maquinários, contratos de barter e hedge, fluxo de caixa, LCDPR e DRE).

---

## 🚀 Funcionalidades Principais

- **Cadastros Base (EP-01)**: Gestão de Fazendas (com CAR), Talhões (com GPS e tipos de solo), Safras e Culturas, Fornecedores e Clientes (com validação de duplicidade de CNPJ/CPF), Maquinário e Funcionários/Colaboradores com custos por hora.
- **Contas a Pagar (EP-02)**: Lançamento de despesas, parcelamentos, gestão de anexos/NF-e, fluxo de aprovação de diretoria, gestão de recorrência periódica, Aging List de atrasos e cockpit de alertas de vencimento (3d, 7d, hoje, vencidas).
- **Contas a Receber, Barter & Hedge (EP-03)**: Vendas spot, entregas futuras, contratos de **Barter de Insumos** com liquidação física simultânea do título a pagar, operações de **Hedge** cambial/commodities com workflow de fixação de preço (*A Fixar* ➔ *Fixar Preço*) e rastreamento em múltiplas unidades (Sacas, Toneladas, Arrobas, Kg).
- **Fluxo de Caixa & Simulação de Cenários (EP-04)**: Visão consolidada ou filtrada por conta bancária, periodicidade diária/semanal/mensal/safra anual, motor de stress testing (cenários Realista, Otimista, Pessimista e Personalizado) com comparador lado a lado e **exportação nativa para .XLSX (Excel)**.
- **Conciliação Bancária (EP-05)**: Importação de arquivos OFX/CSV, correspondência automática com algoritmo de similaridade, conciliação manual e controle de pendências.
- **Estoque de Insumos & Livro Kardex (EP-06)**: Controle de almoxarifado, Custo Médio Ponderado (CMP), rastreabilidade por número de lote e data de validade, alertas de estoque mínimo e livro Kardex com saldo contábil em tempo real.
- **Custo por Talhão & Safra (EP-07)**: Apuração analítica de R$/ha por talhão, breakdown de insumos/máquinas/pessoal, comparativo histórico inter-safras e motor de **rateio de custos indiretos (overhead)**.
- **DRE Agrícola (EP-08)**: Demonstrativo de Resultado por Safra (Receita Bruta, Deduções, CPV Agrícola, Margem Bruta, Despesas Operacionais, EBITDA e Lucro Líquido) com **exportação para .XLSX** e impressão.
- **LCDPR — Livro Caixa Digital do Produtor Rural (EP-09)**: Conformidade com a Receita Federal do Brasil no **Layout 1.3 Oficial**, com apuração a partir dos dados do banco e download do arquivo `.txt`.

---

## 🛠️ Stack Tecnológica

- **Framework**: Next.js 15 (App Router), React 19
- **Linguagem**: TypeScript (Strict Mode)
- **Design System**: Clay Design System (Neumórfico Suave com tons da terra, oliva e terracota)
- **Banco de Dados**: Neon Serverless PostgreSQL com Drizzle ORM
- **Planilhas**: SheetJS (`xlsx`) para geração nativa de planilhas `.xlsx` multi-abas
- **Testes**: Vitest

---

## 📦 Instalação e Execução

1. **Clonar o repositório**:
   ```bash
   git clone https://github.com/usuario/farm-fin.git
   cd farm-fin
   ```

2. **Instalar as dependências**:
   ```bash
   npm install
   ```

3. **Configurar variáveis de ambiente**:
   ```bash
   cp .env.example .env.local
   ```

4. **Executar o ambiente de desenvolvimento**:
   ```bash
   npm run dev
   ```
   Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🧪 Testes e Validação de Código

- **Executar todos os testes automatizados**:
  ```bash
  npm test
  ```

- **Verificação de tipagem TypeScript**:
  ```bash
  npx tsc --noEmit
  ```

- **Executar linter**:
  ```bash
  npm run lint
  ```

---

## 📂 Estrutura de Pastas

```
├── .github/workflows/   # Workflows de CI/CD (GitHub Actions)
├── docs/                # Documentação técnica e User Stories
├── src/
│   ├── actions/         # Next.js Server Actions (finance, farm, dre, stock, etc.)
│   ├── app/             # Páginas e rotas da aplicação Next.js
│   ├── components/      # Componentes UI reutilizáveis (Clay Design System)
│   ├── context/         # Contextos React (FarmContext, ToastContext)
│   ├── db/              # Schema Drizzle ORM e seeds
│   ├── lib/             # Mappers, validações Zod, utilitários de exportação Excel
│   └── styles/          # Tokens e estilos CSS globais
└── vitest.config.ts     # Configuração de testes unitários
```

---

## 📄 Licença

Propriedade privada. Todos os direitos reservados.
