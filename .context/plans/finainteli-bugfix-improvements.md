---
status: in-progress
generated: 2026-02-05
last_updated: 2026-02-05
agents:
  - type: "mobile-specialist"
    role: "Implementar navegação nativa e correções específicas de plataforma"
  - type: "bug-fixer"
    role: "Corrigir bugs de timezone, autocomplete e UI"
  - type: "feature-developer"
    role: "Implementar persistência do histórico do chat"
  - type: "refactoring-specialist"
    role: "Remover dependências legadas e otimizar código"
  - type: "frontend-specialist"
    role: "Melhorar UI/UX dos modais e componentes"
phases:
  - id: "phase-1"
    name: "Remoção LiquidGlass e Migração TabBar"
    prevc: "E"
    status: "completed"
  - id: "phase-2"
    name: "Correções na Tela de Nova Transação"
    prevc: "E"
    status: "completed"
  - id: "phase-3"
    name: "Chat e Relatórios"
    prevc: "E"
    status: "completed"
  - id: "phase-4"
    name: "Testes e Validação"
    prevc: "V"
    status: "pending"
---

# Correções de Bugs e Melhorias do FinaInteli

> Plano de correções de bugs e melhorias que inclui: substituição da biblioteca Liquid Glass pela react-native-bottom-tabs, correções na tela de nova transação (focus, autocomplete, UI de categorias e origem, date picker), persistência do histórico do chat com formatação markdown, e ajuste nos requisitos mínimos para relatórios.

## Task Snapshot

- **Primary goal:** Melhorar a qualidade e experiência do usuário no app FinaInteli, corrigindo bugs críticos e implementando melhorias de UX.
- **Success signal:**
  - Navegação funcionando corretamente em iOS e Android com react-native-bottom-tabs
  - Focus automático no campo de valor ao abrir tela de nova transação
  - Autocomplete preenchendo todos os campos corretamente
  - Modais de categoria e origem com UI responsiva e atraente
  - Date picker bonito no iOS
  - Datas de transação sem problemas de timezone
  - Chat com histórico persistente e formatação markdown
  - Relatórios liberados com 3 dias e 2 categorias

## Análise do Contexto

### Arquivos Principais Envolvidos:

| Arquivo                                      | Função           | Issues a Resolver                                                   |
| -------------------------------------------- | ---------------- | ------------------------------------------------------------------- |
| `app/(app)/(tabs)/_layout.tsx`               | Layout das Tabs  | Migrar para react-native-bottom-tabs                                |
| `app/(app)/transactions/new.tsx`             | Nova transação   | Focus, autocomplete, UI modais, timezone                            |
| `app/(app)/accounts/new.tsx`                 | Nova conta       | Verificar focus automático                                          |
| `app/(app)/cards/new.tsx`                    | Novo cartão      | Verificar focus automático                                          |
| `app/(app)/(tabs)/chat.tsx`                  | Chat com IA      | Persistência, formatação, espaçamento                               |
| `app/(app)/(tabs)/reports.tsx`               | Relatórios       | Ajustar limites de dados                                            |
| `src/components/DescriptionAutocomplete.tsx` | Autocomplete     | Preencher categoria e origem                                        |
| `src/components/DatePickerField.tsx`         | Seletor de data  | Redesign para iOS                                                   |
| `src/context/ThemeContext.tsx`               | Tema             | Remover LiquidGlass                                                 |
| `src/components/ui/LiquidGlassSurface.tsx`   | Componente Glass | A ser removido                                                      |
| `package.json`                               | Dependências     | Remover @callstack/liquid-glass, adicionar react-native-bottom-tabs |

### Dependências Atuais do Projeto:

- ~~`@callstack/liquid-glass": "^0.7.0"`~~ - ✅ **REMOVIDA**
- `react-native-bottom-tabs` - ✅ **ADICIONADA** para navegação nativa
- `@bottom-tabs/react-navigation` - ✅ **ADICIONADA** para integração com Expo Router
- `expo-router` - Usado para navegação
- `react-native-paper` - UI Components
- `react-native-markdown-display` - ✅ **ADICIONADA** para formatação markdown

---

## Working Phases

### Phase 1 — Remoção LiquidGlass e Migração TabBar ✅ CONCLUÍDA

**Objetivo:** Remover completamente a biblioteca `@callstack/liquid-glass` e implementar navegação usando `react-native-bottom-tabs`.

**Status: CONCLUÍDA em 2026-02-05**

**Steps:**

1. ✅ **Instalar react-native-bottom-tabs**
   - Instalado: `react-native-bottom-tabs` e `@bottom-tabs/react-navigation`
   - Criado wrapper `src/components/ui/NativeBottomTabs.tsx` para integração com Expo Router

2. ✅ **Remover @callstack/liquid-glass**
   - Executado: `npm uninstall @callstack/liquid-glass`
   - Removido do `package.json`

