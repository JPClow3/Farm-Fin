# COMO EXECUTAR — Passo a passo (Windows)

Guia em português para rodar o Processador de PDF de Nota Fiscal (Atividade 1° Etapa).
Tempo estimado: 5 minutos.

## 1. Pré-requisito: Node.js instalado

1. Abra o Prompt de Comando (`cmd`) ou PowerShell.
2. Digite e tecle Enter:
   ```
   node --version
   ```
3. Se aparecer algo como `v20.x.x` ou `v22.x.x`, está pronto. Precisa ser **versão 18 ou maior**.
4. Se der erro ("não é reconhecido"), instale o Node.js em https://nodejs.org (baixe a versão LTS),
   conclua a instalação, **feche e abra o terminal novamente** e repita o teste.

## 2. Abrir a pasta do projeto

1. Extraia o arquivo `atividade-processador-nf.zip` para uma pasta qualquer.
2. No terminal, entre na pasta extraída. Exemplo (ajuste o caminho):
   ```
   cd "C:\Users\SeuNome\Downloads\atividade-processador-nf"
   ```
3. Confirme que você está na pasta certa: o comando abaixo deve listar `package.json` e `.env.example`:
   ```
   dir
   ```

> Importante: os comandos a seguir devem ser executados **dentro** da pasta
> `atividade-processador-nf` (onde está o `package.json`).

## 3. Instalar as dependências (só na primeira vez)

```
npm install
```

Aguarde concluir (leva cerca de 1 minuto). Mensagens de `npm warn` podem ser ignoradas.

## 4. Configurar a chave da API

Por segurança, a chave da Mistral não vem dentro do ZIP. Se você recebeu o arquivo `.env` junto com o projeto, coloque-o nesta pasta. Caso contrário, crie-o a partir do exemplo:

```
copy .env.example .env
```

Abra o `.env` e troque `sua_chave_mistral_aqui` pela chave da Mistral. Confira que ele existe:

```
dir .env
```

Não é necessário digitar chave na tela do sistema.

## 5. Iniciar o sistema

```
npm run dev
```

Quando aparecer uma linha parecida com esta, o sistema está no ar:

```
- Local: http://localhost:3000
```

**Não feche esta janela do terminal** enquanto estiver usando o sistema.

## 6. Usar no navegador

1. Abra o navegador (Chrome ou Edge) no endereço:
   ```
   http://localhost:3000
   ```
2. Clique em **"Escolher arquivo"** e selecione um PDF de nota fiscal.
   Para teste rápido, use o arquivo que já vem no projeto:
   ```
   exemplo-nota-fiscal\DANFE_000084682_IGUACU_teste_professor.pdf
   ```
   (DANFE nº 000.084.682 — Iguacu Maquinas Agricolas Ltda.)
3. Clique em **"Extrair dados"**.
4. Aguarde cerca de 15 a 30 segundos (a primeira extração pode demorar um pouco).
5. O resultado aparece na tela em formato **JSON**, com botão **"Copiar JSON"**.

## 7. Resultado esperado (DANFE de teste 000.084.682)

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
  "quantidadeParcelas": 1,
  "dataVencimento": "2025-10-17",
  "valorTotal": 3086.75,
  "tipoDespesa": "MANUTENÇÃO E OPERAÇÃO",
  "classificacaoDespesa": ["MANUTENÇÃO E OPERAÇÃO"]
}
```

## 8. Como encerrar

No terminal onde o `npm run dev` está rodando, pressione `Ctrl + C` e confirme com `S` (ou `Y`).

## Problemas comuns

| Sintoma | Causa provável | Solução |
|---|---|---|
| `node` não é reconhecido | Node.js não instalado | Instale em https://nodejs.org e reabra o terminal |
| `npm error` na pasta errada | Terminal fora da pasta do projeto | Use `cd` até a pasta `atividade-processador-nf` e repita |
| `Port 3000 is in use` | Porta ocupada | Feche o outro programa ou rode com `npm run dev -- -p 3001` e acesse `http://localhost:3001` |
| Erro de chave / `MISTRAL_API_KEY` | Arquivo `.env` ausente | Verifique com `dir .env` se o arquivo existe na pasta do projeto |
| Extração demora na 1ª vez | Servidor compilando / IA processando | Aguarde até 1 minuto; as próximas são mais rápidas |
| `Formato inválido` | Arquivo não é PDF | Selecione um arquivo com extensão `.pdf` |
