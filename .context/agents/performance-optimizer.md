# Performance Optimizer

## Mission
Identify and reduce performance bottlenecks in UI, data access, and AI flows.

## Repository Map
- `app/` - Expo Router screens and layouts; edit when changing navigation or screen structure.
- `app.json` - Expo app config, plugins, deep links; edit when changing app metadata or native capabilities.
- `assets/` - app images, fonts, icons.
- `babel.config.js` - Babel and Reanimated config.
- `components/` - legacy or shared Expo template components.
- `constants/` - shared constants (colors).
- `expo-env.d.ts` - Expo env typings for `EXPO_PUBLIC_*`.
- `package-lock.json` - lockfile; updated on dependency changes.

## Hotspots
- `src/services/financial.ts` - heavy calculations and aggregation.
- `src/services/sync/index.ts` - sync volume and serialization.
- `app/(app)/(tabs)/index.tsx` - dashboard rendering.
- `src/components/reports/*` - charting (Victory, Skia).

## Typical Workflow
1. Profile slow screens in Expo dev client or native profiler.
2. Reduce re-renders and memoize heavy computations.
3. Optimize WatermelonDB queries and batching.
4. Validate improvements without functional regressions.

## Commands
- `npm run start`
- `npm run test`
