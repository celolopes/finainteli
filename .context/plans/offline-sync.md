---
status: complete
generated: 2026-01-23
title: "Feature F1: Sincronização Offline"
summary: "Implementar suporte offline first utilizando WatermelonDB e sincronização bidirecional com Supabase."
priority: high
complexity: high
estimated_hours: 12
agents:
  - type: "architect-specialist"
    role: "Definir schema do banco local e estratégia de sync"
  - type: "feature-developer"
    role: "Implementar sync engine e integrar com Supabase"
  - type: "mobile-specialist"
    role: "Configurar SQLite nativo (JSI) e UI indicators"
  - type: "test-writer"
    role: "Testar cenários de conflito e conectividade intermitente"
docs:
  - "architecture.md"
  - "future-features-roadmap.md"
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

# Feature F1: Sincronização Offline

> ADR-001: Offline Synchronization Strategy using WatermelonDB.

## 🎯 Objetivos

- [x] Persistência de dados local de alta performance (WatermelonDB).
- [x] Sincronização bidirecional robusta com Supabase via custom adapter.
- [x] Suporte a operações offline (Create, Update, Delete) com Soft Delete.
- [x] Indicadores visuais de status e conectividade.

## 📋 Arquitetura

Utilizaremos **WatermelonDB** sobre SQLite JSI.
O padrão de sync será o suporte nativo do WatermelonDB (`synchronize()`) adaptado para Supabase.

### Estratégia de Sync (Custom Adapter)

- **Pull**: Busca todos os registros onde `updated_at > last_pulled_at`.
- **Push**: Envia mudanças locais. Para Deletes, envia `deleted_at = now()`.

### Preparação do Backend (Supabase)

Necessário adicionar `deleted_at` (timestamptz) nas tabelas principais para rastrear exclusões entre dispositivos.

```sql
ALTER TABLE transactions ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE categories ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE bank_accounts ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE budgets ADD COLUMN deleted_at TIMESTAMPTZ;
```

### Tabelas a sincronizar

1.  `transactions`
2.  `categories` (Read-only offline inicialmente, ou full sync)
3.  `accounts`
4.  `goals` (Opcional nesta fase)

## 📦 Entregáveis

### Fase 1: Setup do WatermelonDB (3h) ✅ DONE

#### 1.1 - Instalação e Configuração ✅

- Instalar `@nozbe/watermelondb`, `@nozbe/watermelondb/driver/sqlite`.
- Configurar Babel plugin para decorators.
- Criar `src/database/index.ts` e `schema.ts`.

#### 1.2 - Models ✅

- `src/database/model/Transaction.ts`
- `src/database/model/Category.ts`
- `src/database/model/Account.ts`

### Fase 2: Mecanismo de Sincronização (5h) ✅ DONE

#### 2.1 - Sync Engine ✅

- `src/services/sync/index.ts`: Implementar função `mySync` usando `synchronize()`.
- Implementar lógica de "Pull" (Baixar alterações do Supabase baseadas em `last_pulled_at`).
- Implementar lógica de "Push" (Enviar alterações locais `created`, `updated`, `deleted`).

#### 2.2 - Adaptação do Backend (Supabase) ✅

- Adicionado `deleted_at` (timestamptz) nas tabelas principais.
- RLS e Triggers configurados.

### Fase 3: UI e Integração (4h) ✅ DONE

#### 3.1 - Indicadores ✅ DONE

- `SyncIndicator.tsx` no Header integrado ao `UserHeader`. ✅
- Feedback visual de sincronização por item no `TransactionItem`. ✅
- `OfflineBanner.tsx` (Opcional - SyncIndicator já resolve).

#### 3.2 - Refatoração dos Hooks ✅

- `FinancialService` refatorado para usar WatermelonDB.
- `TransactionsScreen` e `TransactionDetails` atualizados.

## 🔄 Fluxo de Dados

1. App Inicia -> Tenta Sync (Pull & Push).
2. Sem net -> Lê do WatermelonDB.
3. Usuário cria Transação -> Salva no WatermelonDB (status: 'created').
4. Net volta -> Sync Push envia transação para Supabase.
5. Sucesso -> Marca como 'synced' localmente.

## ✅ Critérios de Sucesso

- [x] App abre e mostra dados sem internet.
- [x] Transação criada offline aparece na lista imediatamente.
- [x] Transação criada offline sobe para o Supabase ao reconectar.
- [x] Edição em outro dispositivo reflete aqui após sync.
- [x] Performance de lista melhora (scroll 60fps).

## 🔗 Dependências

- `@nozbe/watermelondb`
- `expo-file-system` (para SQLite JSI setup se precisar)
