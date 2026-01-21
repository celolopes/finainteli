import { zodResolver } from "@hookform/resolvers/zod";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { z } from "zod";

import { ThemedContainer } from "../../src/components/ui/ThemedContainer";
import { ThemedText } from "../../src/components/ui/ThemedText";
import { useAppTheme } from "../../src/context/ThemeContext";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const { colors, isGlass, isDark } = useAppTheme();
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "user@demo.com",
      password: "password123",
    },
  });

  const onSubmit = async (_data: FormData) => {
    await SecureStore.setItemAsync("auth_token", "demo_token_123");
    router.replace("/(app)/(tabs)");
  };

  // Background Component Strategy
  const Background = ({ children }: { children: React.ReactNode }) => {
    if (isGlass) {
      // iOS: Vibrant Fluid Gradient
      const gradientColors: [string, string, ...string[]] = isDark
        ? ["#1A2980", "#26D0CE"] // Dark Aqua
        : ["#ff9a9e", "#fecfef"]; // Warm Peach

      return (
        <LinearGradient colors={gradientColors} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {children}
        </LinearGradient>
      );
    }
    // Android: M3 Expressive Background
    return <View style={[styles.container, { backgroundColor: colors.background }]}>{children}</View>;
  };

  return (
    <Background>
      <View style={styles.centerContent}>
        <ThemedContainer style={styles.card} elevation={isGlass ? 0 : 3} intensity={45}>
          <ThemedText variant="displaySmall" style={[styles.title, { color: colors.primary }]}>
            FinAInteli
          </ThemedText>

          <ThemedText variant="bodyLarge" style={[styles.subtitle, { color: colors.text }]}>
            {t("auth.subtitle")}
          </ThemedText>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label={t("auth.email")}
                value={value}
                onChangeText={onChange}
                mode="outlined"
                style={[styles.input, isGlass && styles.glassInput]}
                error={!!errors.email}
                theme={{ roundness: 12 }}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label={t("auth.password")}
                value={value}
                onChangeText={onChange}
                mode="outlined"
                secureTextEntry
                style={[styles.input, isGlass && styles.glassInput]}
                error={!!errors.password}
                theme={{ roundness: 12 }}
              />
            )}
          />

          <Button mode="contained" onPress={handleSubmit(onSubmit)} style={styles.button} contentStyle={{ height: 50 }}>
            {t("auth.login")}
          </Button>

          <Button mode={isGlass ? "text" : "outlined"} onPress={() => {}} style={styles.socialButton} icon="google" textColor={isGlass ? colors.text : colors.primary}>
            {t("auth.continueWithGoogle")}
          </Button>
        </ThemedContainer>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    padding: 32,
    borderRadius: 28,
    width: "100%",
    alignSelf: "center",
    maxWidth: 500,
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 40,
    opacity: 0.8,
  },
  input: {
    marginBottom: 20,
    backgroundColor: "transparent",
  },
  glassInput: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  button: {
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 100, // Pill shape
  },
  socialButton: {
    marginTop: 8,
    borderRadius: 100,
  },
});
