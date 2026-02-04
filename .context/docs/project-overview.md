## Project Overview
FinAInteli is a cross-platform personal finance assistant built with Expo and React Native. It combines local-first tracking with Supabase sync and Gemini-powered insights for budgets, reports, and coaching. The primary audience is individual users who want a premium, mobile-first finance experience with a freemium upgrade path.

## Codebase Reference
> **Detailed Analysis**: For complete symbol counts, architecture layers, and dependency graphs, see [`codebase-map.json`](./codebase-map.json).

## Quick Facts
- Root: `/mnt/d/dev/projects/finainteli`
- Languages: TypeScript (.ts/.tsx ~128 files), JSON (174), Android native (Java/Kotlin/C/C++ inside `android/`)
- Entry points: `app/_layout.tsx`, `app/index.tsx`, `app/(app)/(tabs)/index.tsx`, `src/database/index.ts`, `src/services/sync/index.ts`, `src/i18n/index.ts`
- Full analysis: [`codebase-map.json`](./codebase-map.json)

## Entry Points
- [`app/_layout.tsx`](../../app/_layout.tsx#L1) - root layout, providers, Sentry init
- [`app/index.tsx`](../../app/index.tsx#L1) - auth gate and redirects
- [`app/(app)/(tabs)/index.tsx`](../../app/(app)/(tabs)/index.tsx#L1) - main dashboard tab
- [`app/(auth)/login.tsx`](../../app/(auth)/login.tsx#L1) - authentication entry
- [`src/database/index.ts`](../../src/database/index.ts#L1) - WatermelonDB setup
- [`src/services/sync/index.ts`](../../src/services/sync/index.ts#L1) - Supabase sync bridge
- [`src/i18n/index.ts`](../../src/i18n/index.ts#L1) - localization bootstrap
- [`src/theme/index.ts`](../../src/theme/index.ts#L1) - theme primitives

## Key Exports
- `AppThemeProvider` (`src/context/ThemeContext.tsx`)
- `usePremium` (`src/hooks/usePremium.ts`)
- `useAILimit` (`src/hooks/useAILimit.ts`)
- `mySync` (`src/services/sync/index.ts`)
- `calculateAICost` (`src/constants/aiPricing.ts`)
- Model classes: `Account`, `Transaction`, `Budget`, `Category`, `CreditCard`, `AIUsageLog` (`src/database/model/*`)
- Type exports: `Transaction`, `DetailedTransaction`, `Goal` (`src/types/index.ts`)
- See [`codebase-map.json`](./codebase-map.json) for the full export list.

## File Structure & Code Organization
- `app/` - Expo Router screens and layouts
- `src/` - primary application code (services, components, store, utils)
- `components/` - legacy or shared Expo template components
- `constants/` - shared constants (colors, etc)
- `services/` and `stores/` - legacy copies; prefer `src/services` and `src/store`
- `assets/` - fonts and images
- `docs/` - product and domain docs
- `android/` - native Android project
- `.context/` - generated documentation and plans

## Technology Stack Summary
FinAInteli is built with Expo SDK 54 and React Native 0.81 using TypeScript. It uses Supabase for authentication and cloud data, WatermelonDB for local persistence and sync, Zustand for state management, and Google Gemini for AI insights. Sentry is wired for error tracking and session replay, and i18next handles localization.

## Core Framework Stack
Expo Router provides file-based navigation. React Native Paper and custom UI components form the design system. WatermelonDB plus Supabase deliver offline-first data with sync.

## UI & Interaction Libraries
React Native Paper, Reanimated, Skia, Victory/Victory Native, and Expo UI modules (blur, linear gradient, haptics) support the UI and visualization layers.

## Development Tools Overview
Primary scripts live in `package.json` (`npm run start`, `npm run android`, `npm run ios`, `npm run web`, `npm run test`). EAS configuration lives in `eas.json`, and Sentry sourcemaps are uploaded via `npm run sentry:upload-sourcemaps`. See [Tooling](./tooling.md) for details.

## Getting Started Checklist
1. Install dependencies with `npm install`.
2. Create `.env` based on `.env.example` and set `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and `EXPO_PUBLIC_GEMINI_API_KEY`.
3. Start the app with `npm run start` (or `npx expo start`). If you need the interactive TypeScript session referenced in `AGENTS.md`, add or run `npm run dev` accordingly.
4. Verify the test suite with `npm run test`.

## Next Steps
Review [Architecture Notes](./architecture.md) for deeper system context and [Development Workflow](./development-workflow.md) for team conventions.
