---
name: Biometric Authentication & App Lock
slug: biometric-auth
status: completed
description: Implement FaceID/TouchID protection for app entry and background resume, with a PIN fallback mechanism and user settings.
architect: true
agents:
  - type: frontend-specialist
    role: UI/UX implementation of Lock Screen and Settings
  - type: mobile-developer
    role: Native integration and AppState handling
  - type: security-auditor
    role: Review implementation of SecureStore and Auth flow
---

# 📱 Feature Plan: Biometric Authentication

## 🎯 Objective

Protects the application access by requiring Biometric Authentication (Face ID / Touch ID) or a fallback PIN whenever the app is opened or brought to the foreground.

## 🛠 Architecture & Tech Stack

- **Library**: `expo-local-authentication` for biometrics.
- **Storage**: `expo-secure-store` for storing the encrypted PIN and enabled status.
- **State Management**: `zustand` (via `useAuthStore` or new `useSecurityStore`) to manage `isLocked` state.
- **Lifecycle**: React Native `AppState` to trigger lock on `background` state.

## 📦 Dependencies

- `expo-local-authentication` (Install required)
- `expo-secure-store` (Already installed)
- `expo-haptics` (Already installed - for feedback)

## 📅 Phases

### Phase 1: Setup & Infrastructure

1. **Dependencies**: Install `expo-local-authentication`.
2. **Apple Config**: Update `app.json` with `NSFaceIDUsageDescription`.
3. **Security Store**: create `services/security.ts` to handle:
   - `savePin(pin)`
   - `validatePin(pin)`
   - `hasPin()`
   - `setBiometricsEnabled(bool)`
   - `getBiometricsEnabled()`
4. **State Store**: Create `stores/securityStore.ts` (Zustand):
   - State: `isLocked`, `requiresSetup`.
   - Actions: `lockApp()`, `unlockApp()`, `checkRequirements()`.

### Phase 2: UI Implementation

1. **Lock Screen Component** (`components/security/LockScreen.tsx`):
   - Full-screen modal or conditioned view.
   - PIN Dots (4 digits).
   - Numeric Keypad.
   - "Use FaceID" button (auto-trigger on mount).
   - Haptic feedback on error.
2. **PIN Setup Screen** (`app/(app)/settings/security/pin-setup.tsx`):
   - Flow: "Enter new PIN" -> "Confirm PIN".
   - Save to SecureStore.

### Phase 3: Integration & Logic

1. **Root Integration**:
   - Wrap `app/_layout.tsx` or main provider with the Security Check.
   - If `!hasPin`, force Setup flow (or allow skipping if feature is optional? User said "deixe como opcional". So if no PIN set, feature is disabled).
2. **AppState Listener**:
   - In `_layout.tsx`, listen for `AppState.change`.
   - If `status === 'active'` AND `securityEnabled`, trigger `verifyBiometrics()`.
   - If `status === 'background'`, set `isLocked = true`.

### Phase 4: User Settings

1. **Settings Page**: Update `app/(app)/settings/index.tsx` (or creating a specific security section).
   - Toggle: "Bloqueio de App" (Switch).
   - Action: "Alterar PIN" (Visible only if enabled).
   - Toggle: "Usar Biometria" (Visible only if enabled).

### Phase 5: Verification & Polish

1. **Edge Cases**:
   - User removes Biometry from phone settings -> Fallback to PIN.
   - User forgets PIN -> (Out of scope? usually requires reinstall or re-login. We will assume Re-login clears security settings for now).
2. **UX Polish**:
   - Smooth transition when unlocking.
   - Avoid "double lock" on quick switches.

## ✅ Definition of Done

1. App prompts for PIN/FaceID on cold start.
2. App prompts for PIN/FaceID when returning from background.
3. User can enable/disable this feature in Settings.
4. User can define/change their PIN.
5. Code is reviewed and no secure keys are logged.

## 📝 Execution Log (Stability & Pre-requisites)

### Session: 2024-01-29 (Critical Fixes)

Before implementing biometrics, critical stability issues with Login and Sync were resolved to ensure a reliable foundation.

- **Login Infinite Loop Resolved**:
  - Modified `authStore.ts` to prevent `onAuthStateChange` from triggering redundant profile fetches during `SIGNED_IN` events initiated by Google Login.
  - Implemented manual profile fetching within `signInWithGoogle` to control the flow.
- **Sync UX Improvements**:
  - Fixed `AddTransaction` currency input formatting (custom BRL mask).
  - Ensured `SyncLoadingScreen` appears correctly after login to prevent empty home screens.
- **Data & UI Integity**:
  - Fixed invalid icons (`gamepad-2`, `shopping-bag`) in database via migration.
  - Verified `Monthly Summary` logic (confirmed behaving correctly for current date range).

_Status: Stability Fixes Complete. Ready for Biometric Implementation._

### ✅ Completion Note

Plan marked as completed by user request after resolving critical stability blockers (Login Loop, Sync, UI Fixes). The strictly biometric features (FaceID/TouchID) will be addressed in a dedicated future iteration.
