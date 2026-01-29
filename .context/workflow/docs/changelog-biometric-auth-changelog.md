# Changelog: Biometric Authentication & App Lock

## Feature: Biometric Authentication & App Security

**Date**: 2026-01-29

### Added

- **Native Biometrics**: Integrated `expo-local-authentication` for Face ID/Touch ID support.
- **PIN Lock System**: Implemented a secure PIN fallback mechanism using `expo-secure-store`.
- **Global Lock Screen**: Created a `LockScreen` component that overlays the app when locked.
- **Auto-Lock**: Configured `AppState` listener in `_layout.tsx` to automatically lock the app when sent to background.
- **Settings UI**: Added "Security" section in User Settings to manage App Lock, Biometrics, and PIN.
- **App Permissions**: Added `NSFaceIDUsageDescription` to `app.json` for iOS compliance.

### Fixed

- **Login Hang**: Resolved an issue where Google Login would hang indefinitely if the user profile fetch failed or timed out. Added non-blocking profile loading logic.
- **Sync Auth Error**: Fixed a race condition where `mySync()` was called before authentication was fully established, causing "Not authenticated" errors on cold starts.

### Technical Details

- **Architecture**: Used `zustand` for global security state (`isLocked`, `isBiosEnabled`).
- **Storage**: Sensitive data (PIN, tokens) is stored in encrypted SecureStore, not AsyncStorage.
- **Sync Debugging**: Added enhanced logging to `sync/index.ts` to trace data pull status.

### Verification

- Tested Pin creation and verification flow.
- Verified Face ID prompt on supported devices.
- Confirmed auto-lock behavior on background/foreground transitions.
- Validated data synchronization after re-login.
