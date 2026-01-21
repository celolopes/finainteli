import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { ActivityIndicator, Appbar, Avatar, FAB, ProgressBar, Surface, Text, useTheme } from "react-native-paper";
import Animated, { FadeInUp } from "react-native-reanimated";
import { FinancialService } from "../../../src/services/financial";
import { Database } from "../../../src/types/schema";

type CreditCard = Database["public"]["Tables"]["credit_cards"]["Row"];

export default function CardsList() {
  const theme = useTheme();
  const router = useRouter();
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCards = async () => {
    try {
      setLoading(true);
      const data = await FinancialService.getCreditCards();
      setCards(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCards();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadCards();
  };

  const renderItem = ({ item, index }: { item: CreditCard; index: number }) => {
    // Calcular percentual usado (se credit_limit > 0)
    const usage = item.credit_limit > 0 ? (item.current_balance || 0) / item.credit_limit : 0;

    return (
      <Animated.View entering={FadeInUp.delay(index * 100).springify()}>
        <Surface style={styles.card} elevation={1}>
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconContainer, { backgroundColor: item.color || theme.colors.tertiaryContainer }]}>
                <Avatar.Icon size={40} icon="credit-card" style={{ backgroundColor: "transparent" }} color={item.color ? "white" : theme.colors.tertiary} />
              </View>
              <View>
                <Text variant="titleMedium" style={styles.name}>
                  {item.name}
                </Text>
                <Text variant="bodySmall" style={styles.brand}>
                  {item.brand || "Cartão de Crédito"}
                </Text>
              </View>
            </View>
            <Text variant="bodySmall">Dia {item.due_day} (Vec.)</Text>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.row}>
              <Text variant="bodyMedium">Fatura Atual</Text>
              <Text variant="titleMedium" style={{ color: theme.colors.error, fontWeight: "bold" }}>
                {item.currency_code} {item.current_balance?.toFixed(2)}
              </Text>
            </View>

            <ProgressBar progress={usage} color={usage > 0.8 ? theme.colors.error : theme.colors.primary} style={styles.progress} />

            <View style={[styles.row, { marginTop: 4 }]}>
              <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                Limite: {item.credit_limit.toFixed(0)}
              </Text>
              <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                Disp: {(item.available_limit !== null && item.available_limit !== undefined ? item.available_limit : item.credit_limit - (item.current_balance || 0)).toFixed(2)}
              </Text>
            </View>
          </View>
        </Surface>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Meus Cartões" />
      </Appbar.Header>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text>Nenhum cartão encontrado.</Text>
            </View>
          }
        />
      )}

      <FAB icon="plus" style={[styles.fab, { backgroundColor: theme.colors.primary }]} color="white" onPress={() => router.push("/(app)/cards/new" as any)} />
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
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "white",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8, // Cartão squared
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontWeight: "bold",
  },
  brand: {
    opacity: 0.6,
    fontSize: 10,
  },
  cardBody: {
    marginTop: 0,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progress: {
    height: 6,
    borderRadius: 3,
    marginVertical: 8,
    backgroundColor: "#eee",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
});
