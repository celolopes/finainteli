---
status: in_progress
generated: 2026-01-23
agents:
  - type: "frontend-specialist"
    role: "Generate assets and manage app configuration"
docs:
  - ".agent/GEMINI.md"
  - "context7: Apple Human Interface Guidelines"
  - "context7: Material Design 3"
phases:
  - id: "P"
    name: "Planning"
    description: "Define icon styles, prompts, and file requirements."
    prevc: "P"
    status: completed
  - id: "R"
    name: "Review"
    description: "Approve visual direction and plan."
    prevc: "R"
    status: completed
  - id: "E"
    name: "Execution"
    description: "Generate and replace icon assets."
    prevc: "E"
    status: completed
  - id: "V"
    name: "Verification"
    description: "Verify asset dimensions and configuration."
    prevc: "V"
    status: completed
  - id: "C"
    name: "Completion"
    description: "Finalize workflow."
    prevc: "C"
    status: completed
---

# Design App Icons (iOS Liquid Glass & Android Adaptive) Plan

> Create "Liquid Glass" style iOS icons and "Adaptive" Android icons for FinAInteli.

## Requirements Analysis

### iOS (Liquid Glass)

- **Style**: Layered, translucent, specular highlights, depth.
- **Spec**: Square, 1024x1024px PNG. System applies rounded corners (squircle).
- **Target File**: `assets/images/icon.png` (Universal/iOS).

### Android (Adaptive)

- **Style**: Material Design 3. Separated Foreground and Background.
- **Specs**:
  - **Foreground**: 1024x1024px (content in center 66% safe zone). Transparent background.
  - **Background**: 1024x1024px (solid color or pattern). No transparency.
- **Target Files**:
  - `assets/images/adaptive-icon.png` (Combined/Foreground).
  - Background color defined in `app.json` or separate image.

### Metadata

- **Play Store**: 512x512px (usually same as iOS but square).
- **Notification**: White only, transparent background.

## Prompts Strategy

**iOS Liquid Glass Concept:**

> "A stunning 3D glossy app icon for a finance AI app. Style: Apple Liquid Glass. A stylized abstract financial chart curve made of glowing glass, intertwined with neural network nodes. Deep blue gradient background with subtle glass texture. High gloss, specular highlights, 8k resolution, minimalist, modern."

**Android Foreground Concept:**

> "Vector style app icon logo for finance AI app. A clean, bold, white abstract financial curve on a transparent background. Material Design 3 style. Flat with soft drop shadow. Minimum detail, high contrast."

## Execution Steps (Phase E)

1.  **Generate iOS Icon**: `generate_image` ("Liquid Glass style...") -> `assets/images/icon.png`.
2.  **Generate Android Foreground**: `generate_image` ("Material vector logo...") -> `assets/images/adaptive-icon.png`.
3.  **Generate Android Background**: Defined color `#000000` in `app.json`.
4.  **Generate Notification Icon**: `generate_image` ("Simple white silhouette...") -> `assets/images/notification-icon.png`.
5.  **Configure app.json**: Ensure `adaptiveIcon` points to new foreground/background images.

## Verification Criteria (Phase V)

- [x] iOS icon is 1024x1024.
- [x] Android foreground has logo in center 66%.
- [x] Notification icon is distinct and monochromatic.
- [x] `app.json` links are correct.
