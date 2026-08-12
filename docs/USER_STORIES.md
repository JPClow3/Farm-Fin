# User Stories e Épicos - Farm-Fin

## Roadmap de Implementação

```mermaid
gantt
    title Roadmap de Implementação - Farm-Fin
    dateFormat  YYYY-MM-DD
    axisFormat  %m/%Y
    
    section MVP (Fase 1)
    EP-01\: Cadastros Base         :done, mvp1, 2026-09-01, 30d
    EP-02\: Contas a Pagar         :active, mvp2, after mvp1, 20d
    EP-03\: Contas a Receber       :active, mvp3, after mvp2, 20d
    EP-10\: Dashboard Básico       :mvp4, after mvp3, 15d
    
    section V1 (Fase 2)
    EP-04\: Fluxo de Caixa         :v1_1, 2026-11-26, 20d
    EP-05\: Conciliação Bancária   :v1_2, after v1_1, 25d
    EP-06\: Estoque de Insumos     :v1_3, after v1_2, 30d
    EP-07\: Custo por Talhão/Safra :v1_4, after v1_3, 25d
    
    section V2 (Fase 3)
    EP-08\: DRE Agrícola           :v2_1, 2027-03-06, 25d
    EP-09\: LCDPR                  :v2_2, after v2_1, 30d
    EP-11\: Gestão de Usuários     :v2_3, after v2_2, 20d
    EP-12\: Configurações          :v2_4, after v2_3, 15d
```

## EP-01: Cadastros Base
### US01.01 - Cadastro de Fazendas
**Como** produtor rural, **quero** cadastrar minhas fazendas, **para** organizar e segregar os dados e resultados por propriedade.
**Critérios de aceite:**
- Permitir inserir nome, CPF/CNPJ associado, endereço e área total (hectares).
- Listar, editar e inativar fazendas cadastradas.
**Prioridade:** Alta | **Complexidade:** P

### US01.02 - Cadastro de Talhões
**Como** gerente agrícola, **quero** cadastrar os talhões de cada fazenda, **para** alocar insumos e apurar custos específicos de cada área.
**Critérios de aceite:**
- Vincular talhão a uma fazenda existente.
- Inserir nome/código e área útil (ha).
**Prioridade:** Alta | **Complexidade:** P

### US01.03 - Cadastro de Safras e Culturas
**Como** gestor, **quero** cadastrar safras e culturas, **para** controlar o ano agrícola e a produção específica.
**Critérios de aceite:**
- Cadastrar culturas (ex: Soja, Milho).
- Cadastrar safras (ex: 2026/2027) com data de início e fim.
**Prioridade:** Alta | **Complexidade:** P

### US01.04 - Cadastro de Fornecedores e Clientes
**Como** assistente financeiro, **quero** cadastrar fornecedores e clientes, **para** associá-los aos lançamentos de contas a pagar e receber.
**Critérios de aceite:**
- Capturar dados básicos (Razão Social, Nome Fantasia, CNPJ/CPF, contato, endereço).
- Evitar duplicidade de CNPJ/CPF.
**Prioridade:** Alta | **Complexidade:** M

### US01.05 - Categorias Financeiras e Contas Bancárias
**Como** assistente financeiro, **quero** definir o plano de contas gerencial e bancos, **para** classificar receitas e despesas corretamente.
**Critérios de aceite:**
- Criar categorias e subcategorias hierárquicas de receitas e despesas.
- Cadastrar contas bancárias com banco, agência, conta e saldo inicial.
**Prioridade:** Alta | **Complexidade:** P

### US01.06 - Cadastro de Maquinário e Colaboradores
**Como** gestor, **quero** cadastrar máquinas e funcionários, **para** ratear horas de trabalho e custos nas operações.
**Critérios de aceite:**
- Cadastrar frota (trator, colheitadeira) com chassi/placa e valor hora.
- Cadastrar colaboradores vinculando a função e custo hora.
**Prioridade:** Média | **Complexidade:** M

## EP-02: Contas a Pagar
### US02.01 - Lançamento de Conta a Pagar
**Como** assistente financeiro, **quero** lançar uma conta a pagar, **para** registrar uma despesa futura ou realizada.
**Critérios de aceite:**
- Inserir fornecedor, categoria, valor, data de vencimento e safra/talhão.
- Salvar como "pendente".
**Prioridade:** Alta | **Complexidade:** M

### US02.02 - Anexar Comprovante
**Como** assistente financeiro, **quero** anexar comprovantes em um lançamento, **para** ter o registro digital do boleto ou nota fiscal (NF-e).
**Critérios de aceite:**
- Fazer upload de arquivos PDF/JPG/PNG.
- Visualizar o anexo clicando em um ícone de clipe na conta.
**Prioridade:** Média | **Complexidade:** M

