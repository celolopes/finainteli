// Material 3 Expressive & iOS Liquid Glass Palette

const Hues = {
  primary: "#6750A4", // M3 Purple
  primaryContainer: "#EADDFF",
  secondary: "#625B71",
  tertiary: "#7D5260",
  error: "#B3261E",
  glass: {
    light: "rgba(255, 255, 255, 0.65)",
    dark: "rgba(25, 25, 35, 0.65)",
    borderLight: "rgba(255, 255, 255, 0.3)",
    borderDark: "rgba(255, 255, 255, 0.1)",
  },
};

export default {
  light: {
    text: "#1C1B1F",
    background: "#FFFBFE",
    tint: Hues.primary,
    tabIconDefault: "#79747E",
    tabIconSelected: Hues.primary,
    // Semantic
    primary: Hues.primary,
    onPrimary: "#FFFFFF",
    primaryContainer: Hues.primaryContainer,
    error: Hues.error,
    surface: "#FFFBFE",
    surfaceVariant: "#E7E0EC",
    outline: "#79747E",
    // Glass
    glass: Hues.glass.light,
    glassBorder: Hues.glass.borderLight,
  },
  dark: {
    text: "#E6E1E5",
    background: "#1C1B1F",
    tint: "#D0BCFF", // Primary Dark
    tabIconDefault: "#938F99",
    tabIconSelected: "#D0BCFF",
    // Semantic
    primary: "#D0BCFF",
    onPrimary: "#381E72",
    primaryContainer: "#4F378B",
    error: "#F2B8B5",
    surface: "#1C1B1F",
    surfaceVariant: "#49454F",
    outline: "#938F99",
    // Glass
    glass: Hues.glass.dark,
    glassBorder: Hues.glass.borderDark,
  },
};
