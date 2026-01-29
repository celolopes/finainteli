---
id: feature-transaction-options
title: Transaction Installments & Recurrence
status: completed
progress: 100
owner: feature-developer
context_required:
  - "app/(app)/add-transaction.tsx"
  - "src/services/financial.ts"
  - "src/database/model/Transaction.ts"
lastUpdated: "2026-01-29T17:25:00.000Z"
---

# Transaction Installments & Recurrence

## Overview

Enhance the "New Transaction" flow to support complex transaction types: **Installments (Parcelamento)** specifically for credit cards, and **Recurrence (Lançamento Fixo)** for repeating transactions (e.g., subscriptions, rent).

## Goals

1.  **Credit Card Installments**: Allow splitting a purchase into `N` months.
    - Support toggling between "Total Value" (split by N) and "Installment Value" (multiplied by N).
    - Automatically generate `N` transaction records with future dates.
    - Respect credit card closing days implicitly (future dates handling).
2.  **Recurring Transactions**: Allow defining a transaction that repeats.
    - Frequencies: Monthly, Weekly, Biweekly, Daily, etc.
    - Mode: "Fixed" (Recorrente).
    - Limit: Define number of occurrences or end date (MVP: predefined options e.g., "12 months", "Forever" -> max cap).

## Technical Strategy

To avoid complex schema migrations and backend changes (scheduler), we adoption a **"Generate Future Records"** strategy.

### 1. Installment Logic (Credit Card)

- **Input**: Total Amount (or Installment Amount), Installments Count.
- **Process**:
  - Validates inputs.
  - Generates `N` records.
  - Date for Record `i` = `TransactionDate` + `i` months.
  - Description appends `(i+1/N)`.
  - Type: Same as original (Expense).

### 2. Recurrence Logic

- **Input**: Frequency (Daily, Weekly, Biweekly, Monthly, etc.), Duration (or End Date).
- **Process**:
  - Generates simple records for the specified duration (capped at e.g., 2 years for performance/MVP).
  - Date increments by Frequency interval.
  - Description appends `(Recorrente)`.

## Implementation Plan

### Phase 1: Planning & UI Design (P)

- [x] Analyze `add-transaction.tsx` for UI placement.
- [x] Define logic for generating records in `FinancialService`.
- [x] Determine UI layout for "Installments" (only visible if Card selected).
- [x] Determine UI layout for "Recurrence" (Toggle: "Recorrente?").

### Phase 2: Implementation (E)

#### Step 1: UI Implementation (`add-transaction.tsx`)

- [x] Add `isInstallment` toggle (If Credit Card).
- [x] Add `installments` input (Number).
- [x] Add `installmentValueMode` (Total vs Parcela).
- [x] Add `isRecurring` toggle.
- [x] Add `recurrenceFrequency` dropdown (Weekly, Monthly, Yearly).
- [x] Add `recurrenceCount` or `recurrenceEnd`.

#### Step 2: Logic Implementation (`FinancialService.ts`)

- [x] Create `createComplexTransaction` (handling generation of multiple records).
- [x] Implement `generateInstallments` logic (inside service).
- [x] Implement `generateRecurrence` logic (inside service).
- [x] Batch write to WatermelonDB.

### Phase 3: Verification (V)

- [x] Test Installment generation (check dates and amounts).
- [x] Test Recurrence generation (check intervals).
- [x] Check performance with batch creation (e.g., 360 records).
- [x] Verify data types and schema updates (Status field added).
- [x] Verify Invoice Visibility logic (Users confusing Closed vs Open invoices).

### Phase 4: Completion (C)

- [x] Code Review (Self).
- [x] Documentation.

## Risks & Mitigations

- **Data Pollution**: Creating 100 records at once makes it hard to "Edit All".
  - _Mitigation_: Warn user. Future: Add `group_id` to link them (but requires schema change, out of scope for strict MVP unless easy).
- **Performance**: Batch insert 50+ records.
  - _Mitigation_: WatermelonDB `batch` is efficient.
