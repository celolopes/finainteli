---
id: feature-credit-card-details
title: Credit Card Details & Invoice Feature
status: completed
owner: frontend-specialist
context_required:
  - "src/database/model/CreditCard.ts"
  - "src/services/financial.ts"
  - "app/(app)/cards/index.tsx"
---

# Credit Card Details & Invoice Feature

## Overview

Implement a detailed view for credit cards, allowing users to select a card and view comprehensive invoice details. The feature will include a limit visualization (used vs available), current invoice balance, and a breakdown of expenses by month.

## Components & Architecture

### New Page: `app/(app)/cards/[id].tsx`

- **Purpose**: Main detail view for a specific credit card.
- **Route**: Dynamic route receiving `id` (card ID).
- **Layout**:
  - **Header**: Card Name, Brand, Last 4 digits (if avail).
  - **Summary Section**:
    - Limit Progress Bar (Visual representation of used/available).
    - Numeric details: Limit Total, Used, Available.
    - Closing Day & Due Day info.
  - **Invoice Section**:
    - Date Selector (Month/Year) to switch invoices.
    - Summary for selected month (Total Amount).
  - **Transaction List**:
    - List of transactions filtered by the selected invoice month.
    - Grouped by date.

### Service Updates: `src/services/financial.ts`

- **New Methods**:
  - `getCardDetails(cardId: string)`: Fetch single card info.
  - `getCardTransactions(cardId: string, month: number, year: number)`: Fetch transactions for a specific invoice period.
    - _Logic_: Needs to account for `closingDay`. If transaction date > closing day of previous month AND <= closing day of current month -> belongs to current invoice.
  - `payInvoice(cardId: string, accountId: string, amount: number, date: Date)`: Process invoice payment.

## Implementation Plan

### Phase 1: Planning & Design (P)

- [x] Analyze current `CreditCard` model.
- [x] Analyze `FinancialService` for existing transaction queries.
- [x] Define precise invoice logic (`closingDay` handling).

### Phase 2: Implementation (E)

#### Step 1: Service Layer

- [x] Implement `FinancialService.getCardTransactions`.
  - Input: `cardId`, `month`, `year`.
  - Logic: Filter transactions by `credit_card_id`. Handle invoice window based on `closing_day`.
- [x] Implement `FinancialService.getCardDetails` (or reuse generic get).
- [x] Implement `FinancialService.payInvoice` logic to debit account and credit card.

#### Step 2: UI - Detail Page Skeleton

- [x] Create `app/(app)/cards/[id].tsx`.
- [x] Fetch card param from route.
- [x] Fetch card details on load.

#### Step 3: UI - Summary & Limit

- [x] Implement Visual Limit Bar (ProgressBar).
- [x] Display Current Balance vs Limit.

#### Step 4: UI - Invoice & Transactions

- [x] Add Month Selector (Horizontal Scroll or Dropdown).
- [x] List Transactions for selected month.
- [x] Calculate "Invoice Total" for that month locally or in query.
- [x] Add "Pay Invoice" button and modal logic.

#### Step 5: Integration

- [x] Update `app/(app)/cards/index.tsx` `onPress` to navigate to `/(app)/cards/${id}`.

### Phase 3: Verification (V)

- [x] **Manual Test**: Click a card, verify details load.
- [x] **Data Logic**: Verify transactions appear in correct month based on closing day.
- [x] **Edge Cases**:
  - Card with no transactions.
  - Card with 0 limit.
  - Navigation back.
- [x] **Bug Fix**: Fix currency formatting (use `CurrencyUtils`).
- [x] **Bug Fix**: Fix theme (dark mode support for cards).
- [x] **Bug Fix**: Fix invoice total calculation (handling refunds/payments).
- [x] **Bug Fix**: Fix lint errors.
- [x] **Feature Request**: Implement Payment Logic (Debit Account, Credit Card Balance, Record Transfer).

### Phase 4: Completion (C)

- [x] Code Review.
- [x] Merge.
- [x] Documentation Updated.
