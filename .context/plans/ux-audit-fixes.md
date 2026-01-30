# Plan: UX Audit Fixes

## 📋 Overview

This plan addresses 22 issues and several major warnings identified by the UX Audit. The focus is on accessibility, adherence to design constraints (Purple Ban), and improving the overall premium feel through transitions and refined styling.

## 🎯 Goals & Scope

- **Accessibility**: 100% compliance with form labeling (`accessibilityLabel` in React Native).
- **Design Alignment**: Complete removal of prohibited colors (Purple/Violet) and pure black (#000000).
- **UX Excellence**: Implement smooth page transitions and refine typography line lengths.
- **Trust & Persuasion**: Add visual trust indicators where relevant.

## 🛠️ Phases

### Phase 1: Accessibility & Foundation Fixes (frontend-specialist)

**Objective**: Fix form labeling and basic color violations.

- [x] Add `accessibilityLabel` and proper labels to all `TextInput` components in identified files:
  - `app/(app)/report.tsx`
  - `app/(app)/goals.tsx`
  - `app/(auth)/login.tsx`
  - `app/(app)/settings/budgets.tsx`
  - `app/(app)/settings/ai-usage.tsx`
- [x] Replace all instances of pure black `#000000` with `#121212` or Material 3 grays.
- [x] Implement line length constraints (`max-width`) in transaction and report views.

**Deliverables**: Accessible forms and compliant base palette.
**Commit**: `fix(ux): add accessibility labels and fix pure black color violations`

### Phase 2: Design Identity & Theme Refinement (frontend-specialist)

**Objective**: Adhere to Purple Ban and enhance visual appeal.

- [x] **Purple Ban Task**: Replace all purple/violet gradients and colors with a "Finance-Premium" palette (Deep Teal `#004D40`, Emerald, and Gold accents).
  - Target: `app/(auth)/login.tsx` glass background.
- [x] **Typography**: Adjust line heights and character constraints for better readability (45-75ch).
- [x] **Trust Elements**: Add "SSL Secure" or lock icons to financial forms.

**Deliverables**: Non-cliché, premium-feel theme.
**Commit**: `style(ux): implement premium finance palette and apply purple ban fixes`

### Phase 3: UX Motion & Polish (frontend-specialist / mobile-specialist)

**Objective**: Add transitions and Final Maestro Audit.

- [x] **Transitions**: Configure `Stack` options in `app/_layout.tsx` for smooth `fade` or `slide` transitions.
- [x] **Hero Polish**: Add subtle gradients or micro-animations to the main dashboard hero.
- [x] **Maestro Audit**: Perform self-audit against "Cliché Rejection Triggers".

**Deliverables**: "Wow" factor through motion and layout uniqueness.
**Commit**: `feat(ux): add page transitions and polish dashboard hero animations`

## 👥 Agent Lineup

- **frontend-specialist**: Lead implementation of UI/UX fixes.
- **mobile-specialist**: Ensure transitions work smoothly on physical devices (Android/iOS).
- **code-reviewer**: Final audit of accessibility and performance impacts.

## 📋 Success Criteria

- [x] `checklist.py` UX Audit returns fewer than 5 warnings and 0 critical issues.
- [x] All forms are keyboard-navigable and screen-reader friendly.
- [x] Zero instances of purple/violet in the UI.
- [x] Smooth transitions between all main tabs and stacks.

## 🔄 Rollback Plan

- If transitions cause performance lag, revert `Stack` options to default.
- If palette changes are rejected by user, restore from git hash.
