import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Appbar, SegmentedButtons, Text, useTheme } from "react-native-paper";
import { PaywallGate } from "../../../src/components/paywall/PaywallGate";
import { PaywallModal } from "../../../src/components/paywall/PaywallModal";
import { AIInsightsCard } from "../../../src/components/reports/AIInsightsCard";
import { CategoryPieChart } from "../../../src/components/reports/CategoryPieChart";
import { EvolutionChart } from "../../../src/components/reports/EvolutionChart";
import { MonthlyBarChart } from "../../../src/components/reports/MonthlyBarChart";
import { usePremium } from "../../../src/hooks/usePremium";
import { AIAdvisorService, AIInsight } from "../../../src/services/aiAdvisor";
import { FinancialService } from "../../../src/services/financial";

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

  // Gate the entire screen for now based on roadmap (or use inline gates)
  if (!isPro) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header elevated>
          <Appbar.Content title="Relatórios & IA" />
        </Appbar.Header>
        <PaywallGate
          feature="Relatórios Avançados & IA"
          description="Desbloqueie insights personalizados, gráficos detalhados e um consultor financeiro pessoal com o FinAInteli Pro."
          onUnlock={() => setShowPaywall(true)}
        />
        <PaywallModal
          visible={showPaywall}
          onDismiss={() => setShowPaywall(false)}
          onSuccess={() => {
            setShowPaywall(false);
            fetchData(); // Retry
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
});
