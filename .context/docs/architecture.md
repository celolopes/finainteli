## Architecture Notes
FinAInteli is a single Expo/React Native application with a local-first data model. UI lives under `app/` (file-based routes) and `src/components/`. Business logic sits in `src/services/` with a WatermelonDB persistence layer in `src/database/`. Data syncs to Supabase, and AI insights are generated via Gemini.

## System Architecture Overview
The app is a modular monolith packaged for mobile and web through Expo. Requests and user actions flow from screens in `app/` into service modules (financial, budget, AI advisor). Data is persisted locally via WatermelonDB (SQLite) and synchronized to Supabase using a pull/push protocol (`src/services/sync`). Auth and profile data are managed through Supabase Auth and surfaced via Zustand stores. AI features aggregate financial data locally and call Gemini to produce tips and reports.

## Architectural Layers
- **Services**: core business logic (`src/services/`, `src/services/sync/`)
- **Config**: app settings and constants (`app/(app)/settings/`, `src/constants/`, `app.json`)
- **Components**: UI and screens (`app/`, `src/components/`, `components/`)
- **Models**: data models and types (`src/database/model/`, `src/types/`)
- **Utils**: shared helpers (`src/utils/`)
- **Repositories**: data access abstractions (`src/database/repositories/`)

> See [`codebase-map.json`](./codebase-map.json) for complete symbol counts and dependency graphs.

## Detected Design Patterns
| Pattern | Confidence | Locations | Description |
| --- | --- | --- | --- |
| Service Layer | 85% | `src/services/*.ts` | Business logic encapsulated in stateless modules |
| Store (Zustand) | 75% | `src/store/*.ts` | Centralized app state with actions and selectors |
| Repository/Data Mapper | 70% | `src/database/`, `src/database/repositories/` | Local persistence with model classes and query helpers |
| Provider/Context | 65% | `src/context/ThemeContext.tsx`, `src/context/TutorialContext.tsx` | App-wide context for theming and tutorials |
| File-based Routing | 90% | `app/` | Expo Router routes map to file structure |

