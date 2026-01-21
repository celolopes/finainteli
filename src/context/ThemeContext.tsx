import { DarkTheme as NavDarkTheme, DefaultTheme as NavDefaultTheme, ThemeProvider as NavigationThemeProvider } from "@react-navigation/native";
import React, { createContext, useContext, useMemo } from "react";
import { Platform, useColorScheme } from "react-native";
import { MD3DarkTheme, MD3LightTheme, PaperProvider, adaptNavigationTheme } from "react-native-paper";
import Colors from "../../constants/Colors";

const isIOS = Platform.OS === "ios";

export const ThemeContext = createContext({
  isDark: false,
  isGlass: isIOS,
  colors: Colors.light,
});

export const useAppTheme = () => useContext(ThemeContext);

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const myColors = isDark ? Colors.dark : Colors.light;

  const BasePaperTheme = isDark ? MD3DarkTheme : MD3LightTheme;

  const paperTheme = {
    ...BasePaperTheme,
    colors: {
      ...BasePaperTheme.colors,
      primary: myColors.primary,
      onPrimary: myColors.onPrimary,
      primaryContainer: myColors.primaryContainer,
      error: myColors.error,
      background: myColors.background,
      surface: myColors.surface,
      surfaceVariant: myColors.surfaceVariant,
      outline: myColors.outline,
      elevation: BasePaperTheme.colors.elevation,
    },
  };

  const { LightTheme: AdaptedNavLight, DarkTheme: AdaptedNavDark } = adaptNavigationTheme({
    reactNavigationLight: NavDefaultTheme,
    reactNavigationDark: NavDarkTheme,
    materialLight: MD3LightTheme,
    materialDark: MD3DarkTheme,
  });

  const navBase = isDark ? AdaptedNavDark : AdaptedNavLight;

  const finalNavTheme = {
    ...navBase,
    colors: {
      ...navBase.colors,
      primary: myColors.primary,
      background: myColors.background,
      card: isIOS ? "transparent" : myColors.surface, // Transparent for Glass TabBar interactions
      text: myColors.text,
      border: isIOS ? myColors.glassBorder : myColors.outline,
    },
  };

  const contextValue = useMemo(
    () => ({
      isDark,
      isGlass: isIOS,
      colors: myColors,
    }),
    [isDark, myColors]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <PaperProvider theme={paperTheme}>
        <NavigationThemeProvider value={finalNavTheme}>{children}</NavigationThemeProvider>
      </PaperProvider>
    </ThemeContext.Provider>
  );
}
