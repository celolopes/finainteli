## Security & Compliance Notes
FinAInteli handles personal finance data and uses a mix of local storage and cloud sync. Security controls focus on authenticated access, local device protection, and safe handling of API keys.

## Authentication & Authorization
Authentication is handled by Supabase Auth with email/password and OAuth providers (Google, Apple). Session tokens are stored in AsyncStorage via a custom adapter to avoid SecureStore size limits on Android. The app also supports local app locking using a PIN and optional biometrics, with state managed in `src/store/securityStore.ts` and secrets stored in `expo-secure-store`. Auth callbacks are configured via deep links in `app.json`.

## Secrets & Sensitive Data
- Runtime secrets are provided via `.env` / `.env.local` and Expo public env vars (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_GEMINI_API_KEY`, `EXPO_PUBLIC_RC_KEY_IOS`, `EXPO_PUBLIC_RC_KEY_ANDROID`).
- Sentry DSN is initialized in `app/_layout.tsx` and is treated as a public identifier.
- Do not commit private keys; keep `.env*` files local and update `.env.example` when adding new vars.
- User data is persisted locally via WatermelonDB and synced to Supabase; soft deletes use `deleted_at`.

## Compliance & Policies
- No formal compliance standard is documented in the repo. If handling regulated data, review GDPR/LGPD and app store privacy requirements before release.

## Incident Response
- Use Sentry for error monitoring and session replay. No on-call or runbook is defined; document escalation steps if production incidents become frequent.

## Related Resources
- [Architecture Notes](./architecture.md)