### US02.03 - Baixa de Pagamento
**Como** assistente financeiro, **quero** marcar uma conta como paga, **para** atualizar o saldo da conta bancária.
**Critérios de aceite:**
- Registrar data de pagamento, valor efetivamente pago (permitindo juros/desconto) e conta bancária de saída.
- Alterar status da conta para "paga".
**Prioridade:** Alta | **Complexidade:** M

### US02.04 - Alerta de Vencimento
**Como** gestor, **quero** receber alertas de contas vencendo, **para** evitar pagamento de juros e multas por atraso.
**Critérios de aceite:**
- Exibir notificação no sistema 2 dias antes do vencimento.
- Destacar visualmente (em vermelho) contas já vencidas.
**Prioridade:** Média | **Complexidade:** P

### US02.05 - Filtros, Edição e Aging
**Como** analista financeiro, **quero** filtrar contas, editar e visualizar o aging list, **para** planejar as saídas de caixa e corrigir erros.
**Critérios de aceite:**
- Filtrar por status, fornecedor, safra, talhão e categoria.
- Ver contas agrupadas por atraso (30, 60, 90+ dias).
- Permitir editar/cancelar contas não pagas.
**Prioridade:** Alta | **Complexidade:** M

## EP-03: Contas a Receber
### US03.01 - Registro de Venda
**Como** gestor, **quero** registrar uma venda de safra, **para** projetar a entrada de recursos na fazenda.
**Critérios de aceite:**
- Lançar cliente (comprador/trading), valor, data de previsão e safra associada.
**Prioridade:** Alta | **Complexidade:** M

### US03.02 - Contrato Antecipado (Barter)
**Como** produtor rural, **quero** registrar um contrato de barter, **para** vincular o pagamento de insumos à entrega física de grãos.
**Critérios de aceite:**
- Associar uma conta a receber a uma conta a pagar de insumos.
- Registrar produto, preço fixado e quantidade em sacas/toneladas negociadas.
**Prioridade:** Alta | **Complexidade:** G

### US03.03 - Parcelamento de Recebimento
**Como** gestor, **quero** dividir uma venda em parcelas, **para** refletir com precisão as condições comerciais negociadas com a trading.
**Critérios de aceite:**
- Gerar 'N' parcelas com vencimentos e valores distintos baseados no total da venda.
**Prioridade:** Média | **Complexidade:** M

### US03.04 - Baixa de Recebimento
**Como** assistente financeiro, **quero** dar baixa total ou parcial no recebimento, **para** conciliar o saldo da conta bancária e concluir a venda.
**Critérios de aceite:**
- Informar valor recebido, data de efetivação e banco de entrada.
- Atualizar status para "recebido" (ou parcialmente recebido).
**Prioridade:** Alta | **Complexidade:** P

### US03.05 - Filtro por Safra/Comprador
**Como** analista financeiro, **quero** filtrar os recebíveis, **para** avaliar o volume de vendas concentrado por safra ou cliente.
**Critérios de aceite:**
- Filtrar lista de contas a receber usando combobox de comprador ou safra.
**Prioridade:** Baixa | **Complexidade:** P

## EP-04: Fluxo de Caixa
### US04.01 - Visão Diária, Semanal e Mensal
**Como** produtor rural, **quero** visualizar o fluxo de caixa, **para** saber a posição de liquidez da fazenda no tempo.
**Critérios de aceite:**
- Alternar a visualização da tabela e gráficos para agrupamentos diários, semanais e mensais.
- Mostrar colunas: Saldo Inicial, Entradas, Saídas, Saldo Final.
**Prioridade:** Alta | **Complexidade:** M

### US04.02 - Projeção Futura
**Como** analista financeiro, **quero** ver a projeção futura do caixa, **para** antecipar necessidade de crédito ou de aplicação financeira.
**Critérios de aceite:**
- Incluir no fluxo o cálculo com base em contas a pagar e receber pendentes nas datas de vencimento projetadas.
**Prioridade:** Alta | **Complexidade:** M

### US04.03 - Filtro por Conta Bancária
**Como** gestor, **quero** ver o fluxo de caixa consolidado ou por conta específica, **para** planejar transferências e cobrir descobertos.
**Critérios de aceite:**
- O usuário deve poder selecionar uma, várias, ou todas as contas bancárias no filtro de visão.
**Prioridade:** Média | **Complexidade:** P

