## Glossary & Domain Concepts
FinAInteli models personal finance entities (accounts, transactions, budgets) and AI-driven insights. Terms below map to code and UI concepts.

## Type Definitions
- `Transaction` (`src/types/index.ts`) - core transaction shape used across services and UI.
- `DetailedTransaction` (`src/types/index.ts`) - transaction with expanded category and account info.
- `Goal` (`src/types/index.ts`) - user savings or financial target.
- `UserProfile` (`src/services/supabase.ts`) - profile stored in Supabase.
- `Budget` / `BudgetWithCategory` (`src/services/budget.ts`) - budget models for calculations.
- `InvoiceStatus`, `InvoiceCycle`, `OpenInvoiceRange` (`src/utils/creditCardInvoice.ts`) - credit card invoice helpers.
- `FinancialContext` (`src/services/gemini.ts`) - AI prompt context input.
- `AIInsight` (`src/services/aiAdvisor.ts`) - AI advisor output contract.
- `BudgetStatus` (`src/services/budget.ts`) - budget evaluation state.

## Enumerations
- No exported enums were detected in the current codebase (see `codebase-map.json`).

## Core Terms
- **Account**: bank account model stored in WatermelonDB (`src/database/model/Account.ts`) and surfaced in `FinancialService`.
- **Credit Card**: card model with `closing_day` and `due_day` fields (`src/database/model/CreditCard.ts`).
- **Transaction**: income/expense/transfer record; soft-deleted via `deleted_at`.
- **Category**: transaction classification, shared between default and user-defined sets.
- **Budget**: category-level spending limit monitored by `BudgetService` and notifications.
- **AI Tip**: short Gemini-generated suggestion shown on the dashboard.
- **AI Advisor**: monthly or period analysis described in `docs/AI_ADVISOR.md`.
- **Invoice (Fatura)**: credit card billing cycle totals defined in `docs/credit-card-invoice.md` and `src/utils/creditCardInvoice.ts`.
- **Sync**: WatermelonDB <-> Supabase pull/push in `src/services/sync`.
- **Pro / Premium**: paid tier controlled by RevenueCat entitlements.

## Acronyms & Abbreviations
- **AI**: Artificial Intelligence
- **RLS**: Row Level Security (Supabase)
- **EAS**: Expo Application Services
- **JSI**: JavaScript Interface (WatermelonDB SQLite adapter)
- **DSN**: Data Source Name (Sentry)
- **PII**: Personally Identifiable Information

## Personas / Actors
FinAInteli targets individuals tracking personal finances. Key actors include:
- **Free user**: limited AI usage and account limits.
- **Pro user**: unlimited AI and advanced reporting.
- **New user**: onboarding flows and initial data entry.

## Domain Rules & Invariants
- Credit card invoice cycles follow `closing_day` and must handle short months (see `docs/credit-card-invoice.md`).
- `deleted_at` indicates soft deletions for sync; avoid hard deletes in WatermelonDB.
- Pending transactions should not count toward closed invoices.
- Supabase sync expects UUIDs; non-UUID records are skipped during push.

## Related Resources
- [Project Overview](./project-overview.md)
