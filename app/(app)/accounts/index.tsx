import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { ActivityIndicator, Appbar, Avatar, FAB, Surface, Text, useTheme } from "react-native-paper";
import Animated, { FadeInUp } from "react-native-reanimated";
import { FinancialService } from "../../../src/services/financial";
import { Database } from "../../../src/types/schema";

type BankAccount = Database["public"]["Tables"]["bank_accounts"]["Row"];

export default function AccountsList() {
  const theme = useTheme();
  const router = useRouter();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await FinancialService.getAccounts();
      setAccounts(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAccounts();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAccounts();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "checking":
        return "bank";
      case "savings":
        return "piggy-bank";
      case "investment":
        return "chart-line";
      case "digital_wallet":
        return "cellphone";
      case "cash":
        return "wallet";
      default:
        return "bank-outline";
    }
  };

  const renderItem = ({ item, index }: { item: BankAccount; index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 100).springify()}>
      <Surface style={styles.card} elevation={1}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconContainer, { backgroundColor: item.color || theme.colors.primaryContainer }]}>
            <Avatar.Icon size={40} icon={getIcon(item.account_type)} style={{ backgroundColor: "transparent" }} color={item.color ? "white" : theme.colors.primary} />
          </View>
          <View>
            <Text variant="titleMedium" style={styles.accountName}>
              {item.name}
            </Text>
            <Text variant="bodySmall" style={styles.accountType}>
              {item.account_type.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text variant="titleMedium" style={styles.balance}>
            {item.currency_code} {item.current_balance?.toFixed(2)}
          </Text>
        </View>
      </Surface>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Minhas Contas" />
      </Appbar.Header>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text>Nenhuma conta encontrada.</Text>
            </View>
          }
        />
      )}

      <FAB icon="plus" style={[styles.fab, { backgroundColor: theme.colors.primary }]} color="white" onPress={() => router.push("/(app)/accounts/new" as any)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // backgroundColor: "white", -- REMOVED
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  accountName: {
    fontWeight: "bold",
  },
  accountType: {
    opacity: 0.6,
    fontSize: 10,
  },
  cardRight: {
    alignItems: "flex-end",
  },
  balance: {
    fontWeight: "bold",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 30, // Circle
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
});