### US04.04 - Exportar Relatório
**Como** contador, **quero** exportar o fluxo de caixa, **para** manipular os dados, enviar ao banco ou apresentar em reunião.
**Critérios de aceite:**
- Botão "Exportar" gerando arquivo .XLSX (Excel) refletindo o período e filtros atuais.
**Prioridade:** Baixa | **Complexidade:** P

## EP-05: Conciliação Bancária
### US05.01 - Importar Extrato OFX/CSV
**Como** assistente financeiro, **quero** importar meu extrato bancário, **para** conferir as movimentações reais da conta contra o sistema.
**Critérios de aceite:**
- Suportar upload de arquivos OFX e CSV.
- Listar lançamentos do extrato lado a lado com os do sistema.
**Prioridade:** Alta | **Complexidade:** M

### US05.02 - Conciliação Automática
**Como** assistente financeiro, **quero** que o sistema encontre os correspondentes automaticamente, **para** poupar tempo no fechamento mensal.
**Critérios de aceite:**
- O sistema deve sugerir (match) conciliação baseada em valor exato e data próxima (+- 3 dias).
**Prioridade:** Alta | **Complexidade:** G

### US05.03 - Conciliação Manual
**Como** assistente financeiro, **quero** conciliar manualmente, **para** vincular pagamentos em lote ou recebimentos com taxas deduzidas.
**Critérios de aceite:**
- Permitir selecionar M lançamentos no sistema para 1 no banco, e vice-versa (N para M).
**Prioridade:** Alta | **Complexidade:** M

### US05.04 - Visualizar Diferenças
**Como** auditor, **quero** ver os lançamentos pendentes, **para** identificar omissões ou erros nos controles financeiros.
**Critérios de aceite:**
- Aba separada "Pendentes", exibindo lançamentos de banco não justificados e lançamentos de sistema não debitados/creditados.
**Prioridade:** Média | **Complexidade:** P

## EP-06: Estoque de Insumos
### US06.01 - Cadastro de Produto
**Como** almoxarife, **quero** cadastrar produtos (defensivos, sementes, fertilizantes), **para** controlar o que existe fisicamente na fazenda.
**Critérios de aceite:**
- Inserir nome, unidade de medida (L, Kg, SC), tipo/categoria e princípio ativo.
**Prioridade:** Alta | **Complexidade:** P

### US06.02 - Registrar Entrada
**Como** almoxarife, **quero** registrar a entrada de insumos, **para** atualizar o estoque após uma compra.
**Critérios de aceite:**
- Vincular a entrada a uma nota fiscal e fornecedor, informando quantidade e valor unitário (custo).
**Prioridade:** Alta | **Complexidade:** M

### US06.03 - Registrar Saída Vinculada a Talhão
**Como** agrônomo, **quero** registrar a saída (aplicação) de insumos, **para** descontar do estoque físico e alocar o custo diretamente ao talhão.
**Critérios de aceite:**
- Informar produto, quantidade retirada, data e qual(is) talhão(ões) receberam a aplicação.
- Deduzir do estoque e gerar movimento de custo agrícola.
**Prioridade:** Alta | **Complexidade:** G

### US06.04 - Alerta de Estoque Mínimo e Saldo
**Como** comprador, **quero** ver o saldo atual e ser avisado quando um produto atingir o limite, **para** evitar interrupção de operações.
**Critérios de aceite:**
- Mostrar saldo de estoque em tempo real.
- Definir quantidade mínima por produto e emitir alerta no sistema.
**Prioridade:** Média | **Complexidade:** P

### US06.05 - Rastreabilidade de Estoque
**Como** gerente de fazenda, **quero** ver a rastreabilidade (kardex) de um item, **para** entender quem retirou e para onde foi cada lote.
**Critérios de aceite:**
- Relatório mostrando entradas e saídas ordenadas cronologicamente com identificação do responsável e destino.
**Prioridade:** Alta | **Complexidade:** M

## EP-07: Custo por Talhão/Safra
### US07.01 - Custo Consolidado da Safra
**Como** produtor rural, **quero** ver o custo total consolidado da safra, **para** saber qual o volume financeiro investido na produção.
**Critérios de aceite:**
- Somatório de todos os custos variáveis e rateio de fixos atribuídos à safra selecionada.
**Prioridade:** Alta | **Complexidade:** M

### US07.02 - Comparar Talhões
**Como** agrônomo, **quero** comparar os custos entre diferentes talhões, **para** avaliar a eficiência operacional e áreas mais caras.
**Critérios de aceite:**
- Gráfico interativo comparando o custo total e custo/ha lado a lado entre os talhões da mesma fazenda.
**Prioridade:** Alta | **Complexidade:** M

