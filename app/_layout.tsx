import { DatabaseProvider } from "@nozbe/watermelondb/DatabaseProvider";
import * as Sentry from "@sentry/react-native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LockScreen } from "../src/components/security/LockScreen";
import { TutorialOverlay } from "../src/components/tutorial/TutorialOverlay";
import { AnimatedSplashScreen } from "../src/components/ui/AnimatedSplashScreen";
import { OfflineBanner } from "../src/components/ui/OfflineBanner";
import { UpdateModal } from "../src/components/ui/UpdateModal";
import { AppThemeProvider } from "../src/context/ThemeContext";
import { TutorialProvider } from "../src/context/TutorialContext";
import { database } from "../src/database";
import "../src/i18n";
import { mySync } from "../src/services/sync";
import { useAuthStore } from "../src/store/authStore";
import { useSecurityStore } from "../src/store/securityStore";
import { useStore } from "../src/store/useStore";

Sentry.init({
  dsn: "https://99345603a9e7a1fdd171a862da9d8e83@o4510343644512256.ingest.us.sentry.io/4510822647791616",

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

SplashScreen.preventAutoHideAsync();

export default Sentry.wrap(function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const { initialize } = useStore();
  const { initialize: initAuth, initialized } = useAuthStore();
  const { initialize: initSecurity, lockApp } = useSecurityStore();
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [isSplashAnimationFinished, setIsSplashAnimationFinished] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

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

  useEffect(() => {
    if (loaded && initialized && !isChecking) {
      setIsSplashVisible(false);
    }
  }, [loaded, initialized, isChecking]);

  useEffect(() => {
    async function checkUpdates() {
      if (__DEV__) {
        setIsChecking(false);
        return;
      }
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          setIsUpdating(true);
          // Don't set isChecking(false) -> Keep splash visible behind the modal
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        } else {
          setIsChecking(false); // No update, proceed to app
        }
      } catch (error) {
        // Silently fail if update check fails (e.g. offline)
        console.log("Update check failed:", error);
        setIsChecking(false);
      }
    }

    // Check immediately
    checkUpdates();
  }, []);

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

            {!isSplashAnimationFinished && <AnimatedSplashScreen isVisible={isSplashVisible} onAnimationFinish={() => setIsSplashAnimationFinished(true)} />}

            <UpdateModal isVisible={isUpdating} />
          </TutorialProvider>
        </AppThemeProvider>
      </DatabaseProvider>
    </GestureHandlerRootView>
  );
});
