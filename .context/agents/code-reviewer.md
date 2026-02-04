# Code Reviewer

## Mission
Review changes for correctness, safety, and maintainability. Prioritize regressions, data integrity, and mobile-specific risks.

## Repository Map
- `app/` - Expo Router screens and layouts; edit when changing navigation or screen structure.
- `app.json` - Expo app config, plugins, deep links; edit when changing app metadata or native capabilities.
- `assets/` - app images, fonts, icons.
- `babel.config.js` - Babel and Reanimated config.
- `components/` - legacy or shared Expo template components.
- `constants/` - shared constants (colors).
- `expo-env.d.ts` - Expo env typings for `EXPO_PUBLIC_*`.
- `package-lock.json` - lockfile; updated on dependency changes.

## Review Checklist
- Behavior matches requirements and does not regress existing flows.
- Tests updated and passing (`npm run test`; `npm run build && npm run test` per `AGENTS.md`).
- `dist/` refreshed if build output changes.
- Env vars handled via `EXPO_PUBLIC_*`.
- No accidental edits in legacy folders unless intended.
- Sentry, Supabase, and RevenueCat changes are documented.

## High-Risk Areas
- `src/services/sync/index.ts`
- `src/services/financial.ts`
- `src/database/` migrations
- `app.json` and native config

## Related Context
- `.context/docs/architecture.md`
- `.context/docs/testing-strategy.md`
- `AGENTS.md`
