import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Image, RefreshControl, StyleSheet, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Appbar, Avatar, FAB, Surface, Text, useTheme } from "react-native-paper";
import Animated, { FadeInUp } from "react-native-reanimated";
import { FinancialService } from "../../../src/services/financial";
import { Database } from "../../../src/types/schema";
import { CurrencyUtils } from "../../../src/utils/currency";

type BankAccount = Database["public"]["Tables"]["bank_accounts"]["Row"];

export default function AccountsList() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
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

  const getBankLogo = (name: string) => {
    // Map bank names to their primary domains for reliable logo fetching via Google Favicon API
    const BANK_DOMAINS: Record<string, string> = {
      Nubank: "nubank.com.br",
      NuConta: "nubank.com.br",
      Inter: "inter.co",
      "Banco Inter": "inter.co",
      Itaú: "itau.com.br",
      Itau: "itau.com.br",
      Bradesco: "bradesco.com.br",
      "Banco do Brasil": "bb.com.br",
      BB: "bb.com.br",
      Santander: "santander.com.br",
      Caixa: "caixa.gov.br",
      C6: "c6bank.com.br",
      "C6 Bank": "c6bank.com.br",
      Neon: "neon.com.br",
      Next: "next.me",
      PicPay: "picpay.com",
      "Mercado Pago": "mercadopago.com.br",
      XP: "xpi.com.br",
      BTG: "btgpactual.com",
      Sofisa: "sofisadireto.com.br",
      "99Pay": "99app.com",
      PagBank: "pagseguro.uol.com.br",
      PagSeguro: "pagseguro.uol.com.br",
      Rico: "rico.com.vc",
      Toro: "toroinvestimentos.com.br",
      Nomad: "nomadglobal.com",
      Wise: "wise.com",
      Revolut: "revolut.com",
    };

    const key = Object.keys(BANK_DOMAINS).find((k) => name.toLowerCase().includes(k.toLowerCase()));

    if (key) {
      const domain = BANK_DOMAINS[key];
      // Using Google's Favicon API - usually reliable and free
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
    }
    return null;
  };

  const getAccountTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      checking: t("account.type.checking", "Conta Corrente"),
      savings: t("account.type.savings", "Poupança"),
      investment: t("account.type.investment", "Investimento"),
      digital_wallet: t("account.type.digital_wallet", "Carteira Digital"),
      cash: t("account.type.cash", "Dinheiro Físico"),
      credit_card: t("account.type.credit_card", "Cartão de Crédito"),
    };
    return map[type] || type.toUpperCase();
  };

  const renderItem = ({ item, index }: { item: BankAccount; index: number }) => {
    const logoUrl = getBankLogo(item.name);

    return (
      <Animated.View entering={FadeInUp.delay(index * 100).springify()}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push(`/(app)/accounts/${item.id}` as any)}>
          <Surface style={[styles.card, { overflow: "hidden" }]} elevation={2} aria-label={`Conta ${item.name}`}>
            {/* Background Logo with Glass Effect */}
            {logoUrl && (
              <View style={StyleSheet.absoluteFill}>
                <Image
                  source={{ uri: logoUrl || "" }}
                  style={styles.bgLogo}
                  resizeMode="contain"
                  blurRadius={0} // Remove blur for better visibility
                />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.elevation.level2, opacity: 0.7 }]} />
              </View>
            )}

            <View style={styles.cardContent}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconContainer, { backgroundColor: item.color || theme.colors.primaryContainer, zIndex: 2 }]}>
                  <Avatar.Icon size={40} icon={getIcon(item.account_type)} style={{ backgroundColor: "transparent" }} color={item.color ? "white" : theme.colors.primary} />
                </View>
                <View style={{ zIndex: 2 }}>
                  <Text variant="titleMedium" style={styles.accountName}>
                    {item.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.accountType}>
                    {getAccountTypeLabel(item.account_type)}
                  </Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text variant="titleMedium" style={[styles.balance, { color: theme.colors.primary }]}>
                  {CurrencyUtils.format(item.current_balance || 0, item.currency_code)}
                </Text>
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
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: "transparent", // Allow internal layers to handle color
  },
  cardContent: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 1,
  },
  bgLogo: {
    position: "absolute",
    right: -20,
    bottom: -20,
    width: 150,
    height: 150,
    opacity: 0.5, // Increased from 0.15
    transform: [{ rotate: "-15deg" }],
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
