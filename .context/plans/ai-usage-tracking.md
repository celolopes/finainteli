# Plan: AI Usage Tracking & Debug Dashboard

Implementation of a developer feature to monitor AI model usage, token consumption, and cost analysis in BRL.

## Phase 1: Infrastructure & Data Modeling

**Objective**: Setup the foundation for tracking AI usage.

**Steps**

1. **DB Schema & Supabase**: Create `ai_usage_logs` table in Supabase and update local `src/database/schema.ts`.
   - Fields: `id`, `user_id`, `model_id`, `prompt_tokens`, `candidates_tokens`, `total_tokens`, `cost_brl`, `feature_name`, `timestamp`.
   - Ensure synchronization is configured for this table.
2. **Pricing Configuration**: Create `src/constants/aiPricing.ts` with Gemini 3 Flash rates:
   - Input: $0.10 / 1M tokens
   - Output: $0.40 / 1M tokens
   - USD to BRL conversion (Default 6.15, adjustable).
3. **Repository Setup**: Create `src/database/repositories/aiUsageRepository.ts` to manage usage logs locally.

**Commit Checkpoint**

- `feat(db): add ai_usage_logs table and model`

## Phase 2: Instrumentation

**Objective**: Capture token usage from Gemini API calls.

**Steps**

1. **Gemini Service Update**: Modify `src/services/gemini.ts` to extract `usageMetadata` from responses.
2. **Logging Logic**: Implement a helper in `GeminiService` to calculate cost and save the log entry after every successful API call.
3. **Model Identification**: Ensure the model name is captured (e.g., `gemini-1.5-flash`).

**Commit Checkpoint**

- `feat(ai): instrument gemini service with token tracking`

## Phase 3: UI Implementation (Debug Menu)

**Objective**: Create the developer dashboard.

**Steps**

1. **Debug Menu Component**: Create `src/components/debug/DebugMenu.tsx`.
2. **Settings Integration**: Add a secret gesture (e.g., 7 taps on Version number) in `app/(app)/settings/index.tsx` to toggle developer mode.
3. **AI Dashboard Page**: Create `app/(app)/settings/debug/ai-usage.tsx`.
   - Display summary: Total tokens, total cost (BRL).
   - Display charts: Usage over time (Daily/Monthly) using `victory-native`.
   - Per-feature breakdown.
4. **Localization**: Add strings for the new features in Portuguese and English.

**Commit Checkpoint**

- `feat(ui): add debug menu and ai usage dashboard`

## Phase 4: Validation & Handoff

**Objective**: Ensure accuracy and quality.

**Steps**

1. **Verify Accuracy**: Trigger AI calls and check if logs match reality.
2. **Cost Validation**: Verify BRL conversion matches recent exchange rates.
3. **Tests**: Add unit tests for cost calculation logic.

**Commit Checkpoint**

- `test(ai): add tests for usage tracking and cost calculation`

## Success Criteria

- [x] Every Gemini API call is logged with correct token counts.
- [x] Cost is calculated correctly in BRL.
- [x] Debug Dashboard shows a clear breakdown of usage.
- [x] UI is responsive and follows the project's premium design.

## Rollback Plan

- If DB migration fails: Revert `schema.ts` version and delete the new model file.
- If AI Service breaks: Disable logging by wrapping it in a try-catch or a feature flag.
