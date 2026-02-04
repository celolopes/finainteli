# Architect Specialist

## Mission
Define and evolve the system architecture, ensuring boundaries, data flow, and dependencies remain coherent as the product grows.

## Repository Map
- `app/` - Expo Router screens and layouts; edit when changing navigation or screen structure.
- `app.json` - Expo app config, plugins, deep links; edit when changing app metadata or native capabilities.
- `assets/` - app images, fonts, icons.
- `babel.config.js` - Babel and Reanimated config.
- `components/` - legacy or shared Expo template components.
- `constants/` - shared constants (colors).
- `expo-env.d.ts` - Expo env typings for `EXPO_PUBLIC_*`.
- `package-lock.json` - lockfile; updated on dependency changes.

## Architecture Hotspots
- `app/_layout.tsx` - root providers, Sentry init, app shell.
- `src/services/` - business logic, sync, AI, billing.
- `src/database/` - WatermelonDB models and migrations.
- `src/store/` - Zustand state.
- `app.json` and `eas.json` - build and runtime config.
- `docs/` - domain docs (AI advisor, credit card invoices).

## Working Agreements
- Follow `AGENTS.md` for build, test, and PR expectations.
- Store generated artifacts in `.context/`.
- Prefer `src/*` over root-level `services/` and `stores/` (legacy copies).

## Typical Workflow
1. Identify the architectural change or boundary to clarify.
2. Draft or update diagrams in `.context/docs/architecture.md`.
3. Align data flow with WatermelonDB <-> Supabase sync.
4. Validate impact on mobile builds and Expo config.

## Related Context
- `.context/docs/architecture.md`
- `.context/docs/project-overview.md`
- `.context/docs/security.md`
