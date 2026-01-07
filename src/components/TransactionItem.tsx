import React from "react";
import { View, StyleSheet } from "react-native";
import { List, Text, useTheme, IconButton } from "react-native-paper";
import { Transaction } from "../types";

interface Props {
  transaction: Transaction;
  onPress?: () => void;
}

export const TransactionItem = ({ transaction, onPress }: Props) => {
  const theme = useTheme();
  const isIncome = transaction.type === "income";

  return (
    <List.Item
      title={transaction.title}
      description={transaction.date.split("T")[0]} // Simple date format
      left={(props) => <List.Icon {...props} icon={isIncome ? "arrow-up-circle" : "arrow-down-circle"} color={isIncome ? (theme.colors as any).success : (theme.colors as any).error} />}
      right={(props) => (
        <View style={styles.right}>
          <Text
            variant="bodyLarge"
            style={{
              color: isIncome ? (theme.colors as any).success : theme.colors.onSurface,
              fontWeight: "bold",
            }}
          >
            {isIncome ? "+" : "-"}${transaction.amount}
          </Text>
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
