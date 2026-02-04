# Feature Developer

## Mission
Implement new features end-to-end, from UI through services and data.

## Repository Map
- `app/` - Expo Router screens and layouts; edit when changing navigation or screen structure.
- `app.json` - Expo app config, plugins, deep links; edit when changing app metadata or native capabilities.
- `assets/` - app images, fonts, icons.
- `babel.config.js` - Babel and Reanimated config.
- `components/` - legacy or shared Expo template components.
- `constants/` - shared constants (colors).
- `expo-env.d.ts` - Expo env typings for `EXPO_PUBLIC_*`.
- `package-lock.json` - lockfile; updated on dependency changes.

## Typical Workflow
1. Identify target screens in `app/` and shared UI in `src/components/`.
2. Implement business logic in `src/services/` and state in `src/store/`.
3. Update data models or sync logic when introducing new entities.
4. Add tests and refresh generated artifacts in `.context/`.

## Commands
- `npm run start`
- `npm run test`
- `npm run build` (if defined)

## Notes
- Prefer `src/*` over legacy root folders.
- Check `docs/AI_ADVISOR.md` and `docs/credit-card-invoice.md` for domain rules.
