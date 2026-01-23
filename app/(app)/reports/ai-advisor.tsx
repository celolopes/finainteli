import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, SegmentedButtons, Text, useTheme } from "react-native-paper";
import Animated, { FadeIn } from "react-native-reanimated";
import { AIRecommendationsList } from "../../../src/components/reports/AIRecommendationsList";
import { AIAdvisorService, AIInsight } from "../../../src/services/aiAdvisor";
import { FinancialService } from "../../../src/services/financial";
import { useAuthStore } from "../../../src/store/authStore";

export default function AIAdvisorScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { session } = useAuthStore();

  const [period, setPeriod] = useState<"month" | "year">("month");
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<AIInsight[]>([]);

  useEffect(() => {
    fetchInsights();
  }, [period]);

  const fetchInsights = async () => {
    setLoading(true);

    try {
      // Buscar dados reais (agregados) do banco
      const analysis = await FinancialService.getFinancialAnalysis(period);

      // Chamar o serviço de IA com os dados reais
      const aiResponse = await AIAdvisorService.analyzeFinances(session?.user.id || "anonymous", analysis, i18n.language);
      setInsights(aiResponse);
    } catch (error) {
      console.error("Erro ao buscar insights:", error);
      // Opcional: Mostrar erro na UI (Snackbar)
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header elevated>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title={t("reports.advisor.title")} subtitle={t("reports.advisor.subtitle")} />
          <Appbar.Action icon="refresh" onPress={fetchInsights} disabled={loading} />
        </Appbar.Header>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.periodSelector}>
            <SegmentedButtons
              value={period}
              onValueChange={(val) => setPeriod(val as "month" | "year")}
              buttons={[
                { value: "month", label: t("reports.periods.month") },
                { value: "year", label: t("reports.periods.year") },
              ]}
            />
          </View>

          <Animated.View entering={FadeIn.delay(200)}>
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              {loading ? t("common.loading") : t("reports.advisor.insightsFound", { count: insights.length })}
            </Text>

            <Text variant="bodyMedium" style={{ marginBottom: 16, color: theme.colors.onSurfaceVariant }}>
              {t("reports.advisor.intro")}
            </Text>

            <AIRecommendationsList
              insights={insights}
              loading={loading}
              onAction={(insight) => {
                // Futuro: navegar para detalhes da categoria ou orçamento
                console.log("Action on insight:", insight.id);
              }}
            />
          </Animated.View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  periodSelector: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 8,
  },
});
