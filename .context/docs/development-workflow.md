## Development Workflow
This repository is a single Expo app. Daily work typically starts with local changes under `app/` or `src/`, followed by running the app in Expo, updating tests, and refreshing generated artifacts in `.context/`.

## Branching & Releases
- Default workflow: trunk-based on the main branch (no Git Flow config present).
- Release builds: use EAS profiles in `eas.json` (`development`, `preview`, `production`).
- Versioning: app version is in `app.json` and EAS uses `autoIncrement` for build numbers.

## Local Development
- Install dependencies:
  ```bash
  npm install
  ```
- Run Expo dev server:
  ```bash
  npm run start
  ```
- Platform shortcuts:
  ```bash
  npm run android
  npm run ios
  npm run web
  ```
- Interactive TypeScript session (per `AGENTS.md`):
  ```bash
  npm run dev
  ```
  If the script is missing, add it or use `npm run start` / `npx expo start` as a substitute.
- Build artifacts (per `AGENTS.md`):
  ```bash
  npm run build
  ```
  If missing, define it before relying on `dist/` output.

## Code Review Expectations
Reviews should confirm feature behavior, check data safety, and ensure the Jest suite passes. Follow Conventional Commits and include updated artifacts in `dist/` when build output changes. For generator or CLI changes, add tests and attach sample output or generated markdown in the PR description. Cross-link new scaffolds in `docs/README.md` and `.context/agents/README.md` so they are discoverable.

## Onboarding Tasks
New contributors should read `README.md`, `docs/AI_ADVISOR.md`, and `docs/credit-card-invoice.md` to understand AI and billing logic. Verify `.env` variables, inspect `app.json` for Expo configuration, and skim `src/services/financial.ts` for core domain behavior.

## Related Resources
- [Testing Strategy](./testing-strategy.md)
- [Tooling](./tooling.md)
