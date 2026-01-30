# System Architecture

## Overview

FinAInteli is an AI-powered financial management application built with Expo (React Native), WatermelonDB for local-first persistence, and Supabase for backend synchronization. The architecture is designed to be offline-first, highly performant, and secure.

## Architectural Patterns

- **Local-First**: Primary data storage is local (WatermelonDB), enabling instant UI updates and full offline capabilities.
- **Sync Pattern**: Bi-directional synchronization between local WatermelonDB and remote Supabase PostgreSQL.
- **Service Layer**: Dedicated services for AI (Gemini), Synchronization, and Financial logic.
- **Store-based State**: State management using Zustand for high-level UI states and authentication.

## System Layers

### 1. Presentation Layer (app/ & components/)

- **Expo Router**: File-based routing for navigation.
- **React Native Paper**: Material Design 3 component library for UI.
- **Themed Components**: Custom components in `src/components/ui` that adapt to Material 3 and Liquid Glass (iOS) themes.

### 2. Logic Layer (services/ & hooks/)

- **Financial Store**: `src/store/financialStore.ts` handles the interface between DB and UI.
- **AI Service**: `src/services/gemini.ts` orchestrates prompts for financial insights and dashboard tips.
- **Sync Service**: `src/services/sync/` manages data reconciliation.

### 3. Data & Persistence Layer (src/database/)

- **WatermelonDB**: High-performance local database with reactive bindings.
- **Models**: Explicitly defined models for Accounts, Transactions, Budgets, etc.
- **Supabase**: Backend provider for Auth, Postgres, and Edge Functions.

## Core Domain Models

- **Account**: Financial accounts (Bank, Wallet, etc.)
- **Transaction**: Individual entries of income/expense.
- **Budget**: Spend limits per category.
- **Category**: Classification for transactions.
- **CreditCard**: Specialized account type for credit tracking.

## External Dependencies

- **Supabase**: Auth, PostgreSQL, Realtime sync.
- **Google Gemini**: AI model for financial advising.
- **RevenueCat**: Subscription management.
- **Expo**: Framework and native build tools.

## Top Directories Snapshot

- `app/`: Routing and main screens (~33 files)
- `src/components/`: Reusable UI elements (~30 files)
- `src/database/`: Persistence configuration and models (~10 files)
- `src/services/`: Business logic and external API integrations (~5 files)
- `src/store/`: Zustand state management (~5 files)

## Related Resources

- [Project Overview](./project-overview.md)
- [Security Strategy](./security.md)
