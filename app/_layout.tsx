import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { TutorialOverlay } from "../src/components/tutorial/TutorialOverlay";
import { AppThemeProvider } from "../src/context/ThemeContext";
import { TutorialProvider } from "../src/context/TutorialContext";
import "../src/i18n";
import { useStore } from "../src/store/useStore";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const { initialize } = useStore();

  useEffect(() => {
    initialize();
    if (loaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded]);

  // Prevent rendering until fonts are loaded
  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <TutorialProvider>
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(app)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <TutorialOverlay />
          <StatusBar style="auto" />
        </TutorialProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}
