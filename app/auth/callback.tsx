import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { ThemedText } from "../../src/components/ui/ThemedText";
import { useAppTheme } from "../../src/context/ThemeContext";
import { useAuthStore } from "../../src/store/authStore";

/**
 * OAuth Callback Screen
 *
 * This screen handles the redirect from OAuth providers (Google, Apple).
 * It shows a loading indicator while the auth state is being processed,
 * then redirects to the appropriate screen.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { user, initialized } = useAuthStore();

  useEffect(() => {
    // Wait for auth to be initialized
    if (!initialized) return;

    // Small delay to ensure auth state is fully processed
    const timer = setTimeout(() => {
      if (user) {
        // User is logged in, redirect to home
        router.replace("/" as const);
      } else {
        // No user, redirect to login
        router.replace("/login" as const);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [initialized, user, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <ThemedText variant="bodyLarge" style={styles.text}>
        Processando login...
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    marginTop: 16,
  },
});
