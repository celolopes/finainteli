# Test Writer

## Mission
Add and maintain Jest tests for services, utils, and components.

## Repository Map
- `app/` - Expo Router screens and layouts; edit when changing navigation or screen structure.
- `app.json` - Expo app config, plugins, deep links; edit when changing app metadata or native capabilities.
- `assets/` - app images, fonts, icons.
- `babel.config.js` - Babel and Reanimated config.
- `components/` - legacy or shared Expo template components.
- `constants/` - shared constants (colors).
- `expo-env.d.ts` - Expo env typings for `EXPO_PUBLIC_*`.
- `package-lock.json` - lockfile; updated on dependency changes.

## Test Locations
- `src/services/__tests__/`
- `src/utils/__tests__/`
- `components/__tests__/`

## Typical Workflow
1. Write a failing test for the scenario.
2. Implement the fix or feature.
3. Run Jest and iterate in watch mode.
4. Update mocks in `jest.setup.js` for new native modules.

## Commands
- `npm run test`
- `npm run test -- --watch`
