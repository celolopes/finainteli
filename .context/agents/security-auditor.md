# Security Auditor

## Mission
Identify security risks and recommend mitigations across auth, storage, and data flows.

## Repository Map
- `app/` - Expo Router screens and layouts; edit when changing navigation or screen structure.
- `app.json` - Expo app config, plugins, deep links; edit when changing app metadata or native capabilities.
- `assets/` - app images, fonts, icons.
- `babel.config.js` - Babel and Reanimated config.
- `components/` - legacy or shared Expo template components.
- `constants/` - shared constants (colors).
- `expo-env.d.ts` - Expo env typings for `EXPO_PUBLIC_*`.
- `package-lock.json` - lockfile; updated on dependency changes.

## Key Files
- `src/services/supabase.ts` - auth storage and profile handling.
- `src/services/security.ts` - PIN and biometrics storage.
- `app/_layout.tsx` - Sentry config and PII settings.
- `app.json` - deep links and permissions.
- `.env.example` - public env vars.

## Typical Workflow
1. Review env var usage and secret handling.
2. Validate auth flows and token storage.
3. Check local storage of sensitive data.
4. Audit error reporting for PII exposure.

## Notes
- No formal compliance doc exists; add one if required by stakeholders.
