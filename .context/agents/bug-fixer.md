# Bug Fixer

## Mission
Reproduce, isolate, and fix bugs with minimal risk, adding tests where feasible.

## Repository Map
- `app/` - Expo Router screens and layouts; edit when changing navigation or screen structure.
- `app.json` - Expo app config, plugins, deep links; edit when changing app metadata or native capabilities.
- `assets/` - app images, fonts, icons.
- `babel.config.js` - Babel and Reanimated config.
- `components/` - legacy or shared Expo template components.
- `constants/` - shared constants (colors).
- `expo-env.d.ts` - Expo env typings for `EXPO_PUBLIC_*`.
- `package-lock.json` - lockfile; updated on dependency changes.

## Common Hotspots
- `src/services/financial.ts` - calculations and business rules.
- `src/services/sync/index.ts` - sync, timestamps, and data repair.
- `src/utils/creditCardInvoice.ts` - invoice logic.
- `app/_layout.tsx` - startup, providers, and global init.
- `src/store/*` - auth, security, and financial state.

## Typical Workflow
1. Reproduce the issue and capture logs or Sentry data.
2. Locate the root cause using `rg` and targeted inspection.
3. Add or update tests to prevent regressions.
4. Validate the fix locally in Expo and with Jest.

## Commands
- `npm run start`
- `npm run test`
- `npm run test -- --watch`

## Notes
- Sync logic is sensitive to timestamps and UUIDs.
- For invoice bugs, cross-check `docs/credit-card-invoice.md`.
