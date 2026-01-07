import React from "react";
import { View, StyleSheet } from "react-native";
import { Surface, Text, useTheme } from "react-native-paper";

interface Props {
  income: number;
  expenses: number;
}

export const SummaryCards = ({ income, expenses }: Props) => {
  const theme = useTheme();
  const savings = income - expenses;

  return (
    <View style={styles.container}>
      <Card title="Income" amount={income} color={(theme.colors as any).success} />
      <Card title="Expense" amount={expenses} color={(theme.colors as any).error} />
      <Card title="Savings" amount={savings} color={theme.colors.primary} />
    </View>
  );
};

const Card = ({ title, amount, color }: { title: string; amount: number; color: string }) => {
  const theme = useTheme();

  return (
    <Surface style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {title}
      </Text>
      <Text variant="titleMedium" style={{ color: color, fontWeight: "bold" }}>
        ${amount.toFixed(0)}
      </Text>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: "center",
  },
});
