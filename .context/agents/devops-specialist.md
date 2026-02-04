# Devops Specialist

## Mission
Own build, release, and observability workflows for the Expo app.

## Repository Map
- `app/` - Expo Router screens and layouts; edit when changing navigation or screen structure.
- `app.json` - Expo app config, plugins, deep links; edit when changing app metadata or native capabilities.
- `assets/` - app images, fonts, icons.
- `babel.config.js` - Babel and Reanimated config.
- `components/` - legacy or shared Expo template components.
- `constants/` - shared constants (colors).
- `expo-env.d.ts` - Expo env typings for `EXPO_PUBLIC_*`.
- `package-lock.json` - lockfile; updated on dependency changes.

## Key Systems
- `eas.json` build profiles and submission config.
- `app.json` Expo config, plugins, deep links, and Sentry settings.
- `metro.config.js` for Sentry bundling.
- `package.json` scripts and runtime dependencies.

## Typical Workflow
1. Validate build profile and required env vars.
2. Run EAS build or update for the target channel.
3. Upload sourcemaps with `npm run sentry:upload-sourcemaps` when needed.
4. Verify crash reporting and release health in Sentry.

## Notes
- No CI config detected; add CI only when requirements are defined.
- Coordinate env variables across EAS and local `.env` files.
