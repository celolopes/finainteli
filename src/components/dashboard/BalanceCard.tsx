import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, Surface, Text, useTheme } from "react-native-paper";
import Animated, { FadeInUp, Layout, ZoomIn } from "react-native-reanimated";
import { useAppTheme } from "../../context/ThemeContext";
import { useFinancialStore } from "../../store/financialStore";
import { Database } from "../../types/schema";
import { LiquidGlassSurface } from "../ui/LiquidGlassSurface";

type ExtendedCreditCard = Database["public"]["Tables"]["credit_cards"]["Row"] & {
  next_invoice_estimate?: number;
  open_invoice_estimate?: number;
  closed_invoice_outstanding?: number;
};

const STORAGE_KEY = "@finainteli_balance_expanded";

export const BalanceCard = () => {
  const theme = useTheme();
  const { isLiquidGlass, colors } = useAppTheme();
  const { t, i18n } = useTranslation();
  const { monthlySummary, isLoading, accounts, creditCards } = useFinancialStore();
  const [expanded, setExpanded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persistence state
  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          setExpanded(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load balance expanded state", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadState();
  }, []);

  // Save persistence state
  const toggleExpanded = async () => {
    const newState = !expanded;
    setExpanded(newState);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.error("Failed to save balance expanded state", e);
    }
  };

  // Patrimônio total = soma contas + soma cartões (se positivo/investimentos) - dividas cartões?
  // User asked for "Total Assets" expand to show "Accounts" and "Credit cards".
  // Usually "Patrimony" = Assets - Liabilities.
  // But typically in dashboard "Start", "Total Balance" usually means "Cash Available".
  // I will keep the previous calculation for "Total Patrimony" (sum of accounts) as displayed in the card,
  // but maybe I should add Credit Card balance if it's considered?
  // The prompt says "trazer todas as contas cadastradas e saldo em cada conta e os cartões de créditos também".
  // It doesn't explicitly say to change the *Total* calculation, just the expanded view.
  // I will stick to current Total calculation (sum of accounts) for the main number to avoid confusion,
  // unless "Patrimony" implies Net Worth. Accounts usually imply assets.
  const totalPatrimony = accounts?.reduce((acc, curr) => acc + (Number(curr.current_balance) || 0), 0) || 0;

  // Balanço mensal = receitas - despesas do mês
  const monthlyBalance = monthlySummary.income - monthlySummary.expense;

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat(i18n.language || "pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getBalanceColor = () => {
    if (monthlyBalance > 0) return theme.colors.primary;
    if (monthlyBalance < 0) return theme.colors.error;
    return theme.colors.onSurfaceVariant;
  };

  const LiquidCard = ({ children, style, overlayColor }: { children: React.ReactNode; style?: any; overlayColor?: string }) => {
    if (!isLiquidGlass) {
      return (
        <Surface style={style} elevation={2}>
          {children}
        </Surface>
      );
    }

    return (
      <LiquidGlassSurface effect="regular" useBlurFallback={false} style={[style, styles.glassCard, { borderColor: colors.glassBorder }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: overlayColor || "rgba(20,20,20,0.35)" }]} />
        {children}
      </LiquidGlassSurface>
    );
  };

  return (
    <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.container}>
      {/* Card 1: Patrimônio Total (Expandable) */}
      <Pressable onPress={toggleExpanded} style={({ pressed }) => ({ opacity: pressed ? 0.95 : 1 })}>
        <LiquidCard style={[styles.card, { backgroundColor: isLiquidGlass ? "transparent" : theme.colors.primaryContainer }]} overlayColor={isLiquidGlass ? "rgba(88, 76, 129, 0.35)" : undefined}>
          <View style={styles.header}>
            <Text variant="labelLarge" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.8 }}>
              {t("dashboard.patrimony", "Patrimônio Total")}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Icon source={expanded ? "chevron-up" : "chevron-down"} size={20} color={theme.colors.onPrimaryContainer} />
              <Icon source="bank" size={20} color={theme.colors.onPrimaryContainer} />
            </View>
          </View>

          {isLoading ? (
            <Text variant="displaySmall" style={[styles.balance, { color: theme.colors.onPrimaryContainer }]}>
              ---
            </Text>
          ) : (
            <Animated.Text entering={ZoomIn.delay(300)} style={[styles.amountText, { color: theme.colors.onPrimaryContainer }]}>
              <Text variant="displaySmall" style={{ fontWeight: "bold" }}>
                {formatMoney(totalPatrimony)}
              </Text>
            </Animated.Text>
          )}

          <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.7, marginBottom: expanded ? 16 : 0 }}>
            {expanded ? t("dashboard.details", "Detalhes das contas") : t("dashboard.accountsSum", "Soma de todas as contas")}
          </Text>

          {/* Expanded Content */}
          {expanded && !isLoading && (
            <Animated.View entering={FadeInUp.duration(300)} layout={Layout.springify()}>
              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: theme.colors.onPrimaryContainer, opacity: 0.1 }]} />

              {/* Accounts List */}
              <Text variant="labelMedium" style={{ color: theme.colors.onPrimaryContainer, fontWeight: "bold", marginVertical: 8 }}>
                {t("common.accounts", "Contas")}
              </Text>
              {accounts.map((acc) => (
                <View key={acc.id} style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <Icon source={acc.icon || "bank-outline"} size={20} color={theme.colors.onPrimaryContainer} />
                    <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer }}>
                      {acc.name}
                    </Text>
                  </View>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer, fontWeight: "bold" }}>
                    {formatMoney(acc.current_balance)}
                  </Text>
                </View>
              ))}

              {/* Credit Cards List */}
              {creditCards && creditCards.length > 0 && (
                <>
                  <Text variant="labelMedium" style={{ color: theme.colors.onPrimaryContainer, fontWeight: "bold", marginTop: 16, marginBottom: 8 }}>
                    {t("common.creditCards", "Cartões de Crédito")}
                  </Text>
                  {creditCards.map((card) => (
                    <View key={card.id} style={styles.itemRow}>
                      <View style={styles.itemLeft}>
                        <Icon source={card.icon || "credit-card-outline"} size={20} color={theme.colors.onPrimaryContainer} />
                        <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer }}>
                          {card.name}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        {(() => {
                          const openEstimate = (card as ExtendedCreditCard).open_invoice_estimate ?? (card as ExtendedCreditCard).next_invoice_estimate ?? 0;
                          const closedOutstanding = (card as ExtendedCreditCard).closed_invoice_outstanding ?? 0;
                          const totalInvoice = card.current_balance || 0;

                          return (
                            <>
                              {closedOutstanding > 0.01 && (
                                <View style={{ alignItems: "flex-end", marginBottom: 4 }}>
                                  <Text variant="labelSmall" style={{ color: theme.colors.error, fontWeight: "bold" }}>
                                    Fatura Fechada
                                  </Text>
                                  <Text variant="bodyMedium" style={{ color: theme.colors.error, fontWeight: "bold" }}>
                                    {formatMoney(closedOutstanding)}
                                  </Text>
                                </View>
                              )}

                              <View style={{ alignItems: "flex-end", marginBottom: 4, opacity: closedOutstanding > 0.01 ? 0.7 : 1 }}>
                                <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer }}>
                                  Fatura Aberta
                                </Text>
                                <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer }}>
                                  {formatMoney(openEstimate)}
                                </Text>
                              </View>

                              <View style={{ alignItems: "flex-end" }}>
                                <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer, fontWeight: "bold" }}>
                                  Fatura Total
                                </Text>
                                <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer, fontWeight: "bold" }}>
                                  {formatMoney(totalInvoice)}
                                </Text>
                              </View>
                            </>
                          );
                        })()}
                      </View>
                    </View>
                  ))}
                </>
              )}
            </Animated.View>
          )}
        </LiquidCard>
      </Pressable>

      {/* Card 2: Balanço Mensal */}
      <LiquidCard style={[styles.card, styles.monthlyCard, { backgroundColor: isLiquidGlass ? "transparent" : theme.colors.surface }]} overlayColor={isLiquidGlass ? "rgba(18,18,18,0.35)" : undefined}>
        <View style={styles.header}>
          <Text variant="labelLarge" style={{ color: theme.colors.onSurface, opacity: 0.8 }}>
            {t("dashboard.monthlyBalance", "Balanço do Mês")}
          </Text>
          <Icon source="calendar-month" size={20} color={theme.colors.onSurface} />
        </View>

        {isLoading ? (
          <Text variant="headlineMedium" style={[styles.balanceSmall, { color: theme.colors.onSurface }]}>
            ---
          </Text>
        ) : (
          <Text variant="headlineMedium" style={[styles.balanceSmall, { color: getBalanceColor(), fontWeight: "bold" }]}>
            {monthlyBalance >= 0 ? "+" : ""}
            {formatMoney(monthlyBalance)}
          </Text>
        )}

        <View style={styles.row}>
          <View style={[styles.statItem, { backgroundColor: theme.colors.primaryContainer }]}>
            <Icon source="arrow-down-circle" size={18} color={theme.colors.primary} />
            <View style={styles.statText}>
              <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer, opacity: 0.7 }}>
                {t("dashboard.income")}
              </Text>
              <Text variant="titleSmall" style={{ color: theme.colors.primary, fontWeight: "bold" }}>
                {formatMoney(monthlySummary.income)}
              </Text>
            </View>
          </View>

          <View style={[styles.statItem, { backgroundColor: theme.colors.errorContainer }]}>
            <Icon source="arrow-up-circle" size={18} color={theme.colors.error} />
            <View style={styles.statText}>
              <Text variant="labelSmall" style={{ color: theme.colors.onErrorContainer, opacity: 0.7 }}>
                {t("dashboard.expense")}
              </Text>
              <Text variant="titleSmall" style={{ color: theme.colors.error, fontWeight: "bold" }}>
                {formatMoney(monthlySummary.expense)}
              </Text>
            </View>
          </View>
        </View>
      </LiquidCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  card: {
    borderRadius: 20,
    padding: 20,
  },
  glassCard: {
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  monthlyCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  balance: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  balanceSmall: {
    marginBottom: 12,
  },
  amountText: {
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  statText: {
    flex: 1,
  },
  divider: {
    height: 1,
    width: "100%",
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(18, 18, 18, 0.05)",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
