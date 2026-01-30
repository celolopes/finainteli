import { DatabaseProvider } from "@nozbe/watermelondb/DatabaseProvider";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LockScreen } from "../src/components/security/LockScreen";
import { TutorialOverlay } from "../src/components/tutorial/TutorialOverlay";
import { OfflineBanner } from "../src/components/ui/OfflineBanner";
import { AppThemeProvider } from "../src/context/ThemeContext";
import { TutorialProvider } from "../src/context/TutorialContext";
import { database } from "../src/database";
import "../src/i18n";
import { mySync } from "../src/services/sync";
import { useAuthStore } from "../src/store/authStore";
import { useSecurityStore } from "../src/store/securityStore";
import { useStore } from "../src/store/useStore";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const { initialize } = useStore();
  const { initialize: initAuth } = useAuthStore();
  const { initialize: initSecurity, lockApp } = useSecurityStore();

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background") {
        lockApp();
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    initialize();
    initAuth();
    initSecurity();
    if (loaded) {
      SplashScreen.hideAsync().catch(() => {});
      // Trigger background sync only if authenticated
      const { session } = useAuthStore.getState();
      if (session) {
        mySync().catch((err) => console.error("Initial Sync Error:", err));
      }
    }
  }, [loaded]);

  // Prevent rendering until fonts are loaded
  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DatabaseProvider database={database}>
        <AppThemeProvider>
          <LockScreen />
          <OfflineBanner />
          <TutorialProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "fade", // page transition: fade route
                contentStyle: { backgroundColor: "transparent" },
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(app)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" options={{ headerShown: true }} />
            </Stack>
            <TutorialOverlay />
            <StatusBar style="auto" />
          </TutorialProvider>
        </AppThemeProvider>
      </DatabaseProvider>
    </GestureHandlerRootView>
  );
}
