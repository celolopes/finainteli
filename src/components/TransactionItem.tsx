import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Transaction } from "../types";

interface Props {
  transaction: Transaction;
  onPress?: () => void;
  onToggleStatus?: () => void;
}

export const TransactionItem = ({ transaction, onPress, onToggleStatus }: Props) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isIncome = transaction.type === "income";

  // Formatar valor com vírgula para pt-BR
  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Determine Icon mapping for common incompatible names
  const getSafeIconName = (name?: string) => {
    if (!name) return isIncome ? "arrow-up-circle" : "arrow-down-circle";

    // Simple mapping for Lucide standard names to MaterialCommunityIcons
    const mapping: Record<string, string> = {
      "refresh-cw": "sync",
      "refresh-ccw": "sync-alert",
      "trending-up": "trending-up",
      "trending-down": "trending-down",
      "dollar-sign": "currency-usd",
      "shopping-cart": "cart",
      coffee: "coffee",
      home: "home",
      user: "account",
    };

    return mapping[name] || name;
  };

  const iconName = getSafeIconName(transaction.categoryIcon);

  // Use category color if available, else theme colors
  const primaryColor = isIncome ? "#4ADE80" : "#F87171"; // Tailwind Green-400 / Red-400
  const iconColor = transaction.categoryColor || primaryColor;

  const isPending = transaction.status === "pending";
  const txDate = new Date(transaction.date);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const isOverdue = isPending && txDate < startOfToday;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.container, isPending && !isOverdue && { opacity: 0.7 }]} aria-label={`Transação ${transaction.title}`}>
      {/* Icon Circle */}
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.elevation.level2 }]}>
        <MaterialCommunityIcons name={iconName as any} size={24} color={iconColor} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {isOverdue && <MaterialCommunityIcons name="alert-circle" size={16} color={theme.colors.error} />}
          <Text variant="bodyLarge" style={[styles.title, { color: isOverdue ? theme.colors.error : theme.colors.onSurface }]}>
            {transaction.title}
          </Text>
          {!!transaction.credit_card_id && <MaterialCommunityIcons name="credit-card-outline" size={14} color={theme.colors.onSurfaceVariant} />}
        </View>
        <Text variant="bodySmall" style={{ color: isOverdue ? theme.colors.error : theme.colors.onSurfaceVariant, opacity: isOverdue ? 0.8 : 1 }}>
          {transaction.category} {isPending && `• ${isOverdue ? t("transactions.status.overdue") : t("transactions.status.pending")}`}
        </Text>
      </View>

      {/* Amount and Toggle */}
      <View style={styles.right}>
        <Text
          variant="bodyLarge"
          style={{
            color: transaction.type === "expense" ? "#F87171" : "#4ADE80",
            fontWeight: "700",
            marginBottom: isPending ? 4 : 0,
          }}
        >
          {isIncome ? "+" : "-"}R$ {formatCurrency(transaction.amount)}
        </Text>

        {isPending && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onToggleStatus?.();
            }}
            style={[styles.checkCircle, { borderColor: isOverdue ? theme.colors.error : theme.colors.outline }]}
          >
            <MaterialCommunityIcons name="check" size={14} color={isOverdue ? theme.colors.error : theme.colors.outline} />
          </TouchableOpacity>
        )}
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
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
});