### US07.03 - Comparar Safras
**Como** gestor, **quero** comparar os custos de produção da safra atual com a anterior, **para** avaliar evolução da inflação agrícola ou mudanças tecnológicas.
**Critérios de aceite:**
- Exibir relatório comparativo % e absoluto de custos entre duas safras selecionadas.
**Prioridade:** Média | **Complexidade:** G

### US07.04 - Breakdown de Custos
**Como** gestor, **quero** visualizar a quebra dos custos, **para** identificar quais rubricas pesam mais no orçamento (ex: sementes, defensivos, diesel).
**Critérios de aceite:**
- Exibir gráfico de pizza ou matriz mostrando a participação % de cada categoria de custo no talhão/safra.
**Prioridade:** Alta | **Complexidade:** M

### US07.05 - Custo por Hectare (R$/ha)
**Como** produtor rural, **quero** que os indicadores apresentem o custo relativo por hectare, **para** facilitar comparações entre propriedades de tamanhos diferentes.
**Critérios de aceite:**
- Ao lado do custo total, exibir sempre uma coluna/medida de "Custo / ha".
**Prioridade:** Alta | **Complexidade:** P

## EP-08: DRE Agrícola
### US08.01 - Gerar DRE por Safra
**Como** gestor financeiro, **quero** gerar um DRE (Demonstrativo de Resultado) da safra, **para** apurar a margem de contribuição, lucro ou prejuízo do ciclo.
**Critérios de aceite:**
- Estruturar: Receitas, Impostos incidentes, Custos Variáveis (Diretos), Margem de Contribuição, Custos Fixos (Indiretos) e Resultado Líquido.
**Prioridade:** Alta | **Complexidade:** G

### US08.02 - DRE por Talhão
**Como** agrônomo, **quero** visualizar o DRE no nível do talhão, **para** saber se aquela área de cultivo deu lucro individualmente.
**Critérios de aceite:**
- Filtrar o DRE, rateando receitas de produtividade estimadas e alocando os custos exatos lançados para o talhão.
**Prioridade:** Alta | **Complexidade:** G

### US08.03 - DRE por Período
**Como** contador, **quero** gerar um DRE por período de competência (mensal/anual), **para** a gestão contábil tradicional da fazenda.
**Critérios de aceite:**
- Gerar tabela considerando lançamentos pela data de competência (data de emissão/competência), independentemente da safra.
**Prioridade:** Média | **Complexidade:** M

### US08.04 - Exportar DRE (PDF/Excel)
**Como** produtor, **quero** exportar o DRE formatado, **para** envio para investidores ou gerente de banco ao pedir crédito.
**Critérios de aceite:**
- Gerar PDF paginado, com cabeçalho da empresa, ou arquivo em Excel para formatações complementares.
**Prioridade:** Média | **Complexidade:** P

## EP-09: LCDPR
### US09.01 - Configurar Dados do Produtor
**Como** contador, **quero** preencher os dados obrigatórios do produtor e imóveis rurais, **para** formar o cabeçalho e os registros base do livro caixa.
**Critérios de aceite:**
- Formulário validando CAEPF, NIRF, Inscrição Estadual, CPF e % de participação na exploração (condomínios).
**Prioridade:** Alta | **Complexidade:** M

### US09.02 - Gerar Arquivo LCDPR (.txt)
**Como** contador, **quero** exportar o arquivo do LCDPR do ano-calendário, **para** envio ao PVA da Receita Federal.
**Critérios de aceite:**
- O sistema deve compilar os registros Q100 (Livro Caixa) no layout .txt oficial e blocos 0000 e 9999.
**Prioridade:** Alta | **Complexidade:** G

### US09.03 - Validar Dados
**Como** contador, **quero** que o sistema valide a consistência dos dados antes de gerar o arquivo, **para** evitar erros no validador da Receita.
**Critérios de aceite:**
- Emitir relatório prévio avisando: Falta de CPF/CNPJ de fornecedores, contas bancárias sem cadastro, ou falta de tipo de documento no lançamento.
**Prioridade:** Alta | **Complexidade:** G

### US09.04 - Parametrização de Lançamentos
**Como** assistente financeiro, **quero** assinalar nas categorias ou no lançamento o que deve ir pro LCDPR, **para** ignorar despesas pessoais ou não dedutíveis (despesas de PF misturadas).
**Critérios de aceite:**
- Flag "Considerar no LCDPR" em nível de categoria (default) e passível de alteração na tela de lançamento.
**Prioridade:** Média | **Complexidade:** M

