import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Appbar, Avatar, Button, Dialog, Portal, RadioButton, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";
import { FinancialService } from "../../../src/services/financial";
import { DetailedTransaction } from "../../../src/types";
import { Database } from "../../../src/types/schema";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Account = Database["public"]["Tables"]["bank_accounts"]["Row"];
type Card = Database["public"]["Tables"]["credit_cards"]["Row"];
type Transaction = DetailedTransaction;

/**
 * Tela de Detalhes/Edição de Transação
 */
export default function TransactionDetails() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);

  // Form State
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Data Sources
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<Card[]>([]);

  // Selections
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [useCard, setUseCard] = useState(false);

  // Dialogs
  const [showCatDialog, setShowCatDialog] = useState(false);
  const [showSourceDialog, setShowSourceDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [cats, accs, crds] = await Promise.all([FinancialService.getCategories(), FinancialService.getAccounts(), FinancialService.getCreditCards()]);

      setCategories(cats || []);
      setAccounts(accs || []);
      setCards(crds || []);

      // Load transaction if editing
      if (id) {
        const txn = await FinancialService.getTransactionById(id);

        if (txn) {
          setTransaction(txn);
          setType(txn.type);
          setAmount(txn.amount.toString());
          setDescription(txn.description || "");
          setDate(txn.transaction_date.split("T")[0]);

          // Set category
          const cat = cats?.find((c) => c.id === txn.category_id);
          if (cat) setSelectedCategory(cat);

          // Set account/card
          if (txn.credit_card_id) {
            setUseCard(true);
            const card = crds?.find((c) => c.id === txn.credit_card_id);
            if (card) setSelectedCard(card);
          } else if (txn.account_id) {
            const acc = accs?.find((a) => a.id === txn.account_id);
            if (acc) setSelectedAccount(acc);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!amount || !description || !selectedCategory) return;
    if (!useCard && !selectedAccount) return;
    if (useCard && !selectedCard) return;

    setSaving(true);
    try {
      const value = parseFloat(amount.replace(",", "."));

      const updates: any = {
        type: type as any,
        amount: value,
        description,
        transaction_date: date,
        category_id: selectedCategory.id,
        account_id: useCard ? null : selectedAccount!.id,
        credit_card_id: useCard ? selectedCard!.id : null,
      };

      if (id) {
        await FinancialService.updateTransaction(id, updates);
      }

      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert(t("common.error"), "Erro ao salvar transação");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      await FinancialService.deleteTransaction(id);
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert(t("common.error"), "Erro ao excluir transação");
    }
  };

  const color = type === "expense" ? theme.colors.error : theme.colors.primary;

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t("transactions.edit", "Editar Transação")} />
        <Appbar.Action icon="delete" onPress={() => setShowDeleteDialog(true)} />
      </Appbar.Header>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Type Selector */}
          <SegmentedButtons
            value={type}
            onValueChange={setType}
            buttons={[
              {
                value: "expense",
                label: t("dashboard.expense") || "Despesa",
                style: type === "expense" ? { backgroundColor: theme.colors.errorContainer } : undefined,
              },
              {
                value: "income",
                label: t("dashboard.income") || "Receita",
                style: type === "income" ? { backgroundColor: theme.colors.primaryContainer } : undefined,
              },
            ]}
            style={styles.segmented}
          />

          {/* Amount Input */}
          <View style={styles.amountContainer}>
            <Text variant="displaySmall" style={{ color: color, fontWeight: "bold" }}>
              R$
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0,00"
              placeholderTextColor={theme.colors.onSurfaceDisabled}
              style={[styles.amountInput, { color: color }]}
              contentStyle={{ fontSize: 40, fontWeight: "bold", color: color }}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
            />
          </View>

          {/* Description */}
          <TextInput label={t("transactions.description", "Descrição")} value={description} onChangeText={setDescription} mode="outlined" style={styles.input} placeholder="Ex: Almoço, Uber..." />

          {/* Category Selection */}
          <TouchableOpacity onPress={() => setShowCatDialog(true)} style={styles.selector}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              {t("transactions.category", "Categoria")}
            </Text>
            <View style={styles.selectorValue}>
              <Avatar.Icon size={32} icon={selectedCategory?.icon || "help"} style={{ backgroundColor: selectedCategory?.color || theme.colors.surfaceVariant }} />
              <Text variant="titleMedium">{selectedCategory?.name || t("common.select", "Selecionar")}</Text>
              <Avatar.Icon size={24} icon="chevron-down" style={{ backgroundColor: "transparent" }} color={theme.colors.onSurface} />
            </View>
          </TouchableOpacity>

          {/* Account/Card Selection */}
          <TouchableOpacity onPress={() => setShowSourceDialog(true)} style={styles.selector}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              {type === "expense" ? t("transactions.paidWith", "Pago com") : t("transactions.receivedIn", "Recebido em")}
            </Text>
            <View style={styles.selectorValue}>
              <Avatar.Icon size={32} icon={useCard ? "credit-card" : "bank"} style={{ backgroundColor: (useCard ? selectedCard?.color : selectedAccount?.color) || theme.colors.surfaceVariant }} />
              <Text variant="titleMedium">
                {useCard ? selectedCard?.name || t("transactions.selectCard", "Selecionar Cartão") : selectedAccount?.name || t("transactions.selectAccount", "Selecionar Conta")}
              </Text>
              <Avatar.Icon size={24} icon="chevron-down" style={{ backgroundColor: "transparent" }} color={theme.colors.onSurface} />
            </View>
          </TouchableOpacity>

          {/* Date Input */}
          <TextInput label={t("transactions.date", "Data (YYYY-MM-DD)")} value={date} onChangeText={setDate} mode="outlined" style={styles.input} />

          {/* Save Button */}
          <Button mode="contained" onPress={handleSave} loading={saving} style={[styles.button, { backgroundColor: color }]} contentStyle={{ height: 50 }}>
            {t("common.save", "Salvar")}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Dialog */}
      <Portal>
        <Dialog visible={showCatDialog} onDismiss={() => setShowCatDialog(false)} style={{ maxHeight: "80%" }}>
          <Dialog.Title>{t("transactions.selectCategory", "Selecionar Categoria")}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <View style={styles.grid}>
                {categories
                  .filter((c) => c.type === "both" || c.type === type)
                  .map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.catItem, selectedCategory?.id === cat.id && styles.catItemSelected]}
                      onPress={() => {
                        setSelectedCategory(cat);
                        setShowCatDialog(false);
                      }}
                    >
                      <Avatar.Icon size={40} icon={cat.icon || "circle"} style={{ backgroundColor: cat.color || "#ddd" }} />
                      <Text variant="bodySmall" style={{ textAlign: "center" }} numberOfLines={1}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowCatDialog(false)}>{t("common.cancel", "Cancelar")}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Source Dialog */}
      <Portal>
        <Dialog visible={showSourceDialog} onDismiss={() => setShowSourceDialog(false)}>
          <Dialog.Title>{t("transactions.selectSource", "Selecionar Origem")}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                {t("transactions.bankAccounts", "Contas Bancárias")}
              </Text>
              {accounts.map((acc) => (
                <RadioButton.Item
                  key={acc.id}
                  label={acc.name}
                  value={acc.id}
                  status={!useCard && selectedAccount?.id === acc.id ? "checked" : "unchecked"}
                  onPress={() => {
                    setSelectedAccount(acc);
                    setUseCard(false);
                    setShowSourceDialog(false);
                  }}
                  color={theme.colors.primary}
                />
              ))}

              {type === "expense" && (
                <>
                  <Text variant="titleSmall" style={[styles.sectionTitle, { marginTop: 16 }]}>
                    {t("transactions.creditCards", "Cartões de Crédito")}
                  </Text>
                  {cards.map((card) => (
                    <RadioButton.Item
                      key={card.id}
                      label={card.name}
                      value={card.id}
                      status={useCard && selectedCard?.id === card.id ? "checked" : "unchecked"}
                      onPress={() => {
                        setSelectedCard(card);
                        setUseCard(true);
                        setShowSourceDialog(false);
                      }}
                      color={theme.colors.primary}
                    />
                  ))}
                </>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowSourceDialog(false)}>{t("common.cancel", "Cancelar")}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>{t("transactions.deleteConfirm.title", "Excluir Transação?")}</Dialog.Title>
          <Dialog.Content>
            <Text>{t("transactions.deleteConfirm.message", "Esta ação não pode ser desfeita.")}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>{t("common.cancel", "Cancelar")}</Button>
            <Button onPress={handleDelete} textColor={theme.colors.error}>
              {t("common.delete", "Excluir")}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  segmented: {
    marginBottom: 24,
  },
  amountContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  amountInput: {
    backgroundColor: "transparent",
    minWidth: 150,
    textAlign: "center",
    fontSize: 40,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "white",
  },
  selector: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "white",
  },
  selectorValue: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },
  button: {
    borderRadius: 8,
    marginTop: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "center",
    paddingVertical: 8,
  },
  catItem: {
    width: 70,
    alignItems: "center",
    gap: 4,
  },
  catItemSelected: {
    opacity: 0.5,
    transform: [{ scale: 1.1 }],
  },
  sectionTitle: {
    fontWeight: "bold",
    color: "#666",
    marginLeft: 16,
    marginBottom: 4,
  },
});
