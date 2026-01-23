---
status: active
generated: 2026-01-23
title: "Feature F5: Relatórios Avançados e Consultor IA"
summary: "Implementar tela de relatórios com gráficos avançados (evolução, categorias) e Consultor Financeiro com IA (Gemini) para usuários Premium."
priority: high
complexity: high
estimated_hours: 34
agents:
  - type: "architect-specialist"
    role: "Definir arquitetura do serviço de relatórios e integração IA"
  - type: "feature-developer"
    role: "Implementar telas de gráficos e lógica de IA"
  - type: "frontend-specialist"
    role: "Criar componentes visuais de gráficos e cards de insights"
  - type: "backend-specialist"
    role: "Criar Edge Functions para análise pesada se necessário (ou service local)"
  - type: "test-writer"
    role: "Criar testes para serviços de exportação e cálculos"
docs:
  - "project-overview.md"
  - "architecture.md"
phases:
  - id: "P"
    name: "Planning"
    prevc: "P"
    status: completed
  - id: "R"
    name: "Review"
    prevc: "R"
    status: completed
  - id: "E"
    name: "Execution"
    prevc: "E"
    status: completed
  - id: "V"
    name: "Verification"
    prevc: "V"
    status: completed
  - id: "C"
    name: "Completion"
    prevc: "C"
    status: completed
---

# Feature F5: Relatórios Avançados e Consultor IA (Pro)

> Criar tela de relatórios com visualizações avançadas: gráficos de evolução, comparativos mensais, análise por categoria e export de dados. Inclui Consultor Financeiro com IA que analisa dados para fornecer insights personalizados. Exclusivo para usuários Premium.

## 🎯 Objetivos

### Relatórios Visuais

- [ ] Gráfico de evolução patrimonial (linha)
- [ ] Gráfico de gastos por categoria (pizza/donut)
- [ ] Comparativo mês a mês (barras)
- [ ] Resumo de receitas vs despesas
- [ ] Filtro por período customizado

### Consultor Financeiro IA 🤖

- [ ] Análise de gastos por período (semana, mês, ano)
- [ ] Identificação de gastos desnecessários ou excessivos
- [ ] Comparativo de gastos entre meses
- [ ] Sugestões de economia e previsões

### Exportação

- [ ] Export PDF dos dados e insights
- [ ] Paywall para usuários Free

## 📦 Entregáveis

### Fase 1: Infraestrutura e Serviços (8h)

#### 1.1 - Setup de Gráficos

- Instalar `victory-native` (já está no package.json, verificar configuração) ou configurar componentes base.

#### 1.2 - AI Advisor Service

- `src/services/aiAdvisor.ts`: Integrar com Gemini API para análise em lote de transações.
- Prompt Engineering para gerar insights financeiros úteis.

### Fase 2: Componentes de UI (12h)

#### 2.1 - Componentes de Gráfico

- `src/components/reports/EvolutionChart.tsx`
- `src/components/reports/CategoryPieChart.tsx`
- `src/components/reports/MonthlyBarChart.tsx`

#### 2.2 - Cards de IA

- `src/components/reports/AIInsightsCard.tsx`
- `src/components/reports/SpendingAlertCard.tsx`

### Fase 3: Telas e Integração (10h)

#### 3.1 - Tela de Relatórios

- `app/(app)/reports/overview.tsx`: Dashboard de relatórios.
- Filtros de período (Mês atual, últimos 3 meses, ano).

#### 3.2 - Paywall Gate

- Bloquear acesso à tela/tab `Realtórios` ou mostrar overlay para usuários Free.

### Fase 4: Exportação e Polimento (4h)

- Implementar geração de PDF básico com `expo-print`.

## 🔄 Fluxo de Funcionamento (IA)

1. Usuário abre aba "Relatórios".
2. App carrega transações do período.
3. Se Premium:
   - `AIAdvisorService` envia resumo anonimizado para Gemini.
   - Retorna JSON com insights (alertas, elogios, dicas).
   - Renderiza `AIInsightsCard`.
4. Se Free:
   - Mostra preview borrado ou limitado.
   - Botão "Desbloquear com Pro".

## ✅ Critérios de Sucesso

- [ ] Usuário Pro consegue visualizar 3 tipos de gráficos.
- [ ] IA gera pelo menos 3 insights relevantes baseados nos dados reais.
- [ ] Usuário Free é barrado pelo Paywall ao tentar acessar.
- [ ] Gráficos são performáticos e não travam a UI.

## 🔗 Dependências

- `victory-native` (Gráficos)
- `Google Generative AI` (Consultor)
- `RevenueCat` (Controle de acesso)