## Entry Points
- [`app/_layout.tsx`](../../app/_layout.tsx#L1)
- [`app/index.tsx`](../../app/index.tsx#L1)
- [`app/(app)/(tabs)/index.tsx`](../../app/(app)/(tabs)/index.tsx#L1)
- [`app/(auth)/login.tsx`](../../app/(auth)/login.tsx#L1)
- [`src/database/index.ts`](../../src/database/index.ts#L1)
- [`src/services/sync/index.ts`](../../src/services/sync/index.ts#L1)
- [`src/i18n/index.ts`](../../src/i18n/index.ts#L1)
- [`src/theme/index.ts`](../../src/theme/index.ts#L1)

## Public API
| Symbol | Type | Location |
| --- | --- | --- |
| `Account` | class | [`src/database/model/Account.ts`](../../src/database/model/Account.ts#L4) |
| `Transaction` | class | [`src/database/model/Transaction.ts`](../../src/database/model/Transaction.ts#L7) |
| `Budget` | class | [`src/database/model/Budget.ts`](../../src/database/model/Budget.ts#L5) |
| `Category` | class | [`src/database/model/Category.ts`](../../src/database/model/Category.ts#L4) |
| `CreditCard` | class | [`src/database/model/CreditCard.ts`](../../src/database/model/CreditCard.ts#L4) |
| `AIUsageLog` | class | [`src/database/model/AIUsageLog.ts`](../../src/database/model/AIUsageLog.ts#L4) |
| `AppThemeProvider` | function | [`src/context/ThemeContext.tsx`](../../src/context/ThemeContext.tsx#L22) |
| `AuthLayout` | function | [`app/(auth)/_layout.tsx`](../../app/(auth)/_layout.tsx#L3) |
| `AuthCallbackScreen` | function | [`app/auth/callback.tsx`](../../app/auth/callback.tsx#L16) |
| `usePremium` | function | [`src/hooks/usePremium.ts`](../../src/hooks/usePremium.ts#L4) |
| `useAILimit` | function | [`src/hooks/useAILimit.ts`](../../src/hooks/useAILimit.ts#L32) |
| `calculateAICost` | function | [`src/constants/aiPricing.ts`](../../src/constants/aiPricing.ts#L25) |
| `Transaction` | interface | [`src/types/index.ts`](../../src/types/index.ts#L1) |
| `DetailedTransaction` | interface | [`src/types/index.ts`](../../src/types/index.ts#L18) |
| `Goal` | interface | [`src/types/index.ts`](../../src/types/index.ts#L36) |
| `BudgetStatus` | interface | [`src/services/budget.ts`](../../src/services/budget.ts#L22) |
| `FinancialContext` | interface | [`src/services/gemini.ts`](../../src/services/gemini.ts#L12) |
| `AIInsight` | interface | [`src/services/aiAdvisor.ts`](../../src/services/aiAdvisor.ts#L17) |
| `InvoiceStatus` | type | [`src/utils/creditCardInvoice.ts`](../../src/utils/creditCardInvoice.ts#L1) |

See [`codebase-map.json`](./codebase-map.json) for the full export list.

## Internal System Boundaries
UI and routing live in `app/` with shared visual components in `src/components/`. Business logic is concentrated in `src/services/`, while persistence is handled by WatermelonDB models and repositories under `src/database/`. `src/store/` contains Zustand stores for auth, financial, and security state. Note that `components/`, `services/`, and `stores/` at the repo root appear to be legacy copies; prefer `src/*` when making changes.

## External Service Dependencies
- **Supabase**: Auth, user profiles, and cloud data (env: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`). Sync uses pull/push with `deleted_at` soft deletes.
- **Google Gemini**: AI tips and reports (env: `EXPO_PUBLIC_GEMINI_API_KEY`).
- **RevenueCat**: Subscription and entitlement checks (env: `EXPO_PUBLIC_RC_KEY_IOS`, `EXPO_PUBLIC_RC_KEY_ANDROID`).
- **Sentry**: Error tracking, replay, and sourcemaps (`@sentry/react-native`, `sentry:upload-sourcemaps` script).
- **Expo Services**: Notifications, auth session, Apple sign-in, secure store, updates (configured in `app.json`).

## Key Decisions & Trade-offs
WatermelonDB provides offline-first data access but requires sync reconciliation with Supabase and careful timestamp handling. Supabase auth uses AsyncStorage instead of SecureStore to avoid Android size limits for OAuth tokens. The app uses Expo Router for rapid navigation development and cross-platform parity, trading some compile-time guarantees for file-based conventions. AI requests are centralized in service modules to keep prompt logic and usage tracking consistent.

## Diagrams
```mermaid
flowchart LR
  UI[app/ screens] --> Services[src/services]
  Services --> LocalDB[src/database (WatermelonDB)]
  LocalDB --> Sync[src/services/sync]
  Sync <--> Supabase[(Supabase)]
  Services --> AI[src/services/gemini + aiAdvisor]
  AI --> Gemini[(Gemini API)]
  UI --> Stores[src/store (Zustand)]
  UI --> Components[src/components]
```

## Risks & Constraints
- Sync depends on accurate timestamps; invalid dates can force full resync.
- Some scripts referenced in `AGENTS.md` (`npm run dev`, `npm run build`) are not defined in `package.json` as of 2026-02-03.
- `android/` dominates repo size; native changes can increase build times.
- Legacy folders (`services/`, `stores/`, `components/`) exist alongside `src/*` and can cause confusion if edited inadvertently.

## Top Directories Snapshot
- `android/` (1191 files)
- `src/` (82 files)
- `app/` (34 files)
- `assets/` (13 files)
- `components/` (10 files)
- `docs/` (2 files)
- `scripts/` (1 file)
- `services/` (1 file)
- `stores/` (1 file)
- `app.json` (1 file)
- `package.json` (1 file)

## Related Resources
- [Project Overview](./project-overview.md)
- [Development Workflow](./development-workflow.md)
- [Codebase Map](./codebase-map.json)
