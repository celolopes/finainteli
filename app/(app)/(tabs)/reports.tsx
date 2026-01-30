import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Button, Icon, SegmentedButtons, Text, useTheme } from "react-native-paper";
import { PaywallModal } from "../../../src/components/paywall/PaywallModal";
import { AIInsightsCard } from "../../../src/components/reports/AIInsightsCard";
import { CategoryPieChart } from "../../../src/components/reports/CategoryPieChart";
import { EvolutionChart } from "../../../src/components/reports/EvolutionChart";
import { MonthlyBarChart } from "../../../src/components/reports/MonthlyBarChart";
import { usePremium } from "../../../src/hooks/usePremium";
import { AIAdvisorService, AIInsight } from "../../../src/services/aiAdvisor";
import { FinancialService } from "../../../src/services/financial";

const LockedFeature = ({ icon, text, theme }: { icon: string; text: string; theme: any }) => (
  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 12 }}>
    <View style={{ backgroundColor: theme.colors.primaryContainer, padding: 8, borderRadius: 12 }}>
      <Icon source={icon} size={24} color={theme.colors.primary} />
    </View>
    <Text variant="bodyLarge" style={{ flex: 1, fontWeight: "500" }}>
      {text}
    </Text>
  </View>
);

export default function ReportsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { isPro, loading: loadingPremium } = usePremium();
  const [showPaywall, setShowPaywall] = useState(false);

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");

  const [analysis, setAnalysis] = useState<any>(null);
  const [evolution, setEvolution] = useState<any[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);

  const fetchData = useCallback(async () => {
    // Wait for premium check
    // if (loadingPremium) return;

    setLoading(true);
    try {
      // 1. Get User
      const {
        data: { user },
      } = await import("../../../src/services/supabase").then((m) => m.supabase.auth.getUser());
      if (!user) return;

      // 2. Financial Analysis (Always fetch basic data)
      const analysisData = await FinancialService.getFinancialAnalysis(period, "BRL");
      setAnalysis(analysisData);

      // Only fetch advanced data if Pro
      if (isPro) {
        // 3. Evolution Data
        const evolutionData = await FinancialService.getMonthlyEvolution(user.id);
        setEvolution(evolutionData);

        // 4. AI Insights
        const aiInsights = await AIAdvisorService.getInsights(period, user.id);
        setInsights(aiInsights);
      }
    } catch (error) {
      console.error("Reports Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [period, isPro]);

  useFocusEffect(
    useCallback(() => {
      if (!loadingPremium) {
        fetchData();
      }
    }, [fetchData, loadingPremium]),
  );

  if (loadingPremium) {
    return <View style={{ flex: 1, backgroundColor: theme.colors.background }} />;
  }

  // Premium Locked Screen
  if (!isPro) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LinearGradient colors={[theme.colors.surfaceVariant, theme.colors.background]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFillObject} />

        <View style={styles.lockedContent}>
          <View style={styles.iconContainer}>
            <Icon source="auto-fix" size={64} color={theme.colors.primary} />
          </View>

          <Text variant="headlineMedium" style={styles.lockedTitle}>
            {t("reports.locked.title", "Análises & IA")}
          </Text>

          <Text variant="bodyLarge" style={styles.lockedDesc}>
            {t("reports.locked.desc", "Transforme seus dados em riqueza. Desbloqueie insights poderosos e tome decisões melhores.")}
          </Text>

          <View style={styles.featuresList}>
            <LockedFeature icon="robot" text="Consultor Financeiro Pessoal 24/7" theme={theme} />
            <LockedFeature icon="chart-timeline-variant" text="Evolução Patrimonial Detalhada" theme={theme} />
            <LockedFeature icon="chart-pie" text="Análise Profunda de Categorias" theme={theme} />
          </View>

          <Button
            mode="contained"
            onPress={() => setShowPaywall(true)}
            icon="lock-open-variant"
            style={styles.unlockButton}
            contentStyle={{ height: 56 }}
            labelStyle={{ fontSize: 18, fontWeight: "bold" }}
          >
            {t("common.unlockPremium", "Desbloquear Premium")}
          </Button>
        </View>

        <PaywallModal
          visible={showPaywall}
          onDismiss={() => setShowPaywall(false)}
          onSuccess={() => {
            setShowPaywall(false);
            fetchData();
          }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.Content title="Relatórios & IA" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}>
        <SegmentedButtons
          value={period}
          onValueChange={(val) => setPeriod(val as any)}
          buttons={[
            { value: "week", label: "Semana" },
            { value: "month", label: "Mês" },
            { value: "year", label: "Ano" },
          ]}
          style={styles.segmented}
        />

        <View style={styles.section}>
          <Text variant="headlineSmall" style={styles.sectionTitle}>
            Consultor Financeiro
          </Text>
          <AIInsightsCard insights={insights} loading={loading} onRefresh={fetchData} />
        </View>

        <View style={styles.section}>
          <EvolutionChart data={evolution.map((e: any) => ({ period: e.month, balance: e.balance }))} />
        </View>

        <View style={styles.section}>
          <CategoryPieChart
            data={
              analysis?.categoryBreakdown.map((c: any) => ({
                category: c.category,
                amount: c.amount,
                percentage: c.percentage,
                color: getColorForCategory(c.category),
              })) || []
            }
          />
        </View>

        <View style={styles.section}>
          <MonthlyBarChart
            data={evolution.map((e: any) => ({
              month: e.month,
              income: e.income,
              expense: e.expense,
            }))}
          />
        </View>
      </ScrollView>
    </View>
  );
}

// Helper for colors
const getColorForCategory = (category: string) => {
  // Simple hash to consistent color
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  segmented: { marginBottom: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { marginBottom: 12, fontWeight: "bold" },

  // Locked Screen Styles
  lockedContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  iconContainer: {
    marginBottom: 24,
    backgroundColor: "rgba(108, 99, 255, 0.1)", // Primary with opacity
    padding: 24,
    borderRadius: 32,
  },
  lockedTitle: {
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  lockedDesc: {
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 32,
  },
  featuresList: {
    width: "100%",
    marginBottom: 32,
  },
  unlockButton: {
    width: "100%",
    borderRadius: 32,
  },
});
