import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Button, Text, useTheme } from "react-native-paper";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { FinancialService } from "../../../src/services/financial";
import { Database } from "../../../src/types/schema";

type Currency = Database["public"]["Tables"]["currencies"]["Row"];

export default function OnboardingWelcome() {
  const theme = useTheme();
  const router = useRouter();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("BRL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    try {
      const data = await FinancialService.getCurrencies();
      setCurrencies(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    // Passa a moeda para a próxima tela via params ou store.
    // Por simplicidade, vamos salvar preferência logo.
    try {
      if (selectedCurrency) {
        await FinancialService.updateUserProfile({ default_currency: selectedCurrency });
      }
      router.push("/(app)/onboarding/setup-account" as any);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View entering={FadeInUp.delay(200)} style={styles.header}>
        <Text variant="displaySmall" style={[styles.title, { color: theme.colors.primary }]}>
          Bem-vindo ao FinAInteli
        </Text>
        <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Vamos configurar sua experiência financeira. Primeiro, escolha sua moeda principal.
        </Text>
      </Animated.View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <View style={styles.currencyGrid}>
            {currencies.map((currency, index) => (
              <Animated.View key={currency.code} entering={FadeIn.delay(300 + index * 100)}>
                <TouchableOpacity
                  style={[
                    styles.currencyItem,
                    {
                      borderColor: selectedCurrency === currency.code ? theme.colors.primary : theme.colors.outline,
                      backgroundColor: selectedCurrency === currency.code ? theme.colors.primaryContainer : theme.colors.surface,
                    },
                  ]}
                  onPress={() => setSelectedCurrency(currency.code)}
                >
                  <Text variant="titleLarge" style={{ fontWeight: "bold" }}>
                    {currency.symbol}
                  </Text>
                  <Text variant="labelMedium">{currency.code}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}
      </View>

      <Animated.View entering={FadeInUp.delay(600)} style={styles.footer}>
        <Button mode="contained" onPress={handleNext} style={styles.button} contentStyle={{ height: 56 }}>
          Continuar
        </Button>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  header: {
    marginTop: 60,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  subtitle: {
    opacity: 0.8,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  currencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "center",
  },
  currencyItem: {
    width: 100,
    height: 100,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  footer: {
    marginBottom: 40,
  },
  button: {
    borderRadius: 16,
  },
});
