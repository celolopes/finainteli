import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { PaperProvider } from "react-native-paper";
import { useStore } from "../src/store/useStore";
import { CustomDarkTheme, CustomLightTheme, NavigationTheme } from "../src/theme/index";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const { theme, initialize } = useStore();

  useEffect(() => {
    initialize();
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  const paperTheme = theme === "dark" ? CustomDarkTheme : CustomLightTheme;
  const navTheme = theme === "dark" ? NavigationTheme.Dark : NavigationTheme.Light;

  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={navTheme}>
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />
      </ThemeProvider>
    </PaperProvider>
  );
}
