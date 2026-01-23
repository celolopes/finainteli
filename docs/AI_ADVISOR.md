# Consultor Financeiro IA (FinAInteli)

## Visão Geral

O Consultor IA analisa transações do usuário e fornece insights personalizados usando Google Gemini (modelo `gemini-3-flash-preview`).

## Funcionalidades

- **Análise Contextual**: Analisa gastos do período selecionado (Mês/Ano).
- **Detecção de Anomalias**: Alerta sobre aumentos significativos em categorias específicas.
- **Elogios**: Reconhece quando o usuário economiza.
- **Dicas Práticas**: Sugere ações para melhorar a saúde financeira.

## Arquitetura Técnica

### 1. Frontend (`app/(app)/reports/ai-advisor.tsx`)

- Tela dedicada acessível via Dashboard.
- Utiliza `AIRecommendationsList` para renderizar insights.
- Gerencia estado de loading e seleção de período.

### 2. Seviço de IA (`src/services/aiAdvisor.ts`)

- Interface entre o App e o Gemini.
- Define a estrutura de dados `FinancialAnalysis` e `AIInsight`.
- Constrói prompts otimizados para retornar JSON estrito.
- Realiza parse resiliente da resposta da IA.

### 3. Agregação de Dados (`src/services/financial.ts`)

- Novo método `getFinancialAnalysis(period)`:
  - Busca transações do período atual e anterior.
  - Calcula totais de Receita, Despesa e Economia.
  - Gera breakdown por categoria com percentuais.
  - Compara variações percentuais com o período anterior.

## Fluxo de Dados

1. Usuário abre a tela de Consultor.
2. App busca dados brutos no Supabase via `FinancialService`.
3. Dados são agregados localmente (somas, comparações).
4. Agregado JSON é enviado ao Gemini via `AIAdvisorService`.
5. Gemini retorna array de Insights JSON.
6. App renderiza cards interativos.

## Próximos Passos (Roadmap)

- Adicionar persistência de insights (salvar no banco para histórico).
- Implementar notificações push para insights críticos.
- Permitir feedback do usuário nos insights (útil/não útil).
