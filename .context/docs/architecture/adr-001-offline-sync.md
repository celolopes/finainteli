# ADR-001: Offline Synchronization Strategy

## Status

Proposed

## Context

The FinAInteli application requires "Offline First" capabilities. Users must be able to:

1. Create and edit transactions without internet.
2. View historical data cached locally.
3. Synchronize changes bidirectionally with the Supabase backend when connectivity is restored.

Constraints:

- Platform: React Native (Expo SDK 54).
- Backend: Supabase (PostgreSQL / PostgREST).
- Performance: Must handle hundreds of transactions with 60FPS scroll.

## Decision

Adopt **WatermelonDB** as the local database and synchronization framework.

### Technical Implementation Details:

1. **Local DB**: SQLite via WatermelonDB (JSI-enabled for performance).
2. **Schema Mapping**: Supabase tables (`transactions`, `categories`, `bank_accounts`, `budgets`) will be mirrored in WatermelonDB.
3. **Change Tracking**:
   - `updated_at`: Required on all tables for the `pull` phase.
   - `deleted_at` (Soft Delete): Required on Supabase to track deletions for cross-client sync.
4. **Sync Protocol**: Custom adapter using WatermelonDB's `synchronize()` function connecting to Supabase via `supabase-js`.

## Rationale

1. **Reactivity**: WatermelonDB's Observable model allows the UI to automatically update when the database changes (including sync updates).
2. **Native Performance**: Using JSI means data retrieval is almost instantaneous compared to asynchronous bridges.
3. **Maturity**: WatermelonDB is a stable and widely tested solution for large-scale offline-first React Native apps.
4. **Scaling**: It scales efficiently from few to many thousands of records.

## Trade-offs

- **Complexity**: Requires Babel configuration and decorators.
- **Boilerplate**: Need to define Models and Schemas separately from TypeScript types (though they should align).
- **Migration**: Current `useStore` (Zustand) fetches data directly from Supabase. We will need to refactor data access to rely on the local database as the Source of Truth.

## Consequences

- **Positive**:
  - Instant app startup (no loading spinners for data).
  - Perfect UX even on 2G/3G or airline mode.
  - Reduced Supabase API calls (fewer queries for static data).
- **Negative**:
  - Increased bundle size (SQLite + WatermelonDB).
  - Initial implementation complexity.
  - Need to handle "Deleted" states manually in RLS or App Logic.

## Revisit Trigger

- If WatermelonDB setup becomes incompatible with newer Expo/React Native versions.
- If synchronization latency becomes a bottleneck due to custom adapter logic.