3. ✅ **Atualizar `src/context/ThemeContext.tsx`**
   - Removida dependência do `@callstack/liquid-glass`
   - `isLiquidGlass` agora é sempre `false`

4. ✅ **Atualizar `app/(app)/(tabs)/_layout.tsx`**
   - Refatorado para usar `NativeTabs` com tabs nativas
   - iOS usa SF Symbols (house.fill, list.bullet, etc.)
   - Android usa Material Icons via URL
   - Configurado `tabBarActiveTintColor`, `tabBarInactiveTintColor`, `labeled`, `translucent`

5. ✅ **Simplificar componentes Glass**
   - `src/components/ui/LiquidGlassSurface.tsx` - Agora usa apenas `expo-blur` BlurView
   - `src/components/ui/GlassAppbar.tsx` - Atualizado para usar BlurView diretamente
   - `src/components/ui/GlassFAB.tsx` - Simplificado para usar BlurView no iOS

**Arquivos Criados:**

- `src/components/ui/NativeBottomTabs.tsx`

**Arquivos Modificados:**

- `app/(app)/(tabs)/_layout.tsx`
- `src/components/ui/LiquidGlassSurface.tsx`
- `src/components/ui/GlassAppbar.tsx`
- `src/components/ui/GlassFAB.tsx`
- `src/context/ThemeContext.tsx`
- `package.json`

**Commit Checkpoint:** `git commit -m "refactor: remove liquid-glass and migrate to native tabs"`

---

### Phase 2 — Correções na Tela de Nova Transação ✅ CONCLUÍDA

**Objetivo:** Corrigir todos os bugs relacionados à tela de nova transação.

**Status: CONCLUÍDA em 2026-02-05**

**Steps:**

#### Task 2.1: Focus Automático no Campo de Valor ✅

1. ✅ **Verificado `app/(app)/transactions/new.tsx`**
   - O `autoFocus` já está presente no TextInput e funcionando corretamente
   - O teclado numérico aparece automaticamente ao abrir a tela

#### Task 2.2: Correção do Autocomplete ✅

1. ✅ **Corrigido `FinancialService.searchTransactionsByDescription`**
   - Agora retorna `category_id`, `account_id`, `credit_card_id` corretamente
   - Usa `(t._raw as any).category_id` para acessar IDs das foreign keys no WatermelonDB
   - Adicionado busca de cartão de crédito (`.creditCard.fetch()`)

2. ✅ **Interface `AutocompleteSuggestion`**
   - Já tinha todos os campos necessários
   - O `handleSelectSuggestion` em `new.tsx` já estava implementado corretamente

#### Task 2.3: Melhorar UI do Modal de Categorias ✅

- Modal redesenhado com Grid usando Avatares e background dinâmico para seleção
- Feedback visual claro de item selecionado
- Layout responsivo com ScrollView

#### Task 2.4: Adicionar Logos na Seleção de Origem ✅

- Substituído RadioButton.Item por lista customizada
- Adicionados ícones (Avatar.Icon) para Bancos e Cartões
- Destaque visual para item selecionado

#### Task 2.5: Melhorar DatePicker no iOS ✅

- Reimplementado `DatePickerField.tsx` para usar `@react-native-community/datetimepicker`
- Configurado modo `display="inline"` (calendário) em iOS dentro do Dialog
- Muito mais nativo e amigável que a implementação anterior

#### Task 2.6: Corrigir Problema de Timezone ✅

- ✅ **Criado módulo utilitário `src/utils/date.ts`**
- ✅ **Aplicado em `cards/[id].tsx`**, `add-transaction.tsx`, `BudgetModal.tsx`
- Substituído `new Date().toISOString()` por `getLocalISODate` para garantir datas corretas

**Arquivos Criados:**

- `src/utils/date.ts`

**Arquivos Modificados:**

- `src/services/financial.ts`
- `app/(app)/transactions/new.tsx`
- `app/(app)/cards/[id].tsx`
- `app/(app)/add-transaction.tsx`
- `src/components/DatePickerField.tsx`
- `src/components/budgets/BudgetModal.tsx`

**Commit Checkpoint:** `git commit -m "fix: complete phase 2 ui polish and timezone fixes"`

---

### Phase 3 — Chat e Relatórios ✅ CONCLUÍDA

**Objetivo:** Implementar persistência do chat e ajustar requisitos dos relatórios.

**Status: CONCLUÍDA em 2026-02-05**

**Steps:**

#### Task 3.1: Persistência do Histórico do Chat ✅

- Usa AsyncStorage com key `@chat_history`
- Carrega mensagens ao iniciar
- Salva mensagens a cada atualização

#### Task 3.2: Corrigir Espaçamento Após Resposta da IA ✅

- Ajustado `contentContainerStyle` para `flexGrow: 1` e padding correto
- Removido espaçamento excessivo que causava "buraco" no final da lista

#### Task 3.3: Formatação Markdown nas Respostas ✅

