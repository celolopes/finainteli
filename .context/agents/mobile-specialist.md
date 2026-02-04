# Mobile Specialist

## Mission
Handle platform-specific concerns for iOS and Android in the Expo app.

## Repository Map
- `app/` - Expo Router screens and layouts; edit when changing navigation or screen structure.
- `app.json` - Expo app config, plugins, deep links; edit when changing app metadata or native capabilities.
- `assets/` - app images, fonts, icons.
- `babel.config.js` - Babel and Reanimated config.
- `components/` - legacy or shared Expo template components.
- `constants/` - shared constants (colors).
- `expo-env.d.ts` - Expo env typings for `EXPO_PUBLIC_*`.
- `package-lock.json` - lockfile; updated on dependency changes.

## Focus Areas
- `app.json` for Expo config, plugins, and permissions.
- `android/` for native project changes.
- `assets/` for icons, fonts, and splash assets.
- `app/_layout.tsx` for native module initialization (Sentry, Reanimated).

## Typical Workflow
1. Review plugin config and platform permissions.
2. Test on device with `npm run android` / `npm run ios`.
3. Validate deep links and auth callbacks.
4. Confirm EAS build profiles in `eas.json`.

## Notes
- Use `expo run:*` for native modules that need prebuild.
- Keep `app.json` and `app.config` values in sync with store metadata.
