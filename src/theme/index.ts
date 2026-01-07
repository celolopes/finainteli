import { MD3DarkTheme, MD3LightTheme, adaptNavigationTheme } from "react-native-paper";
import { DarkTheme as NavDarkTheme, DefaultTheme as NavLightTheme } from "@react-navigation/native";

const premiumColors = {
  primary: "#6C63FF", // Modern Violet
  secondary: "#03DAC6", // Teal
  backgroundDark: "#121212",
  surfaceDark: "#1E1E1E",
  backgroundLight: "#F5F5F7",
  surfaceLight: "#FFFFFF",
  accent: "#FF4081",
  success: "#00E676",
  error: "#FF5252",
};

export const CustomDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: premiumColors.primary,
    background: premiumColors.backgroundDark,
    surface: premiumColors.surfaceDark,
    secondary: premiumColors.secondary,
  },
};

export const CustomLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: premiumColors.primary,
    background: premiumColors.backgroundLight,
    surface: premiumColors.surfaceLight,
    secondary: premiumColors.secondary,
  },
};

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavLightTheme,
  reactNavigationDark: NavDarkTheme,
});

export const NavigationTheme = {
  Light: {
    ...LightTheme,
    colors: {
      ...LightTheme.colors,
      primary: premiumColors.primary,
      background: premiumColors.backgroundLight,
    },
  },
  Dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: premiumColors.primary,
      background: premiumColors.backgroundDark,
      card: premiumColors.surfaceDark,
    },
  },
};
