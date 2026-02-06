import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthStore } from "../../../src/store/authStore";
import { useFinancialStore } from "../../../src/store/financialStore";

// Components
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BalanceCard } from "../../../src/components/dashboard/BalanceCard";
import { EmptyDashboard } from "../../../src/components/dashboard/EmptyDashboard";
import { PendingAlertsCarousel } from "../../../src/components/dashboard/PendingAlertsCarousel";
import { QuickActions } from "../../../src/components/dashboard/QuickActions";
import { UserHeader } from "../../../src/components/dashboard/UserHeader";
import { SmartTipCard } from "../../../src/components/SmartTipCard";
import { CoachMarkTarget } from "../../../src/components/tutorial/CoachMarkTarget";
import { useTutorial } from "../../../src/context/TutorialContext";
import { useAILimit } from "../../../src/hooks/useAILimit";
import { useBudgetMonitor } from "../../../src/hooks/useBudgetMonitor";
import { usePremium } from "../../../src/hooks/usePremium";
import { FinancialService } from "../../../src/services/financial";
import { GeminiService } from "../../../src/services/gemini";

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  // Calculate bottom padding for iOS native tab bar
  const tabBarPadding = Platform.OS === "ios" ? 90 : 60;

  const { accounts, monthlySummary, isLoading, fetchDashboardData, spendingByCategory } = useFinancialStore();

  const { session } = useAuthStore();

  // Budget monitor para verificar limites e enviar notificações
  const { checkBudgets } = useBudgetMonitor();

  // AI Tip State
  const [aiTip, setAiTip] = useState<string>("");
  const [tipLoading, setTipLoading] = useState(false);
  const { canUseTip, incrementTipUsage, isLoading: limitLoading } = useAILimit();
  const { isPro } = usePremium();

  // Pending alerts state (bills to pay & income to receive)
  const [pendingBills, setPendingBills] = useState<{ count: number; total: number }>({ count: 0, total: 0 });
  const [pendingIncome, setPendingIncome] = useState<{ count: number; total: number }>({ count: 0, total: 0 });

  // Load daily tip from cache or generate new one
  const loadDailyTip = useCallback(async () => {
    if (!accounts.length) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const CACHE_KEY = "@finainteli_daily_tip";
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);

      if (cachedData) {
        const { date, tip } = JSON.parse(cachedData);
        if (date === today && tip) {
          setAiTip(tip);
          return;
        }
      }

      // If no valid cache, check limit before generating
      if (!isPro && !canUseTip) {
        return;
      }

      // Try to increment usage for the new auto-generated tip
      // If we are here, it means it's the first time today or cache is cleared
      if (!isPro) {
        const success = await incrementTipUsage();
        if (!success) return;
      }

      await generateNewTip();
    } catch (error) {
      console.error("Error loading daily tip:", error);
    }
  }, [accounts, canUseTip, isPro, i18n.language]);

  // Generate a new tip from API
  const generateNewTip = async () => {
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

      // Cache the new tip
      const today = new Date().toISOString().split("T")[0];
      await AsyncStorage.setItem("@finainteli_daily_tip", JSON.stringify({ date: today, tip }));
    } catch (error) {
      console.error("Error generating AI tip:", error);
      setAiTip(t("dashboard.mockTip"));
    } finally {
      setTipLoading(false);
    }
  };

  // Carregar dados ao entrar na tela
  useFocusEffect(
    useCallback(() => {
      // Always refresh data on focus to ensure sync changes are reflected
      if (session) {
        console.log("[Home] Focusing and refreshing dashboard data...");
        fetchDashboardData();
        checkBudgets();
        // Fetch pending alerts for today/tomorrow
        FinancialService.getPendingBills().then(setPendingBills).catch(console.error);
        FinancialService.getPendingIncome().then(setPendingIncome).catch(console.error);
      }
    }, [session]),
  );

  // Fetch AI tip when data is loaded and limits are ready
  // Only runs once per session/mount effectively via checks
  React.useEffect(() => {
    if (accounts.length > 0 && !aiTip && !tipLoading && !limitLoading) {
      loadDailyTip();
    }
  }, [accounts.length, limitLoading]);

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
      {/* Header com Avatar e Saudação (Liquid Glass iOS / M3 Android) - Fixo no topo */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
        <CoachMarkTarget id="header">
          <UserHeader />
        </CoachMarkTarget>
      </View>

      <ScrollView
        aria-label="Dashboard Principal"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarPadding + insets.bottom, paddingTop: Platform.OS === "ios" ? insets.top + 100 : 20 }]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchDashboardData} tintColor={theme.colors.primary} progressViewOffset={Platform.OS === "ios" ? insets.top + 100 : 40} />}
      >
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
                {/* Pending Alerts Carousel - Bills to Pay & Income to Receive */}
                <PendingAlertsCarousel pendingBills={pendingBills} pendingIncome={pendingIncome} />

                {/* Saldo e Resumo */}
                <CoachMarkTarget id="balance" style={{ marginBottom: 6 }}>
                  <BalanceCard aria-label="Resumo do Saldo" />
                </CoachMarkTarget>

                {/* Ações Rápidas */}
                <CoachMarkTarget id="actions">
                  <QuickActions />
                </CoachMarkTarget>

                {/* Dica IA */}
                <CoachMarkTarget id="tips">
                  <SmartTipCard
                    tip={aiTip || t("reports.advisor.analyzing")}
                    loading={tipLoading}
                    onPressReport={() => router.push("/reports/ai-advisor" as any)}
                    onRefreshTip={generateNewTip}
                    aria-label="Dica da IA"
                  />
                </CoachMarkTarget>

                {/* Maiores Gastos (Simples por enquanto) */}
                {spendingByCategory.length > 0 && (
                  <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      {t("dashboard.topSpending")}
                    </Text>
                    {spendingByCategory.map((cat, index) => (
                      <View key={cat.x} style={styles.spendingItem} aria-label={`Categoria ${cat.x}: ${formatMoney(cat.y)}`}>
                        <View style={[styles.dot, { backgroundColor: cat.color }]} />
                        <Text style={styles.catName} aria-label="Nome da Categoria">
                          {cat.x}
                        </Text>
                        <View style={styles.barContainer} aria-label="Porcentagem de gasto">
                          <View style={[styles.bar, { width: `${Math.min((cat.y / monthlySummary.expense) * 100, 100)}%`, backgroundColor: cat.color }]} />
                        </View>
                        <Text style={styles.amount} aria-label="Valor total gasto">
                          {formatMoney(cat.y)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {/* Espaço extra final */}
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
    backgroundColor: "rgba(18, 18, 18, 0.1)",
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
