import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback } from "react";
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

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const { accounts, monthlySummary, isLoading, fetchDashboardData, spendingByCategory } = useFinancialStore();

  const { session } = useAuthStore();

  // Carregar dados ao entrar na tela
  useFocusEffect(
    useCallback(() => {
      if (session) {
        fetchDashboardData();
      }
    }, [session])
  );

  const hasData = accounts.length > 0;

  const { tutorial } = useLocalSearchParams<{ tutorial: string }>();
  const { startTutorial } = useTutorial();

  // Iniciar Tutorial se solicitado, após carregar dados
  React.useEffect(() => {
    if (tutorial === "true" && hasData) {
      const timer = setTimeout(() => {
        startTutorial([
          { targetId: "header", title: "Seu Perfil", description: "Configure sua conta e veja saudações aqui." },
          { targetId: "balance", title: "Visão Geral", description: "Acompanhe seu fluxo de caixa mensal aqui." },
          { targetId: "actions", title: "Acesso Rápido", description: "Adicione transações e gerencie suas contas facilmente." },
          { targetId: "tips", title: "Dicas Inteligentes", description: "Receba recomendações da IA para economizar." },
        ]);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [tutorial, hasData]);

  // Mock tip por enquanto - integração Gemini virá depois com dados reais
  const mockTip = "Com base nos seus gastos recentes, você pode economizar R$ 150,00 reduzindo despesas com Alimentação.";

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
                  <SmartTipCard tip={mockTip} loading={false} onPressReport={() => router.push("/modal")} />
                </CoachMarkTarget>

                {/* Maiores Gastos (Simples por enquanto) */}
                {spendingByCategory.length > 0 && (
                  <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      {t("dashboard.topSpending") || "Maiores Gastos"}
                    </Text>
                    {spendingByCategory.map((cat, index) => (
                      <View key={cat.x} style={styles.spendingItem}>
                        <View style={[styles.dot, { backgroundColor: cat.color }]} />
                        <Text style={styles.catName}>{cat.x}</Text>
                        <View style={styles.barContainer}>
                          <View style={[styles.bar, { width: `${Math.min((cat.y / monthlySummary.expense) * 100, 100)}%`, backgroundColor: cat.color }]} />
                        </View>
                        <Text style={styles.amount}>R$ {cat.y}</Text>
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
    width: 60,
    textAlign: "right",
  },
});
