# Lógica de Fatura de Cartão de Crédito — Análise e Plano

## Objetivo
Documentar como a lógica de faturas funciona hoje, apontar problemas e definir uma proposta técnica clara para tornar o cálculo de fatura correto e consistente em todo o app.

## Mapa da lógica atual (onde a fatura nasce e é exibida)
- Modelo e campos base: `src/database/model/CreditCard.ts` define `closing_day`, `due_day`, `credit_limit`, `current_balance`.
- Criação do cartão: `app/(app)/cards/new.tsx` grava `current_balance` como “Fatura Atual” informada pelo usuário.
- Atualização de saldo do cartão: `FinancialService.createTransaction` aumenta `current_balance` em despesas no cartão.
- Pagamento de fatura: `FinancialService.payInvoice` reduz `current_balance` quando a fatura é paga.
- Fatura aberta (estimativa): `FinancialService.getCreditCards` calcula `next_invoice_estimate` somando transações após a última data de fechamento.
- Fatura por mês: `FinancialService.getCardTransactions` busca transações entre `invoiceStartDate` e `invoiceCloseDate`.
- Exibição no dashboard: `src/components/dashboard/BalanceCard.tsx` usa `current_balance` e `next_invoice_estimate` para “Fatura Fechada/Aberta”.
- Exibição na listagem: `app/(app)/cards/index.tsx` mostra “Fatura Atual” com `current_balance + next_invoice_estimate`.
- Exibição detalhada: `app/(app)/cards/[id].tsx` combina `current_balance`, `invoiceTotal` e status “Fechada/Estimado”.

## Problemas encontrados (impacto direto no usuário)
- Soma de fatura ignora o tipo da transação em `getCardTransactions`, o que superestima a fatura quando há estornos.
- Diferença de conceitos entre telas: `current_balance` é tratado como “fatura atual” em alguns pontos e como “fatura fechada” em outros.
- Cálculo de ciclo vulnerável a meses com menos dias, como `closing_day = 31` em fevereiro.
- `status` pendente tratado de forma inconsistente entre serviços.
- Pagamentos de fatura não aparecem na visão do cartão porque o pagamento não cria transação no cartão.
- Fatura aberta e fechada não são padronizadas entre `BalanceCard`, `cards/index` e `cards/[id]`.

## Definições canônicas recomendadas
- Fatura Fechada: ciclo encerrado no último `closing_day`.
- Fatura Aberta/Atual: ciclo em andamento desde o último fechamento.
- Fatura Parcial: total acumulado do ciclo atual até hoje (igual à fatura aberta).
- Limite Disponível: `credit_limit - (fatura_fechada + fatura_aberta)`.

## Algoritmo recomendado para ciclos
- `closingDate = min(closing_day, lastDayOfMonth)`
- `prevClosingDate = min(closing_day, lastDayOfMonth(month-1))`
- `startDate = dayAfter(prevClosingDate)`
- `endDate = closingDate`
- O ciclo da fatura é sempre `[startDate, endDate]`.
- Transações do cartão no ciclo entram na fatura.
- Estornos devem subtrair da fatura (tipo `income`).

## Plano técnico de refatoração futura (proposta)
- Criar util compartilhado em `src/utils/creditCardInvoice.ts` com funções `getInvoiceCycle`, `getOpenInvoiceRange`, `calcInvoiceTotal`, `calcOpenEstimate`.
- Unificar o cálculo de fatura em `FinancialService.getCreditCards`, `FinancialService.getCardTransactions`, `BalanceCard`, `cards/index` e `cards/[id]`.
- Corrigir soma com sinal: `expense` soma, `income` subtrai.
- Definir regra única para `current_balance`: manter como saldo real do cartão ou derivar sempre de transações.
- Normalizar tratamento de `pending` para não entrar em fatura fechada e, opcionalmente, entrar em prévia da fatura aberta.
- Ajustar criação/edição do cartão para converter “fatura atual” em transação de ajuste no cartão.

## Checklist de validação (quando refatorar)
- Fechamento 28, 30 e 31 em meses diferentes.
- Pagamento total da fatura.
- Pagamento parcial da fatura.
- Estorno (income) dentro do ciclo.
- Parcelamento que atravessa vários ciclos.
- Mudança de ano (dezembro → janeiro).
- Fatura fechada vs aberta exibindo o mesmo valor em todas as telas.

## Saída esperada após refatoração
- O usuário vê os mesmos valores em todos os pontos do app.
- A fatura fechada nunca inclui transações do ciclo aberto.
- Estornos reduzem corretamente o total da fatura.
- O “Total da Fatura” bate com a lista de transações.
