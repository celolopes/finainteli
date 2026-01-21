import React from "react";
import { StyleSheet, View } from "react-native";
import { Icon, Surface, Text, useTheme } from "react-native-paper";
import Animated, { FadeInUp, ZoomIn } from "react-native-reanimated";
import { useFinancialStore } from "../../store/financialStore";

export const BalanceCard = () => {
  const theme = useTheme();
  const { monthlySummary, isLoading } = useFinancialStore();

  // Format currency
  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.container}>
      <Surface style={[styles.card, { backgroundColor: theme.colors.primaryContainer }]} elevation={2}>
        <View style={styles.header}>
          <Text variant="labelLarge" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.7 }}>
            Fluxo do Mês
          </Text>
          <Icon source="chart-timeline-variant" size={20} color={theme.colors.onPrimaryContainer} />
        </View>

        {isLoading ? (
          <Text variant="displaySmall" style={[styles.balance, { color: theme.colors.onPrimaryContainer }]}>
            ---
          </Text>
        ) : (
          <Animated.Text entering={ZoomIn.delay(300)} style={[styles.amountText, { color: theme.colors.onPrimaryContainer }]}>
            <Text variant="displaySmall" style={{ fontWeight: "bold" }}>
              {formatMoney(monthlySummary.savings)}
            </Text>
          </Animated.Text>
        )}

        <View style={styles.row}>
          <View style={styles.item}>
            <Icon source="arrow-down-circle" size={16} color={theme.colors.primary} />
            <Text variant="bodySmall" style={{ marginLeft: 4, color: theme.colors.onPrimaryContainer }}>
              Receitas: {formatMoney(monthlySummary.income)}
            </Text>
          </View>
          <View style={styles.item}>
            <Icon source="arrow-up-circle" size={16} color={theme.colors.error} />
            <Text variant="bodySmall" style={{ marginLeft: 4, color: theme.colors.onPrimaryContainer }}>
              Despesas: {formatMoney(monthlySummary.expense)}
            </Text>
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
  },
  card: {
    borderRadius: 24,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  balance: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  amountText: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 12,
    borderRadius: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
  },
});
