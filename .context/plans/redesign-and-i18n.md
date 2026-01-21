---
status: unfilled
generated: 2026-01-20
agents:
  - type: architect-specialist
    role: Define design system architecture and i18n strategy
  - type: frontend-specialist
    role: Implement UI components and screens
  - type: code-reviewer
    role: Review implementation against design guidelines
  - type: test-writer
    role: Verify visual regressions and translation completeness
docs:
  - project-overview.md
  - architecture.md
  - development-workflow.md
---

# Plan: Visual Redesign & Internationalization

## Goal

Implement a complete visual redesign featuring **Liquid Glass** aesthetic for iOS and **Material 3 Expressive** for Android. Concurrently, establish a robust **Internationalization (i18n)** system supporting Portuguese (pt-BR) and English (en-US).

## Context

The application currently uses a basic Expo Router setup with minimal styling. The goal is to elevate the user experience with platform-specific premium designs and support a global audience.

- **iOS**: Focus on blur effects, transparency, gradients, and rounded aesthetics (Liquid Glass).
- **Android**: leverage Material 3 Expressive with dynamic colors, bold typography, and standard components.
- **i18n**: Use `i18next` with `expo-localization` to manage translations.

## Phases

### Phase 1: Foundation (Dependencies & Architecture)

**Objective**: Set up necessary libraries and base structures for theming and i18n.
**Steps**:

1.  **Dependencies**: Install `expo-blur`, `expo-haptics`, `react-native-reanimated`, `expo-linear-gradient` (for Glass).
2.  **i18n Setup**: Install `i18next`, `react-i18next`, `expo-localization`, `intl-pluralrules`.
3.  **Locale Config**: Create `src/i18n` with `en.json` and `pt.json`. Configure i18n initialization.
4.  **Theme Context**: Create a unified `ThemeProvider` that detects OS and serves the correct theme tokens (colors, spacing, typography).
    - _iOS Theme_: Define glass opacity levels, blur intensities, and gradient palettes.
    - _Android Theme_: Configure `react-native-paper` MD3 theme with expressive tokens.

### Phase 2: Design System Components

**Objective**: Build reusable, platform-adaptive components.
**Steps**:

1.  **GlassContainer (iOS specific)**: A wrapper component using `BlurView` and gradients to create the liquid glass effect. Fallback to solid surface on Android.
2.  **Typography**: Implement `ThemedText` with distinct styles for iOS (SF Pro rounded feel) and Android (Roboto/Product Sans expressive feel).
3.  **Buttons**:
    - _iOS_: Glossy, semi-transparent buttons with subtle gradients.
    - _Android_: MD3 Filled, Tonal, and Elevated buttons.
4.  **Inputs**:
    - _iOS_: Glass-morphism inputs with blurred background.
    - _Android_: MD3 Outlined/Filled TextFields.
5.  **Cards**:
    - _iOS_: "Frosted glass" cards.
    - _Android_: MD3 Cards with elevation.

### Phase 3: Screen Refactor & Translation

**Objective**: Apply the new design system to all screens and replace hardcoded strings.
**Steps**:

1.  **Auth Screens (`app/(auth)`)**:
    - Redesign Login/Register with a premium, immersive background (likely a gradient or abstract shape) to show off the glass effect on iOS.
    - Translate all texts.
2.  **App Layout (`app/_layout.tsx`, `app/(context)`)**:
    - Update Tab Bar / Drawer to use platform styles (Glass Tab Bar on iOS, Material Navigation Bar on Android).
3.  **Dashboard/Home**:
    - Refactor charts and summary cards.
    - Ensure `Victory` charts integrate well with the new color palettes.
4.  **Transaction Forms**:
    - Update form inputs and validation messages to use i18n keys.

### Phase 4: Verification & Polish

**Objective**: Ensure quality and performance.
**Steps**:

1.  **Visual QA**: Verify contrast ratios and visual glitches on both simulators.
2.  **Language Toggle**: Test switching languages on the fly (if supported) or verifying device locale detection.
3.  **Performance**: Check that excessive BlurViews on iOS do not degrade FPS (use `experimentalBlurMethod` if needed or optimized complexity).

## Success Criteria

- [ ] iOS App features distinct Liquid Glass aesthetic (blur, gradients).
- [ ] Android App follows Material 3 Expressive guidelines.
- [ ] App automatically detects device language (PT or EN) and displays correct strings.
- [ ] No hardcoded text strings remain in UI components.
- [ ] Performance prevents frame drops below 60fps on standard devices.

## Rollback Plan

- Revert to main branch commit prior to the start of this plan.
- If i18n fails, fallback to hardcoded English strings temporarily.
