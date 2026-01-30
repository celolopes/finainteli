import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Transaction } from "../types";

interface Props {
  transaction: Transaction;
  onPress?: () => void;
}

export const TransactionItem = ({ transaction, onPress }: Props) => {
  const theme = useTheme();
  const isIncome = transaction.type === "income";

  // Formatar valor com vírgula para pt-BR
  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Determine Icon
  // If transaction.categoryIcon exists and is valid, use it?
  // We need to be careful if categoryIcon string is not a valid MaterialCommunityIcons name.
  // For safety, we can wrap in try/catch or just use it if it's standard strings.
  // Assuming the DB stores valid icon names (e.g. "food", "cart").
  // If no icon, use arrow defaults.

  // Note: MaterialCommunityIcons.glyphMap checking is hard at runtime without map.
  // We'll trust the data or fallback if render fails (it typically just shows ? or blank).
  const iconName = (transaction.categoryIcon as any) || (isIncome ? "arrow-up-circle" : "arrow-down-circle");

  // Use category color if available, else theme colors
  const primaryColor = isIncome ? "#4ADE80" : "#F87171"; // Tailwind Green-400 / Red-400
  const iconColor = transaction.categoryColor || primaryColor;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.container}>
      {/* Icon Circle */}
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.elevation.level2 }]}>
        <MaterialCommunityIcons name={iconName} size={24} color={iconColor} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text variant="bodyLarge" style={[styles.title, { color: theme.colors.onSurface }]}>
            {transaction.title}
          </Text>
          {!!transaction.credit_card_id && <MaterialCommunityIcons name="credit-card-outline" size={14} color={theme.colors.onSurfaceVariant} />}
        </View>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {transaction.category}
        </Text>
      </View>

      {/* Amount and Date/Icon */}
      <View style={styles.right}>
        <Text
          variant="bodyLarge"
          style={{
            color: transaction.type === "expense" ? "#F87171" : "#4ADE80",
            fontWeight: "700",
          }}
        >
          {isIncome ? "+" : "-"}R$ {formatCurrency(transaction.amount)}
        </Text>
        {/* Optional: Add small date if needed, but we have grouping */}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontWeight: "600",
    marginBottom: 2,
  },
  right: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
});
