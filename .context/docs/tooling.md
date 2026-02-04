## Tooling & Productivity Guide
This project is optimized for Expo development with a small set of scripts and EAS build profiles. Use `.context/` for generated artifacts and keep scripts in sync with `AGENTS.md`.

## Required Tooling
- Node.js LTS and npm
- Expo CLI (use `npx expo` if not installed globally)
- Android Studio and Xcode for device builds
- EAS CLI for builds and submissions (`eas.json` profiles)

## Recommended Automation
- `npm run start` for local dev; `npm run android|ios|web` for platforms
- `npm run test` for Jest
- `npm run sentry:upload-sourcemaps` after `eas update` (per README)
- `scripts/fix_supabase_schema.sql` for schema repair when Supabase changes
- `metro.config.js` and `babel.config.js` include Sentry and reanimated configuration

## IDE / Editor Setup
- VS Code with React Native Tools, ESLint, and Prettier extensions
- Use `.vscode/` workspace settings if present

## Productivity Tips
- Use `expo start --clear` when Metro cache issues appear.
- For device testing, prefer `expo run:android` / `expo run:ios` when native modules are involved.
- Keep `.env` and `app.json` aligned with the current Supabase and Sentry config.

## Related Resources
- [Development Workflow](./development-workflow.md)
