import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Icon, Surface, Text, useTheme } from "react-native-paper";
import Animated, { FadeInUp, ZoomIn } from "react-native-reanimated";
import { useFinancialStore } from "../../store/financialStore";

export const BalanceCard = () => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { monthlySummary, isLoading, accounts } = useFinancialStore();

  // Patrimônio total = soma dos saldos das contas
  const totalPatrimony = accounts?.reduce((acc, curr) => acc + (Number(curr.current_balance) || 0), 0) || 0;

  // Balanço mensal = receitas - despesas do mês
  const monthlyBalance = monthlySummary.income - monthlySummary.expense;

  // Format currency
  const formatMoney = (value: number) => {
    return new Intl.NumberFormat(i18n.language || "pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Determinar cor do balanço mensal
  const getBalanceColor = () => {
    if (monthlyBalance > 0) return theme.colors.primary;
    if (monthlyBalance < 0) return theme.colors.error;
    return theme.colors.onSurfaceVariant;
  };

  return (
    <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.container}>
      {/* Card 1: Patrimônio Total */}
      <Surface style={[styles.card, { backgroundColor: theme.colors.primaryContainer }]} elevation={2}>
        <View style={styles.header}>
          <Text variant="labelLarge" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.8 }}>
            {t("dashboard.patrimony", "Patrimônio Total")}
          </Text>
          <Icon source="bank" size={20} color={theme.colors.onPrimaryContainer} />
        </View>

        {isLoading ? (
          <Text variant="displaySmall" style={[styles.balance, { color: theme.colors.onPrimaryContainer }]}>
            ---
          </Text>
        ) : (
          <Animated.Text entering={ZoomIn.delay(300)} style={[styles.amountText, { color: theme.colors.onPrimaryContainer }]}>
            <Text variant="displaySmall" style={{ fontWeight: "bold" }}>
              {formatMoney(totalPatrimony)}
            </Text>
          </Animated.Text>
        )}

        <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.7 }}>
          {t("dashboard.accountsSum", "Soma de todas as contas")}
        </Text>
      </Surface>

      {/* Card 2: Balanço Mensal */}
      <Surface style={[styles.card, styles.monthlyCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <View style={styles.header}>
          <Text variant="labelLarge" style={{ color: theme.colors.onSurface, opacity: 0.8 }}>
            {t("dashboard.monthlyBalance", "Balanço do Mês")}
          </Text>
          <Icon source="calendar-month" size={20} color={theme.colors.onSurface} />
        </View>

        {isLoading ? (
          <Text variant="headlineMedium" style={[styles.balanceSmall, { color: theme.colors.onSurface }]}>
            ---
          </Text>
        ) : (
          <Text variant="headlineMedium" style={[styles.balanceSmall, { color: getBalanceColor(), fontWeight: "bold" }]}>
            {monthlyBalance >= 0 ? "+" : ""}
            {formatMoney(monthlyBalance)}
          </Text>
        )}

        <View style={styles.row}>
          <View style={[styles.statItem, { backgroundColor: theme.colors.primaryContainer }]}>
            <Icon source="arrow-down-circle" size={18} color={theme.colors.primary} />
            <View style={styles.statText}>
              <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.7 }}>
                {t("dashboard.income")}
              </Text>
              <Text variant="titleSmall" style={{ color: theme.colors.primary, fontWeight: "bold" }}>
                {formatMoney(monthlySummary.income)}
              </Text>
            </View>
          </View>

          <View style={[styles.statItem, { backgroundColor: theme.colors.errorContainer }]}>
            <Icon source="arrow-up-circle" size={18} color={theme.colors.error} />
            <View style={styles.statText}>
              <Text variant="labelSmall" style={{ color: theme.colors.onErrorContainer, opacity: 0.7 }}>
                {t("dashboard.expense")}
              </Text>
              <Text variant="titleSmall" style={{ color: theme.colors.error, fontWeight: "bold" }}>
                {formatMoney(monthlySummary.expense)}
              </Text>
            </View>
          </View>
        </View>
      </Surface>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  card: {
    borderRadius: 20,
    padding: 20,
  },
  monthlyCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  balance: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  balanceSmall: {
    marginBottom: 12,
  },
  amountText: {
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  statText: {
    flex: 1,
  },
});