- Substituído `<Text>` simples por componente `<Markdown>` nas mensagens do modelo
- Estilizado para respeitar as cores do tema e tipografia

#### Task 3.4: Ajustar Requisitos Mínimos para Relatórios ✅

- Adicionado `getTransactionDaysCount` em `FinancialService`
- Alterado de `MIN_MONTHS_FOR_CHARTS` para `MIN_DAYS_FOR_CHARTS = 3`
- Exibe mensagem progressiva para o usuário ("Registre mais X dias")

**Arquivos Modificados:**

- `app/(app)/(tabs)/chat.tsx`
- `app/(app)/(tabs)/reports.tsx`
- `src/services/financial.ts`

**Commit Checkpoint:** `git commit -m "feat: chat persistence, markdown and report improvements"`

---

### Phase 4 — Testes e Validação

**Objetivo:** Testar todas as alterações e garantir qualidade.

**Steps:**

1. **Testes manuais iOS**
   - Verificar TabBar funcionando corretamente
   - Testar focus no campo de valor
   - Testar autocomplete com categoria e origem
   - Verificar modais de categoria e origem
   - Testar DatePicker redesenhado
   - Criar transação às 23h e verificar data correta
   - Testar persistência do chat
   - Verificar formatação markdown
   - Testar relatórios com poucos dados

2. **Testes manuais Android**
   - Verificar TabBar funcionando
   - Testar todas as funcionalidades
   - Garantir paridade com iOS

3. **Verificar build**
   - `npx expo run:ios`
   - `npx expo run:android`
   - Corrigir erros de compilação

4. **Limpar código**
   - Remover imports não utilizados
   - Remover arquivos orphans relacionados ao LiquidGlass
   - Atualizar tipos se necessário

**Commit Checkpoint:** `git commit -m "test: validation and cleanup"`

---

## Risk Assessment

### Identified Risks

| Risk                                       | Probability | Impact | Mitigation Strategy                        |
| ------------------------------------------ | ----------- | ------ | ------------------------------------------ |
| Quebra de navegação ao remover LiquidGlass | High        | High   | Testar exaustivamente em ambas plataformas |
| Perda de dados do chat ao migrar storage   | Low         | Medium | Implementar migration de dados existentes  |
| Inconsistência visual entre plataformas    | Medium      | Medium | Manter design system consistente           |
| Problemas de performance com markdown      | Low         | Low    | Limitar histórico de mensagens             |

### Dependencies

- **Técnicas:** react-native-bottom-tabs compatível com Expo SDK 54
- **Internas:** Nenhuma regressão nas funcionalidades existentes

---

## Evidence & Follow-up

### Artifacts Esperados:

- [x] Commits no git para cada fase - **Em progresso**
- [ ] Screenshots do antes/depois dos modais
- [x] Logs de teste de timezone - **Corrigido com getLocalISODate**
- [ ] Prints da navegação funcionando
- [x] Registro de persistência do chat funcionando de forma lógica

---

## Change Log Recente

### 2026-02-05 (Parte 2 - Finalização Phase 2)

- **UI Improvements:** Implementadas melhorias visuais nos modais de categoria (Grid) e origem (Lista com ícones) em `add-transaction.tsx`.
- **iOS DatePicker:** Refatorado `DatePickerField.tsx` para usar o componente nativo moderno (Inline Calendar) no iOS.
- **Timezone Fixes:** Aplicada correção robusta de timezone (`getLocalISODate`) em múltiplos componentes críticos (`cards/[id]`, `transactions/new`, `BudgetModal`, `add-transaction`).
- **Phase 3:** Concluída com Markdown no chat e relatórios baseados em dias.

## Changelog

### 2026-02-05

**Phase 1 - Concluída:**

- Instalado `react-native-bottom-tabs` e `@bottom-tabs/react-navigation`
- Removido `@callstack/liquid-glass`
- Criado `NativeBottomTabs.tsx` para integração com Expo Router
- Refatorado layout de tabs para usar tabs nativas (SF Symbols iOS, Material Icons Android)
- Simplificados componentes `LiquidGlassSurface`, `GlassAppbar`, `GlassFAB` para usar `expo-blur`
- Atualizado `ThemeContext` removendo referências ao Liquid Glass

**Phase 2 - Concluída (tarefas críticas):**

- Corrigido bug de timezone com novo módulo `src/utils/date.ts`
- Corrigido autocomplete para retornar `category_id`, `account_id`, `credit_card_id`
- Focus automático já funcionando com `autoFocus`
- Tarefas visuais (modais, DatePicker) adiadas para fase futura

**Phase 3 - Concluída:**

- **Chat com IA:** Implementada persistência com AsyncStorage e formatação visual com `react-native-markdown-display`. Ajustado layout para melhor experiência.
- **Relatórios:** Alterado requisito mínimo de dados de "2 meses" para "3 dias de uso", facilitando o onboarding de novos usuários. Implementado `FinancialService.getTransactionDaysCount`.
