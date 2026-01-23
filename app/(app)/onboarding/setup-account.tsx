import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { Button, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";
import Animated, { FadeInUp } from "react-native-reanimated";
import { FinancialService } from "../../../src/services/financial";
import { useFinancialStore } from "../../../src/store/financialStore";

export default function OnboardingAccount() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { fetchDashboardData } = useFinancialStore();

  const [name, setName] = useState(t("onboarding.form.typeCash").split("/")[0].trim()); // Default: "Carteira" or "Wallet"
  const [balance, setBalance] = useState("");
  const [type, setType] = useState("cash"); // cash | checking
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    try {
      // 1. Criar a conta
      const initialBalance = parseFloat(balance.replace(",", ".") || "0");

      await FinancialService.createAccount({
        name: name || t("onboarding.form.accountName"), // Fallback
        account_type: type as any,
        currency_code: "BRL", // Usar do profile idealmente, mas default BRL
        initial_balance: initialBalance,
        current_balance: initialBalance,
        is_active: true,
        user_id: undefined as any, // Supabase auth pega user
        color: null,
        icon: null,
        institution: null,
        is_included_in_total: true,
      });

      // 2. Atualizar flag Onboarding Completed (assumindo que campo existe)
      await FinancialService.updateUserProfile({
        onboarding_completed: true,
      });

      // 3. Atualizar store
      await fetchDashboardData();

      // 4. Ir para Dashboard
      // Passar param para ativar tutorial
      router.replace("/(app)/(tabs)/?tutorial=true" as any);
    } catch (error) {
      console.error("Error setup:", error);
      // Fallback: tenta ir anyway
      router.replace("/(app)/(tabs)/" as any);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInUp.delay(200)} style={styles.header}>
          <Text variant="displaySmall" style={[styles.title, { color: theme.colors.primary }]}>
            {t("onboarding.setup.title")}
          </Text>
          <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            {t("onboarding.setup.subtitle")}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)} style={styles.form}>
          <Text variant="titleMedium" style={styles.label}>
            {t("onboarding.form.type")}
          </Text>
          <SegmentedButtons
            value={type}
            onValueChange={setType}
            buttons={[
              { value: "cash", label: t("onboarding.form.typeCash"), icon: "wallet" },
              { value: "checking", label: t("onboarding.form.typeBank"), icon: "bank" },
            ]}
            style={styles.input}
          />

          <Text variant="titleMedium" style={styles.label}>
            {t("onboarding.form.accountName")}
          </Text>
          <TextInput mode="outlined" value={name} onChangeText={setName} placeholder={t("onboarding.form.placeholderName")} style={styles.input} />

          <Text variant="titleMedium" style={styles.label}>
            {t("onboarding.form.balance")}
          </Text>
          <TextInput mode="outlined" value={balance} onChangeText={setBalance} keyboardType="numeric" placeholder="R$ 0,00" left={<TextInput.Affix text="R$ " />} style={styles.input} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600)} style={styles.footer}>
          <Button mode="contained" onPress={handleFinish} loading={loading} style={styles.button} contentStyle={{ height: 56 }}>
            {t("onboarding.finish")}
          </Button>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  header: {
    marginTop: 40,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  subtitle: {
    opacity: 0.8,
  },
  form: {
    flex: 1,
    paddingVertical: 32,
  },
  label: {
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    marginBottom: 8,
  },
  footer: {
    marginBottom: 20,
  },
  button: {
    borderRadius: 16,
  },
});
