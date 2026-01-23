import React from "react";
import { StyleSheet, View } from "react-native";
import { List, Text, useTheme } from "react-native-paper";
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

  return (
    <List.Item
      title={transaction.title}
      titleStyle={{ color: theme.colors.onSurface }}
      description={transaction.date.split("T")[0]}
      descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
      left={(props) => <List.Icon {...props} icon={isIncome ? "arrow-up-circle" : "arrow-down-circle"} color={isIncome ? theme.colors.primary : theme.colors.error} />}
      right={() => (
        <View style={styles.right}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {transaction.sync_status !== "synced" && <List.Icon icon="cloud-upload-outline" color={theme.colors.outline} style={{ height: 20, width: 20, margin: 0, marginRight: 4 }} />}
            <Text
              variant="bodyLarge"
              style={{
                color: isIncome ? theme.colors.primary : theme.colors.error,
                fontWeight: "bold",
              }}
            >
              {isIncome ? "+" : "-"}R$ {formatCurrency(transaction.amount)}
            </Text>
          </View>
        </View>
      )}
      onPress={onPress}
      style={styles.item}
    />
  );
};

const styles = StyleSheet.create({
  item: {
    paddingVertical: 8,
  },
  right: {
    justifyContent: "center",
    alignItems: "flex-end",
    marginRight: 8,
  },
});