## EP-10: Dashboard
### US10.01 - Visão de KPIs Principais
**Como** produtor rural, **quero** ver indicadores chave no topo, **para** saber a saúde financeira do dia rapidamente.
**Critérios de aceite:**
- Cards contendo: Saldo em Bancos, Contas a Pagar (Hoje), Contas a Receber (Hoje) e Custo Acumulado (Safra Atual).
**Prioridade:** Alta | **Complexidade:** P

### US10.02 - Customizar Widgets
**Como** gerente, **quero** escolher quais gráficos quero ver na tela inicial, **para** ter um resumo focado nas minhas atribuições.
**Critérios de aceite:**
- Opção de adicionar/remover componentes gráficos (ex: "Evolução do Caixa" ou "Maiores Despesas") da visualização e salvar perfil.
**Prioridade:** Baixa | **Complexidade:** M

### US10.03 - Filtrar por Período/Safra
**Como** gestor, **quero** alternar o contexto do dashboard inteiro, **para** focar a análise numa safra específica ou trimestre.
**Critérios de aceite:**
- Filtro global no cabeçalho. Ao mudar de "Safra A" para "Safra B", todos os gráficos são recarregados.
**Prioridade:** Alta | **Complexidade:** M

### US10.04 - Painel de Alertas
**Como** usuário, **quero** visualizar notificações do sistema em um widget, **para** tomar ação corretiva imediata.
**Critérios de aceite:**
- Listagem dos 5 principais alertas (Estoque baixo, Contas vencidas, Arquivo rejeitado) clicáveis que redirecionem para a tela da ação.
**Prioridade:** Média | **Complexidade:** M

## EP-11: Gestão de Usuários e Segurança
### US11.01 - Criação de Usuário
**Como** administrador, **quero** cadastrar usuários, **para** dar acesso à equipe da fazenda.
**Critérios de aceite:**
- Criar por e-mail e envio de link para definição de senha.
**Prioridade:** Alta | **Complexidade:** P

### US11.02 - Definir Perfil de Acesso
**Como** administrador, **quero** atribuir um perfil a um usuário (Admin, Financeiro, Agronômico, Leitura), **para** bloquear ações proibidas.
**Critérios de aceite:**
- Usuário de "Leitura" não enxerga os botões de edição, salvar ou excluir.
- O sistema valida a permissão no backend a cada requisição.
**Prioridade:** Alta | **Complexidade:** G

### US11.03 - Acesso por Módulo
**Como** administrador, **quero** esconder módulos inteiros, **para** o agrônomo não ver o caixa, e o financeiro não bagunçar o estoque.
**Critérios de aceite:**
- Ao logar, a barra lateral de navegação exibe apenas os módulos liberados para o papel do usuário.
**Prioridade:** Média | **Complexidade:** M

### US11.04 - Log de Auditoria
**Como** auditor, **quero** acessar o rastro de alterações do sistema, **para** responsabilizar corretamente alterações ou exclusões indevidas.
**Critérios de aceite:**
- Tela de log exibindo Data/Hora, Usuário, IP, Módulo e Descrição da Ação (ex: "Excluiu Conta Pagar ID 1234").
**Prioridade:** Alta | **Complexidade:** G

## EP-12: Configurações
### US12.01 - Configurar Organização
**Como** proprietário, **quero** gerenciar as informações da minha empresa matriz, **para** que contratos, relatórios e e-mails usem os dados corretos.
**Critérios de aceite:**
- Campos de Razão Social, CNPJ, Inscrição Estadual, Endereço e Upload de Logo.
**Prioridade:** Alta | **Complexidade:** P

### US12.02 - Personalizar Categorias
**Como** contador, **quero** flexibilidade na árvore de categorias financeiras, **para** que eu adeque o DRE à realidade local.
**Critérios de aceite:**
- Permitir edição de nome de categorias, inativação e movimentação (re-parenting) de subcategorias, desde que não sejam obrigatórias do sistema.
**Prioridade:** Alta | **Complexidade:** M

### US12.03 - Definir Alertas
**Como** usuário, **quero** ligar ou desligar notificações no meu perfil, **para** evitar poluição visual ou excesso de e-mails.
**Critérios de aceite:**
- Tela de preferências pessoais com switches/toggles (ex: "Receber email resumo", "Pop-up vencimentos").
**Prioridade:** Baixa | **Complexidade:** M

### US12.04 - Gerenciar Contas Bancárias (Avançado)
**Como** gestor financeiro, **quero** inativar contas bancárias antigas e configurar limites, **para** controle de fôlego do cheque especial.
**Critérios de aceite:**
- Campo para inserção de Limite de Cheque Especial e botão para inativar conta (não excluir, preservando histórico).
**Prioridade:** Média | **Complexidade:** P
