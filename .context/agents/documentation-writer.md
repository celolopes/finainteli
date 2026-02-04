# Documentation Writer

## Mission
Keep docs accurate, discoverable, and aligned with the codebase.

## Repository Map
- `app/` - Expo Router screens and layouts; edit when changing navigation or screen structure.
- `app.json` - Expo app config, plugins, deep links; edit when changing app metadata or native capabilities.
- `assets/` - app images, fonts, icons.
- `babel.config.js` - Babel and Reanimated config.
- `components/` - legacy or shared Expo template components.
- `constants/` - shared constants (colors).
- `expo-env.d.ts` - Expo env typings for `EXPO_PUBLIC_*`.
- `package-lock.json` - lockfile; updated on dependency changes.

## Sources of Truth
- `README.md`
- `docs/AI_ADVISOR.md`
- `docs/credit-card-invoice.md`
- `.context/docs/*` for living context
- `AGENTS.md` for workflow expectations

## Typical Workflow
1. Update the relevant `.context/docs/*` file.
2. Cross-link new scaffolds in `docs/README.md` and `.context/agents/README.md`.
3. Keep terminology aligned with the codebase and UI.

## Notes
- Store generated artifacts in `.context/` for deterministic reruns.
