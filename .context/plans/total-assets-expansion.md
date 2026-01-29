---
title: Total Assets Expansion Feature
status: completed
type: feature
priority: high
owner: mobile-developer
---

# Total Assets Expansion Feature

## 1. Overview

Implement an expansion effect for the "Patrimônio Total" card on the dashboard. When clicked, it should reveal a detailed breakdown of all registered bank accounts and credit cards with their respective balances. The state (expanded/collapsed) must be persisted across app launches.

## 2. Requirements

- **Interaction**: Tapping the "Patrimônio Total" card toggles expansion.
- **Content**:
  - Show list of Bank Accounts (Name + Balance).
  - Show list of Credit Cards (Name + Current Balance/Limit).
- **Persistence**: Remembers user preference (expanded/collapsed) using AsyncStorage.
- **Animation**: Smooth transition effect using `react-native-reanimated`.
- **Data**: Must fetch Credit Cards (currently missing from Store).

## 3. Implementation Plan

### Phase 1: Data Layer Updates (Backend/Store)

- [ ] **Update Financial Store Interface**: Add `creditCards` array to `FinancialState`.
- [ ] **Update Fetch Logic**: Modify `fetchDashboardData` in `src/store/financialStore.ts` to call `FinancialService.getCreditCards()` and store the result.
- [ ] **Type Definitions**: Ensure `CreditCardRow` is properly exported/defined in store types.

### Phase 2: Component Logic (BalanceCard)

- [ ] **Add State**: `isExpanded` localized state, initialized from AsyncStorage.
- [ ] **Add Persistence**: `useEffect` to save state on change (`@finainteli_balance_expanded`).
- [ ] **Refactor Structure**: Wrap the card in a Pressable/Touchable.

### Phase 3: UI & Animation

- [ ] **Animation Setup**: Use `reanimated` values for height or layout transition.
- [ ] **List Rendering**:
  - Create `AccountItem` sub-component (or inline) for consistent look.
  - Create `CreditCardItem` sub-component.
  - Render these lists inside the expanded area.
- [ ] **Styling**: Match existing Glassmorphism/Material 3 design.

### Phase 4: Verification

- [ ] **Test**: Verify expansion/collapse works.
- [ ] **Test**: Verify data is correct (sums match).
- [ ] **Test**: Verify persistence (reload app).

## 4. Technical Details

- **Store**: `src/store/financialStore.ts`
- **Component**: `src/components/dashboard/BalanceCard.tsx`
- **Service**: `src/services/financial.ts` (Existing `getCreditCards` is ready).
