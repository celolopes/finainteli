import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { FlatList, Image, RefreshControl, StyleSheet, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Appbar, Avatar, FAB, ProgressBar, Surface, Text, useTheme } from "react-native-paper";
import Animated, { FadeInUp } from "react-native-reanimated";
import { FinancialService } from "../../../src/services/financial";
import { Database } from "../../../src/types/schema";
import { CurrencyUtils } from "../../../src/utils/currency";

type CreditCard = Database["public"]["Tables"]["credit_cards"]["Row"] & { next_invoice_estimate?: number };

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
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadCards();
  };

  const getBrandLogo = (brand?: string | null) => {
    if (!brand) return null;

    // Using simple reliable logos for major brands
    // Map brands to official domains for reliable logo fetching
    const BRAND_DOMAINS: Record<string, string> = {
      visa: "visa.com.br",
      mastercard: "mastercard.com.br",
      amex: "americanexpress.com",
      elo: "elo.com.br",
      hipercard: "hipercard.com.br",
      nubank: "nubank.com.br",
    };

    const key = Object.keys(BRAND_DOMAINS).find((k) => brand.toLowerCase().includes(k.toLowerCase()));

    if (key) {
      const domain = BRAND_DOMAINS[key as keyof typeof BRAND_DOMAINS];
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
    }

    return null;
  };

  const renderItem = ({ item, index }: { item: CreditCard; index: number }) => {
    // Check if invoice is closed logic (simplified check, ideal would be shared utility)
    const now = new Date();
    const closingDay = item.closing_day || 1;
    const isClosed = now.getDate() >= closingDay;

    // Total Debt = `current_balance` + `next_invoice_estimate`.
    const displayBalance = (item.current_balance || 0) + (item.next_invoice_estimate || 0);

    const usage = item.credit_limit > 0 ? displayBalance / item.credit_limit : 0;
    const available = item.credit_limit - displayBalance;
    const logoUrl = getBrandLogo(item.brand);

    return (
      <Animated.View entering={FadeInUp.delay(index * 100).springify()}>
        <TouchableOpacity onPress={() => router.push(`/(app)/cards/${item.id}` as any)} activeOpacity={0.9} aria-label={`Cartão ${item.name}`}>
          <Surface style={[styles.card, { overflow: "hidden" }]} elevation={1}>
            {/* Background Logo with Glass Effect */}
            {logoUrl && (
              <View style={StyleSheet.absoluteFill}>
                <Image source={{ uri: logoUrl }} style={styles.bgLogo} resizeMode="contain" />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.elevation.level2, opacity: 0.7 }]} />
              </View>
            )}

            <View style={{ zIndex: 1 }}>
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
                    {CurrencyUtils.format(displayBalance, item.currency_code)}
                  </Text>
                </View>

                <ProgressBar progress={usage > 1 ? 1 : usage} color={usage > 0.8 ? theme.colors.error : theme.colors.primary} style={styles.progress} />

                <View style={[styles.row, { marginTop: 4 }]}>
                  <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                    Limite: {CurrencyUtils.format(item.credit_limit, item.currency_code)}
                  </Text>
                  <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                    Disp: {CurrencyUtils.format(available, item.currency_code)}
                  </Text>
                </View>
              </View>
            </View>
          </Surface>
        </TouchableOpacity>
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
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  bgLogo: {
    position: "absolute",
    right: -40,
    bottom: -60,
    width: 300,
    height: 300,
    opacity: 0.5,
    transform: [{ rotate: "-15deg" }],
  },
  cardHeader: {
    padding: 16,
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
    paddingHorizontal: 16,
    paddingBottom: 16,
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
