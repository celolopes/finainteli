## Testing Strategy
FinAInteli uses Jest with the `jest-expo` preset to validate business logic and UI helpers. Tests are mostly unit-level for services and utilities, with a light smoke coverage for components.

## Test Types
- **Unit**: Jest, typically in `src/services/__tests__/`, `src/utils/__tests__/`, and `components/__tests__/` with `*.test.ts` or `*.test.tsx` naming.
- **Integration**: Service flows and sync logic, using mocked Supabase and WatermelonDB.
- **E2E**: None configured yet (no Detox/Playwright setup).

## Running Tests
- All tests:
  ```bash
  npm run test
  ```
- Watch mode:
  ```bash
  npm run test -- --watch
  ```
- Coverage (optional):
  ```bash
  npm run test -- --coverage
  ```

## Quality Gates
- Run `npm run build && npm run test` before opening a PR (per `AGENTS.md`).
- Add or update tests alongside generator or CLI changes.
- Keep Jest setup in `jest.setup.js` aligned with environment variables and Expo mocks.

## Troubleshooting
If tests fail due to native modules or missing env vars, check `jest.setup.js` for mocks and `jest.config.js` for transform ignore patterns. React Native and Expo modules often require explicit mocking.

## Related Resources
- [Development Workflow](./development-workflow.md)
