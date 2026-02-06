import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Appbar, Avatar, Button, Dialog, Divider, IconButton, Modal, Portal, ProgressBar, RadioButton, Surface, Text, TextInput, useTheme } from "react-native-paper";
import Animated, { FadeInUp } from "react-native-reanimated";
import { GlassAppbar } from "../../../src/components/ui/GlassAppbar";
import { GlassFAB } from "../../../src/components/ui/GlassFAB";
import { FinancialService } from "../../../src/services/financial";
import { Database } from "../../../src/types/schema";
import { CurrencyUtils } from "../../../src/utils/currency";
import { getTodayLocalISO } from "../../../src/utils/date";

type CreditCard = Database["public"]["Tables"]["credit_cards"]["Row"];
type BankAccount = Database["public"]["Tables"]["bank_accounts"]["Row"];

export default function CardDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();

  const [card, setCard] = useState<CreditCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // Invoice State
  const [currentDate, setCurrentDate] = useState(new Date()); // Represents the MONTH of the invoice
  const [transactions, setTransactions] = useState<any[]>([]);
  const [invoiceTotal, setInvoiceTotal] = useState(0);

  // Payment State
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [paying, setPaying] = useState(false);

  // Edit Balance State
  const [editBalanceVisible, setEditBalanceVisible] = useState(false);
  const [newBalance, setNewBalance] = useState("");

  const handleUpdateBalance = async () => {
    if (!card) return;
    try {
      const targetBalance = CurrencyUtils.parse(newBalance, card.currency_code);
      const currentBalance = card.current_balance || 0;
      const difference = targetBalance - currentBalance;

      // Only act if there is a difference
      if (Math.abs(difference) > 0.01) {
        await FinancialService.createTransaction({
          amount: Math.abs(difference),
          type: difference > 0 ? "expense" : "income", // If debt increases (target > current), it's an expense.
          description: "Ajuste de Saldo / Fatura Importada",
          credit_card_id: card.id,
          transaction_date: getTodayLocalISO(),
          currency_code: card.currency_code,
          category_id: null,
          account_id: null,
          destination_account_id: null,
          notes: null,
          status: "completed",
        } as any);
      }

      setEditBalanceVisible(false);
      // Wait a bit for sync
      setTimeout(() => {
        loadCardDetails();
        loadInvoice(currentDate);
      }, 500);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCardDetails();
      loadInvoice(currentDate);
    }, [id, currentDate]),
  );

  const hasAutoSwitched = React.useRef(false);

  useEffect(() => {
    if (card) {
      // Only run this auto-switch logic ONCE when card is loaded
      if (!hasAutoSwitched.current) {
        hasAutoSwitched.current = true;

        const now = new Date();
        const closingDay = card.closing_day || 1;

        // Start from specific Y/M/1 to avoid "Jan 30 -> Feb gives March" overflow bug
        const targetDate = new Date(now.getFullYear(), now.getMonth(), 1);

        // If today is past closing, the "Open" invoice is next month
        if (now.getDate() >= closingDay) {
          targetDate.setMonth(targetDate.getMonth() + 1);
        }

        setCurrentDate(targetDate);
        // The setCurrentDate will trigger this effect again with new date, which falls into the "else" (effectively)
        // actually it triggers re-render, but we need to ensure loadInvoice runs.
        // Since we changed state, next render runs effect.
        return;
      }

      loadInvoice(currentDate);
    }
  }, [card, currentDate]);

  const loadCardDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [cardData, accountsData] = await Promise.all([FinancialService.getCardById(id), FinancialService.getAccounts()]);

      if (cardData) {
        setCard(cardData);
      }
      setAccounts(accountsData);
      if (accountsData.length > 0) setSelectedAccountId(accountsData[0].id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoice = async (date: Date) => {
    if (!id) return;
    try {
      setInvoiceLoading(true);
      const data = await FinancialService.getCardTransactions(id, date.getMonth(), date.getFullYear());

      // Auto-Opening Balance Logic:
      // If no transactions found for this invoice, BUT card has a big current_balance,
      // and we are looking at the invoice that is currently ending/ended (closest to now),
      // we assume the user created the card with an initial balance that needs to be paid.

      const isCandidateForInitialBalance = data.transactions.length === 0 && data.total === 0 && (card?.current_balance || 0) > 0;

      // Check if this invoice is the one "covering" the current moment or just closed
      // If today is 29 Jan, closing was 26 Jan. This invoice (Jan view) is the one holding that balance.
      if (isCandidateForInitialBalance && card) {
        // Verify if this balance isn't just future installments (simplified check: crude balance check)
        // If the user SAYS "This balance is for this invoice", we trust card.current_balance
        // We only do this if it matches the "Current Bill" concept.

        // Let's rely on the concept: "If total transactions are 0, but card balance > 0, show balance as Initial Balance"
        // regardless of date, provided we are not looking at a future month far away.
        // Constraint: Only for the month matching "today" or "last month" relative to closing.

        const now = new Date();
        const viewDate = new Date(date);
        const diffMonth = now.getMonth() - viewDate.getMonth() + 12 * (now.getFullYear() - viewDate.getFullYear());

        // Allow if viewDate is same month or previous month
        if (diffMonth >= 0 && diffMonth <= 1) {
          const synthTransaction = {
            id: "initial_balance_adjustment",
            amount: card.current_balance,
            type: "expense",
            description: "Saldo Inicial / Importado",
            transaction_date: getTodayLocalISO(),
            category: {
              name: "Ajuste",
              icon: "cash",
              color: theme.colors.outline,
            },
            currency_code: card.currency_code,
          };

          setTransactions([synthTransaction]);
          setInvoiceTotal(card.current_balance);
          return;
        }
      }

      setTransactions(data.transactions);
      setInvoiceTotal(data.total);
    } catch (error) {
      console.error(error);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
  };

  const handlePayInvoice = async () => {
    if (!card || !selectedAccountId) return;
    try {
      setPaying(true);
      await FinancialService.payInvoice(card.id, invoiceTotal, selectedAccountId, new Date());
      setPayModalVisible(false);
      // Reload logic
      loadCardDetails();
      loadInvoice(currentDate);
    } catch (error) {
      console.error("Payment failed", error);
    } finally {
      setPaying(false);
    }
  };

  const groupedTransactions = useMemo(() => {
    const groups: { key: string; label: string; items: any[] }[] = [];
    let lastKey = "";

    transactions.forEach((t) => {
      const d = new Date(t.transaction_date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (key !== lastKey) {
        const label = d.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
        groups.push({ key, label, items: [t] });
        lastKey = key;
      } else {
        groups[groups.length - 1].items.push(t);
      }
    });

    return groups;
  }, [transactions]);

  const isInvoiceClosed = () => {
    if (!card) return false;
    // Data de fechamento da fatura visualizada (Mês/Ano do currentDate, dia do closing_day)
    const invoiceCloseDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), card.closing_day || 1);
    // Zera hora para comparar apenas datas
    invoiceCloseDate.setHours(23, 59, 59, 999);

    // Se hoje for maior que a data de fechamento, está fechada.
    const now = new Date();
    return now > invoiceCloseDate;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!card) {
    return (
      <View style={styles.container}>
        <GlassAppbar elevated>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Detalhes do Cartão" />
        </GlassAppbar>
        <View style={styles.emptyContainer}>
          <Text>Cartão não encontrado.</Text>
        </View>
      </View>
    );
  }

  const usage = card.credit_limit > 0 ? (card.current_balance || 0) / card.credit_limit : 0;
  const totalDebt = card.current_balance || 0;
  const available = card.credit_limit - totalDebt;

  let animationIndex = 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GlassAppbar elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={card.name} subtitle={card.brand} />
        <Appbar.Action icon="pencil" onPress={() => router.push({ pathname: "/(app)/cards/new", params: { id: card.id } } as any)} />
      </GlassAppbar>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Card Summary */}
        <Surface style={styles.summaryCard} elevation={2}>
          <View style={styles.row}>
            <View>
              <Text variant="bodyMedium" style={{ opacity: 0.7 }}>
                Limite Total
              </Text>
              <Text variant="titleLarge">{CurrencyUtils.format(card.credit_limit, card.currency_code)}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text variant="bodyMedium" style={{ opacity: 0.7 }}>
                Disponível
              </Text>
              <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
                {CurrencyUtils.format(available, card.currency_code)}
              </Text>
            </View>
          </View>

          <Divider style={{ marginVertical: 12 }} />

          <View>
            <View style={styles.row}>
              <Text variant="bodySmall">Utilizado (Total)</Text>
              <Text variant="bodySmall">{(usage * 100).toFixed(1)}%</Text>
            </View>
            <ProgressBar progress={usage > 1 ? 1 : usage} color={usage > 0.9 ? theme.colors.error : theme.colors.primary} style={styles.progressBar} />
            <View style={styles.row}>
              <Text variant="bodySmall" style={{ color: theme.colors.error, fontWeight: "bold" }}>
                Total Devedor: {CurrencyUtils.format(totalDebt, card.currency_code)}
              </Text>
              <Text variant="bodySmall">Fecha dia {card.closing_day}</Text>
            </View>
          </View>
        </Surface>

        {/* Invoice Section */}
        <View style={styles.invoiceHeader}>
          <IconButton icon="chevron-left" onPress={() => changeMonth(-1)} />
          <View style={{ alignItems: "center" }}>
            <Text variant="titleMedium" style={{ fontWeight: "bold" }}>
              {currentDate
                .toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })
                .toUpperCase()}
            </Text>
            <Text variant="bodySmall" style={{ opacity: 0.6 }}>
              {(() => {
                const dueDay = card.due_day || 1;
                const closingDay = card.closing_day || 1;
                let dueMonth = currentDate.getMonth();
                const dueYear = currentDate.getFullYear();

                if (dueDay < closingDay) {
                  dueMonth += 1;
                }

                const d = new Date(dueYear, dueMonth, dueDay);
                return `Vence dia ${d.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}`;
              })()}
            </Text>
          </View>
          <IconButton icon="chevron-right" onPress={() => changeMonth(1)} accessibilityLabel="Próximo Mês" aria-label="Próximo Mês" />
        </View>

        <Surface style={styles.invoiceTotalCard} elevation={1}>
          <Text variant="bodyMedium">Total da Fatura {isInvoiceClosed() ? "(Fechada)" : "(Estimado)"}</Text>
          <Text variant="headlineMedium" style={{ fontWeight: "bold" }}>
            {CurrencyUtils.format(invoiceTotal, card.currency_code)}
          </Text>

          {isInvoiceClosed() && invoiceTotal > 0 && (
            <Button mode="contained" onPress={() => setPayModalVisible(true)} style={{ marginTop: 12 }} icon="check-circle">
              Pagar Fatura
            </Button>
          )}
        </Surface>

        <Portal>
          {/* Edit Balance Dialog */}
          <Dialog visible={editBalanceVisible} onDismiss={() => setEditBalanceVisible(false)}>
            <Dialog.Title>Ajustar Saldo</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium" style={{ marginBottom: 12 }}>
                Defina o valor correto para a fatura atual. Isso ajustará o saldo inicial.
              </Text>
              <TextInput label="Novo Saldo" value={newBalance} onChangeText={(t) => setNewBalance(CurrencyUtils.maskInput(t))} keyboardType="numeric" mode="outlined" />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setEditBalanceVisible(false)}>Cancelar</Button>
              <Button onPress={handleUpdateBalance}>Salvar</Button>
            </Dialog.Actions>
          </Dialog>

          <Modal visible={payModalVisible} onDismiss={() => setPayModalVisible(false)} contentContainerStyle={styles.modalContainer}>
            <Text variant="titleLarge" style={{ marginBottom: 16 }}>
              Pagar Fatura
            </Text>
            <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
              Valor: <Text style={{ fontWeight: "bold" }}>{CurrencyUtils.format(invoiceTotal, card.currency_code)}</Text>
            </Text>
            <Text variant="bodyLarge" style={{ marginBottom: 12 }}>
              Selecione a conta para débito:
            </Text>

            <ScrollView style={{ maxHeight: 200 }}>
              {accounts.map((acc) => (
                <View key={acc.id} style={styles.accountOption}>
                  <RadioButton value={acc.id} status={selectedAccountId === acc.id ? "checked" : "unchecked"} onPress={() => setSelectedAccountId(acc.id)} />
                  <Text>
                    {acc.name} ({CurrencyUtils.format(acc.current_balance || 0, acc.currency_code)})
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button onPress={() => setPayModalVisible(false)} disabled={paying}>
                Cancelar
              </Button>
              <Button mode="contained" onPress={handlePayInvoice} loading={paying} disabled={paying}>
                Confirmar Pagamento
              </Button>
            </View>
          </Modal>
        </Portal>

        {/* Transactions List */}
        {invoiceLoading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <View style={styles.transactionsList}>
            <Text variant="titleMedium" style={{ marginBottom: 12, marginLeft: 4 }}>
              Transações
            </Text>
            {transactions.length === 0 ? (
              <Text style={{ textAlign: "center", marginTop: 20, opacity: 0.5 }}>Nenhuma transação nesta fatura.</Text>
            ) : (
              groupedTransactions.map((group) => (
                <View key={group.key} style={styles.transactionGroup}>
                  <Text variant="labelSmall" style={[styles.transactionGroupTitle, { color: theme.colors.onSurfaceVariant }]}>
                    {group.label}
                  </Text>
                  {group.items.map((t) => {
                    const delay = animationIndex * 50;
                    animationIndex += 1;
                    return (
                      <Animated.View key={t.id} entering={FadeInUp.delay(delay)}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => {
                            if (t.id === "initial_balance_adjustment") {
                              setNewBalance(CurrencyUtils.format(t.amount, t.currency_code).replace("R$", "").trim());
                              setEditBalanceVisible(true);
                            } else {
                              router.push(`/(app)/transactions/${t.id}`);
                            }
                          }}
                        >
                          <Surface style={styles.transactionItem} elevation={0}>
                            <View style={styles.row}>
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 12,
                                  flex: 1,
                                  paddingRight: 8,
                                }}
                              >
                                <Avatar.Icon
                                  size={36}
                                  icon={t.category?.icon || "help"}
                                  style={{
                                    backgroundColor: t.category?.color || theme.colors.secondaryContainer,
                                  }}
                                  color="white"
                                />
                                <View style={{ flex: 1 }}>
                                  <Text variant="bodyMedium" style={{ fontWeight: "bold" }} numberOfLines={1} ellipsizeMode="tail">
                                    {t.description}
                                  </Text>
                                  {/* Special case: Edit Initial Balance */}
                                  {t.id === "initial_balance_adjustment" ? (
                                    <Text
                                      variant="bodySmall"
                                      style={{
                                        color: theme.colors.primary,
                                        fontWeight: "bold",
                                        marginTop: 2,
                                      }}
                                    >
                                      Toque para ajustar saldo
                                    </Text>
                                  ) : (
                                    <View
                                      style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 4,
                                      }}
                                    >
                                      <Text variant="bodySmall" style={{ opacity: 0.6 }} numberOfLines={1}>
                                        {new Date(t.transaction_date).toLocaleDateString()} • {t.category?.name || "Sem Categoria"}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                              <Text variant="bodyLarge" style={{ fontWeight: "bold", flexShrink: 0 }}>
                                {CurrencyUtils.format(t.amount, t.currency_code || card.currency_code)}
                              </Text>
                            </View>
                          </Surface>
                        </TouchableOpacity>
                        <Divider />
                      </Animated.View>
                    );
                  })}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
      <GlassFAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() =>
          router.push({
            pathname: "/add-transaction",
            params: { preselectedCardId: card.id },
          })
        }
      />
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  invoiceTotalCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  transactionsList: {
    marginTop: 0,
  },
  transactionGroup: {
    marginBottom: 12,
  },
  transactionGroupTitle: {
    marginBottom: 6,
    marginLeft: 4,
    textTransform: "capitalize",
  },
  transactionItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: "transparent",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginVertical: 8,
    backgroundColor: "#eee",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 24,
    margin: 20,
    borderRadius: 8,
  },
  accountOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 24,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 32,
    borderRadius: 16,
  },
});
