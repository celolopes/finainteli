import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Animated, Image, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, TouchableWithoutFeedback, View } from "react-native";
import { ActivityIndicator, Button, Snackbar, TextInput } from "react-native-paper";
import { z } from "zod";

import { SyncLoadingScreen } from "../../src/components/ui/SyncLoadingScreen";
import { ThemedContainer } from "../../src/components/ui/ThemedContainer";
import { ThemedText } from "../../src/components/ui/ThemedText";
import { useAppTheme } from "../../src/context/ThemeContext";
import { mySync } from "../../src/services/sync";
import { useAuthStore } from "../../src/store/authStore";

// Validation schema creators
const createLoginSchema = (t: any) =>
  z.object({
    email: z.string().email(t("auth.validation.invalidEmail")),
    password: z.string().min(6, t("auth.validation.minChars", { count: 6 })),
  });

const createSignUpSchema = (t: any) =>
  createLoginSchema(t)
    .extend({
      displayName: z
        .string()
        .min(2, t("auth.validation.minChars", { count: 2 }))
        .optional(),
      confirmPassword: z.string().min(6, t("auth.validation.minChars", { count: 6 })),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("auth.validation.passwordMismatch"),
      path: ["confirmPassword"],
    });

export default function LoginScreen() {
  const router = useRouter();
  const { colors, isGlass, isDark } = useAppTheme();
  const { t } = useTranslation();

  // Auth store
  const { loading, error, initialized, user, signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple, initialize, clearError } = useAuthStore();

  // Local state
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Animation for logo
  const logoScale = React.useRef(new Animated.Value(0)).current;

  // Schemas
  const loginSchema = useMemo(() => createLoginSchema(t), [t]);
  const signUpSchema = useMemo(() => createSignUpSchema(t), [t]);

  type LoginFormData = z.infer<typeof loginSchema>;
  type SignUpFormData = z.infer<typeof signUpSchema>;

  // Initialize auth
  useEffect(() => {
    initialize();
  }, []);

  // Animate logo on mount
  useEffect(() => {
    Animated.spring(logoScale, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  // Track if we are in the middle of a manual login process
  const isLoggingIn = React.useRef(false);

  // Redirect if user is authenticated (but not if we are manually logging in,
  // because we want to show the sync screen first)
  useEffect(() => {
    if (initialized && user && !isLoggingIn.current) {
      router.replace("/");
    }
  }, [initialized, user]);

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Sign up form
  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      displayName: "",
    },
  });

  // Handle post-login sync and navigation
  const handlePostLogin = async () => {
    setIsSyncing(true);
    try {
      console.log("[Login] Starting initial sync...");
      await mySync();
      console.log("[Login] Initial sync complete.");
    } catch (e) {
      console.warn("[Login] Sync warning:", e);
    } finally {
      setIsSyncing(false);
      isLoggingIn.current = false; // Reset lock
      router.replace("/");
    }
  };

  const handleLogin = async (data: LoginFormData) => {
    Keyboard.dismiss();
    isLoggingIn.current = true; // Lock redirection
    const result = await signInWithEmail(data.email, data.password);
    if (result.success) {
      await handlePostLogin();
    } else {
      isLoggingIn.current = false; // Unlock on failure
    }
  };

  const handleSignUp = async (data: SignUpFormData) => {
    Keyboard.dismiss();
    isLoggingIn.current = true;
    const result = await signUpWithEmail(data.email, data.password, data.displayName);
    if (result.success) {
      await handlePostLogin();
    } else {
      isLoggingIn.current = false;
    }
  };

  const handleGoogleLogin = async () => {
    isLoggingIn.current = true;
    const result = await signInWithGoogle();
    if (result.success) {
      await handlePostLogin();
    } else {
      isLoggingIn.current = false;
    }
  };

  const handleAppleLogin = async () => {
    isLoggingIn.current = true;
    const result = await signInWithApple();
    if (result.success) {
      await handlePostLogin();
    } else {
      isLoggingIn.current = false;
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    loginForm.reset();
    signUpForm.reset();
    clearError();
  };

  // Show loading while initializing
  if (!initialized) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Background Component
  const Background = ({ children }: { children: React.ReactNode }) => {
    if (isGlass) {
      const gradientColors: [string, string, ...string[]] = isDark
        ? ["#002420", "#004D40", "#121212"] // Deep Teal/Green for Finance
        : ["#00695C", "#4DB6AC"]; // Vibrant Teal

      return (
        <LinearGradient colors={gradientColors} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {children}
        </LinearGradient>
      );
    }
    return <View style={[styles.container, { backgroundColor: colors.background }]}>{children}</View>;
  };

  return (
    <Background>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.centerContent}>
            <ThemedContainer style={styles.card} elevation={isGlass ? 0 : 3} intensity={45}>
              {/* Animated Logo */}
              <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
                <Image source={require("../../assets/images/adaptive-icon.png")} style={styles.logo} resizeMode="contain" />
              </Animated.View>

              {/* App Name */}
              <ThemedText variant="headlineMedium" style={[styles.title, { color: colors.primary }]}>
                FinAInteli
              </ThemedText>

              {/* Subtitle */}
              <ThemedText variant="bodyLarge" style={[styles.subtitle, { color: colors.text }]}>
                {t("auth.subtitle")}
              </ThemedText>

              {/* Login Form */}
              {!isSignUp && (
                <>
                  <Controller
                    control={loginForm.control}
                    name="email"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        label={t("auth.email")}
                        value={value}
                        onChangeText={onChange}
                        mode="outlined"
                        style={[styles.input, isGlass && styles.glassInput]}
                        error={!!loginForm.formState.errors.email}
                        theme={{ roundness: 12 }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        left={<TextInput.Icon icon="email-outline" />}
                        accessibilityLabel={t("auth.email")}
                        aria-label={t("auth.email")}
                      />
                    )}
                  />

                  <Controller
                    control={loginForm.control}
                    name="password"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        label={t("auth.password")}
                        value={value}
                        onChangeText={onChange}
                        mode="outlined"
                        secureTextEntry={!showPassword}
                        style={[styles.input, isGlass && styles.glassInput]}
                        error={!!loginForm.formState.errors.password}
                        theme={{ roundness: 12 }}
                        left={<TextInput.Icon icon="lock-outline" />}
                        right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
                        accessibilityLabel={t("auth.password")}
                        aria-label={t("auth.password")}
                      />
                    )}
                  />

                  <Button mode="contained" onPress={loginForm.handleSubmit(handleLogin)} style={styles.button} contentStyle={styles.buttonContent} loading={loading} disabled={loading}>
                    {t("auth.login")}
                  </Button>
                </>
              )}

              {/* Sign Up Form */}
              {isSignUp && (
                <>
                  <Controller
                    control={signUpForm.control}
                    name="displayName"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        label={t("auth.displayName")}
                        value={value}
                        onChangeText={onChange}
                        mode="outlined"
                        style={[styles.input, isGlass && styles.glassInput]}
                        error={!!signUpForm.formState.errors.displayName}
                        theme={{ roundness: 12 }}
                        left={<TextInput.Icon icon="account-outline" />}
                        accessibilityLabel={t("auth.displayName")}
                      />
                    )}
                  />

                  <Controller
                    control={signUpForm.control}
                    name="email"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        label={t("auth.email")}
                        value={value}
                        onChangeText={onChange}
                        mode="outlined"
                        style={[styles.input, isGlass && styles.glassInput]}
                        error={!!signUpForm.formState.errors.email}
                        theme={{ roundness: 12 }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        left={<TextInput.Icon icon="email-outline" />}
                      />
                    )}
                  />

                  <Controller
                    control={signUpForm.control}
                    name="password"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        label={t("auth.password")}
                        value={value}
                        onChangeText={onChange}
                        mode="outlined"
                        secureTextEntry={!showPassword}
                        style={[styles.input, isGlass && styles.glassInput]}
                        error={!!signUpForm.formState.errors.password}
                        theme={{ roundness: 12 }}
                        autoCapitalize="none"
                        left={<TextInput.Icon icon="lock-outline" />}
                        right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
                      />
                    )}
                  />

                  <Controller
                    control={signUpForm.control}
                    name="confirmPassword"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        label={t("auth.confirmPassword")}
                        value={value}
                        onChangeText={onChange}
                        mode="outlined"
                        secureTextEntry={!showPassword}
                        style={[styles.input, isGlass && styles.glassInput]}
                        error={!!signUpForm.formState.errors.confirmPassword}
                        theme={{ roundness: 12 }}
                        autoCapitalize="none"
                        left={<TextInput.Icon icon="lock-check-outline" />}
                        accessibilityLabel={t("auth.confirmPassword")}
                      />
                    )}
                  />

                  <Button mode="contained" onPress={signUpForm.handleSubmit(handleSignUp)} style={styles.button} contentStyle={styles.buttonContent} loading={loading} disabled={loading}>
                    {t("auth.signUp")}
                  </Button>
                </>
              )}

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={[styles.divider, { backgroundColor: colors.outline }]} />
                <ThemedText variant="bodySmall" style={[styles.dividerText, { color: colors.text }]}>
                  {t("auth.or")}
                </ThemedText>
                <View style={[styles.divider, { backgroundColor: colors.outline }]} />
              </View>

              {/* Social Login Buttons */}
              <Button
                mode={isGlass ? "outlined" : "outlined"}
                onPress={handleGoogleLogin}
                style={styles.socialButton}
                contentStyle={styles.socialButtonContent}
                icon="google"
                textColor={isGlass ? colors.text : colors.primary}
                disabled={loading}
              >
                {t("auth.continueWithGoogle")}
              </Button>

              <Button
                mode="contained"
                onPress={handleAppleLogin}
                style={[styles.socialButton, styles.appleButton]}
                contentStyle={styles.socialButtonContent}
                icon={() => <Ionicons name="logo-apple" size={20} color="#FFFFFF" />}
                buttonColor="#121212"
                textColor="#FFFFFF"
                disabled={loading}
              >
                {t("auth.continueWithApple")}
              </Button>

              {/* Toggle Sign Up / Login */}
              <Button mode="text" onPress={toggleMode} style={styles.toggleButton} textColor={colors.primary} disabled={loading}>
                {isSignUp ? t("auth.alreadyHaveAccount") : t("auth.createAccount")}
              </Button>

              {/* Security Indicator */}
              <View style={styles.securityIndicator}>
                <Ionicons name="shield-checkmark" size={12} color={colors.primary} style={{ opacity: 0.6 }} />
                <ThemedText style={styles.securityText}>{t("auth.secureConnection", "Conexão Criptografada & Segura")}</ThemedText>
              </View>
            </ThemedContainer>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => {
          setSnackbarVisible(false);
          clearError();
        }}
        duration={4000}
        action={{
          label: t("common.ok"),
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {error}
      </Snackbar>

      <SyncLoadingScreen visible={isSyncing} />
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardView: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    padding: 28,
    borderRadius: 28,
    width: "100%",
    alignSelf: "center",
    maxWidth: 500,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 28,
    opacity: 0.8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  glassInput: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  button: {
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 100,
  },
  buttonContent: {
    height: 50,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    opacity: 0.7,
  },
  socialButton: {
    marginBottom: 12,
    borderRadius: 100,
  },
  socialButtonContent: {
    height: 48,
  },
  appleButton: {
    backgroundColor: "#121212",
  },
  toggleButton: {
    marginTop: 8,
  },
  securityIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 4,
    opacity: 0.6,
  },
  securityText: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
