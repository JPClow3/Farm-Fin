# Revisão de notas fiscais e cadastros

Acesse `/atividades/processador-nf` pelo menu. O fluxo usa a extração Mistral existente e apresenta os dados em um formulário editável. O JSON fica disponível em uma seção recolhida para copiar ou baixar.

1. Envie um PDF de até 20 MB e execute a leitura.
2. Confira empresa, destinatário, documento, produtos, classificação e parcelas. Empresa é consultada pelo CPF/CNPJ; produtos, pelo nome normalizado (maiúsculas e espaços).
3. O painel informa quais cadastros existem, estão inativos ou precisam ser criados. Após conferir com o PDF, use **Cadastrar empresa e produtos** para criar os ausentes e reativar os inativos, juntos, sem lançar um pagamento.
4. Para lançar a conta a pagar, complete os dados financeiros e confirme a revisão. O lançamento também resolve os cadastros ausentes e vincula os produtos, destinatário, classificações e parcelas ao movimento.

O catálogo fica em `/atividades/produtos`, com busca, edição, inativação e reativação. Ele pertence ao módulo de notas fiscais e não altera os saldos de estoque: o OCR atual extrai descrições, sem quantidades ou unidades de cada item.

## Banco de dados

Antes de disponibilizar esta versão em um ambiente existente, aplique as migrations pelo procedimento habitual (`npm run db:migrate`, com `DATABASE_URL` configurada). A migration `0007_nf_product_catalog.sql` cria:

- `produtos`, com unicidade de organização e descrição normalizada;
- `movimento_produto`, relacionando produtos aos movimentos.

A migration é aditiva. Os cadastros de pessoas e classificações existentes continuam sendo usados. O cadastro conjunto e o lançamento executam em transações: uma falha desfaz todas as alterações daquela operação. A mesma NF, identificada por organização, documento do fornecedor e número, recebe um bloqueio transacional antes da verificação de duplicidade e gravação.

O número da NF é comparado sem pontos, espaços ou zeros à esquerda para evitar uma segunda importação por diferença de formatação. Cadastros e lançamentos devem usar leituras atualizadas: no Hyperdrive deste aplicativo financeiro, mantenha o cache de consultas desabilitado, inclusive para autenticação e verificação logo após gravar.

## Versão publicada

O rodapé do login mostra a versão de `package.json` e o commit completo do build em `data-build-commit`, com um link para o GitHub. A configuração lê `WORKERS_CI_COMMIT_SHA` no Cloudflare, `GITHUB_SHA` no GitHub Actions ou o checkout local. Um build local com alterações é marcado como tal. A versão não depende de um SHA digitado no código.

## Validação

`src/actions/__tests__/invoice-catalog.test.ts` usa PostgreSQL embarcado (PGlite), aplica as migrations reais `0006` e `0007` e testa persistência, rollback, reuso, reativação, isolamento por organização, vínculo ao lançamento e duplicidade. Não depende de credenciais ou de um banco de produção.

Os testes da página cobrem cadastros ausentes, cadastro com pagamento incompleto, correção dos produtos, descarte de consultas antigas, recuperação de falha, permissões e conclusão do lançamento. Alterar os dados invalida a consulta e a confirmação anterior. Uma falha de consulta mantém as gravações bloqueadas até uma nova consulta bem-sucedida.

Esses testes verificam o fluxo após a extração, com resposta OCR controlada. A qualidade do OCR real continua coberta pelas verificações específicas do extrator e pelo benchmark existente.
