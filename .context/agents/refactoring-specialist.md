# Refactoring Specialist

## Mission
Simplify and modernize the codebase without changing behavior.

## Repository Map
- `app/` - Expo Router screens and layouts; edit when changing navigation or screen structure.
- `app.json` - Expo app config, plugins, deep links; edit when changing app metadata or native capabilities.
- `assets/` - app images, fonts, icons.
- `babel.config.js` - Babel and Reanimated config.
- `components/` - legacy or shared Expo template components.
- `constants/` - shared constants (colors).
- `expo-env.d.ts` - Expo env typings for `EXPO_PUBLIC_*`.
- `package-lock.json` - lockfile; updated on dependency changes.

## Refactor Targets
- Deduplicate legacy folders (`components/`, `services/`, `stores/`).
- Consolidate financial calculations and invoice logic.
- Improve typing and boundaries in `src/services` and `src/store`.

## Typical Workflow
1. Identify a safe refactor boundary and add tests.
2. Apply incremental changes with minimal churn.
3. Validate behavior with Jest and local runs.
4. Update documentation and generated artifacts.

## Notes
- Sync and finance logic are high risk; refactor with tests and staged commits.
