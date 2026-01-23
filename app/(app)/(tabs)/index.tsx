import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Text, useTheme } from "react-native-paper";

import { useAuthStore } from "../../../src/store/authStore";
import { useFinancialStore } from "../../../src/store/financialStore";

// Components
import { BalanceCard } from "../../../src/components/dashboard/BalanceCard";
import { EmptyDashboard } from "../../../src/components/dashboard/EmptyDashboard";
import { QuickActions } from "../../../src/components/dashboard/QuickActions";
import { UserHeader } from "../../../src/components/dashboard/UserHeader";
import { SmartTipCard } from "../../../src/components/SmartTipCard";
import { CoachMarkTarget } from "../../../src/components/tutorial/CoachMarkTarget";
import { useTutorial } from "../../../src/context/TutorialContext";
import { useBudgetMonitor } from "../../../src/hooks/useBudgetMonitor";
import { GeminiService } from "../../../src/services/gemini";

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const { accounts, monthlySummary, isLoading, fetchDashboardData, spendingByCategory } = useFinancialStore();

  const { session } = useAuthStore();

  // Budget monitor para verificar limites e enviar notificações
  const { checkBudgets } = useBudgetMonitor();

  // AI Tip State
  const [aiTip, setAiTip] = useState<string>("");
  const [tipLoading, setTipLoading] = useState(false);

  // Fetch AI Tip
  const fetchAiTip = useCallback(async () => {
    if (!accounts.length) return;

    setTipLoading(true);
    try {
      const context = {
        monthlyIncome: monthlySummary.income,
        monthlyExpenses: monthlySummary.expense,
        savings: monthlySummary.income - monthlySummary.expense,
        topCategories: spendingByCategory.slice(0, 5).map((cat) => ({
          category: cat.x,
          amount: cat.y,
        })),
      };

      const tip = await GeminiService.generateSmartTip(context, i18n.language);
      setAiTip(tip);
    } catch (error) {
      console.error("Error fetching AI tip:", error);
      setAiTip(t("dashboard.mockTip"));
    } finally {
      setTipLoading(false);
    }
  }, [accounts, monthlySummary, spendingByCategory, i18n.language, t]);

  // Carregar dados ao entrar na tela
  useFocusEffect(
    useCallback(() => {
      if (session) {
        fetchDashboardData();
        // Verificar orçamentos e disparar alertas se necessário
        checkBudgets();
      }
    }, [session]),
  );

  // Fetch AI tip when data is loaded
  React.useEffect(() => {
    if (accounts.length > 0 && !aiTip && !tipLoading) {
      fetchAiTip();
    }
  }, [accounts.length]);

  const hasData = accounts.length > 0;

  const { tutorial } = useLocalSearchParams<{ tutorial: string }>();
  const { startTutorial } = useTutorial();

  // Iniciar Tutorial se solicitado, após carregar dados
  React.useEffect(() => {
    if (tutorial === "true" && hasData) {
      const timer = setTimeout(() => {
        startTutorial([
          {
            targetId: "header",
            title: t("tutorial.steps.header.title"),
            description: t("tutorial.steps.header.desc"),
          },
          {
            targetId: "balance",
            title: t("tutorial.steps.balance.title"),
            description: t("tutorial.steps.balance.desc"),
          },
          {
            targetId: "actions",
            title: t("tutorial.steps.actions.title"),
            description: t("tutorial.steps.actions.desc"),
          },
          {
            targetId: "tips",
            title: t("tutorial.steps.tips.title"),
            description: t("tutorial.steps.tips.desc"),
          },
        ]);
      }, 2500); // Wait for entrance animations to finish (prevent wrong measurements)
      return () => clearTimeout(timer);
    }
  }, [tutorial, hasData]);

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat(i18n.language || "pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchDashboardData} tintColor={theme.colors.primary} />}>
        {/* Header com Avatar e Saudação (Liquid Glass iOS / M3 Android) */}
        <CoachMarkTarget id="header">
          <UserHeader />
        </CoachMarkTarget>

        {isLoading && !hasData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <>
            {!hasData ? (
              /* Onboarding para novos usuários */
              <EmptyDashboard />
            ) : (
              /* Dashboard Completo */
              <View style={styles.dashboardContent}>
                {/* Saldo e Resumo */}
                <CoachMarkTarget id="balance" style={{ marginBottom: 24 }}>
                  <BalanceCard />
                </CoachMarkTarget>

                {/* Ações Rápidas */}
                <CoachMarkTarget id="actions">
                  <QuickActions />
                </CoachMarkTarget>

                {/* Dica IA */}
                <CoachMarkTarget id="tips">
                  <SmartTipCard tip={aiTip || t("reports.advisor.analyzing")} loading={tipLoading} onPressReport={() => router.push("/reports/ai-advisor" as any)} onRefreshTip={fetchAiTip} />
                </CoachMarkTarget>

                {/* Maiores Gastos (Simples por enquanto) */}
                {spendingByCategory.length > 0 && (
                  <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      {t("dashboard.topSpending")}
                    </Text>
                    {spendingByCategory.map((cat, index) => (
                      <View key={cat.x} style={styles.spendingItem}>
                        <View style={[styles.dot, { backgroundColor: cat.color }]} />
                        <Text style={styles.catName}>{cat.x}</Text>
                        <View style={styles.barContainer}>
                          <View style={[styles.bar, { width: `${Math.min((cat.y / monthlySummary.expense) * 100, 100)}%`, backgroundColor: cat.color }]} />
                        </View>
                        <Text style={styles.amount}>{formatMoney(cat.y)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* Espaço extra final */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  dashboardContent: {
    // Conteúdo principal
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  spendingItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  catName: {
    width: 80,
    fontSize: 12,
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 4,
    marginRight: 12,
  },
  bar: {
    height: "100%",
    borderRadius: 4,
  },
  amount: {
    fontSize: 12,
    fontWeight: "bold",
    width: 80, // Increased width for formatted currency
    textAlign: "right",
  },
});
