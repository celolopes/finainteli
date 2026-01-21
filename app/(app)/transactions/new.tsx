import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Appbar, Avatar, Button, Dialog, Portal, RadioButton, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";
import { FinancialService } from "../../../src/services/financial";
import { Database } from "../../../src/types/schema";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Account = Database["public"]["Tables"]["bank_accounts"]["Row"];
type Card = Database["public"]["Tables"]["credit_cards"]["Row"];

export default function NewTransaction() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("expense"); // income, expense, transfer
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]); // YYYY-MM-DD

  // Data Sources
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<Card[]>([]);

  // Selections
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [useCard, setUseCard] = useState(false); // Toggle between Account/Card

  // Dialogs Visibility
  const [showCatDialog, setShowCatDialog] = useState(false);
  const [showSourceDialog, setShowSourceDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cats, accs, crds] = await Promise.all([FinancialService.getCategories(), FinancialService.getAccounts(), FinancialService.getCreditCards()]);
      setCategories(cats || []);
      setAccounts(accs || []);
      setCards(crds || []);

      // Defaults
      if (accs && accs.length > 0) setSelectedAccount(accs[0]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (!amount || !description || !selectedCategory) return;
    if (!useCard && !selectedAccount) return;
    if (useCard && !selectedCard) return;

    setLoading(true);
    try {
      const value = parseFloat(amount.replace(",", "."));
      const transactionData = {
        type: type as any,
        amount: value,
        description,
        transaction_date: date,
        category_id: selectedCategory.id,
        account_id: useCard ? null : selectedAccount!.id,
        credit_card_id: useCard ? selectedCard!.id : null,
        currency_code: "BRL", // TODO: Get from account
        user_id: undefined as any, // Supabase auth handles
        status: "completed" as any,
        // Optional fields required by TS type
        destination_account_id: null,
        notes: null,
        is_installment: false,
        installment_number: null,
        total_installments: null,
        parent_transaction_id: null,
        tags: null,
        location: null,
        attachments: null,
      };

      await FinancialService.createTransaction(transactionData);
      router.back();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const color = type === "expense" ? theme.colors.error : theme.colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t("dashboard.actions.transaction") || "Nova Transação"} />
      </Appbar.Header>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Type Selector */}
          <SegmentedButtons
            value={type}
            onValueChange={setType}
            buttons={[
              { value: "expense", label: t("dashboard.expense") || "Despesa", style: type === "expense" ? { backgroundColor: theme.colors.errorContainer } : undefined },
              { value: "income", label: t("dashboard.income") || "Receita", style: type === "income" ? { backgroundColor: theme.colors.primaryContainer } : undefined },
              // Transfer not implemented yet simplicity
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
              autoFocus
            />
          </View>

          {/* Description */}
          <TextInput label="Descrição" value={description} onChangeText={setDescription} mode="outlined" style={styles.input} placeholder="Ex: Almoço, Uber..." />

          {/* Category Selection */}
          <TouchableOpacity onPress={() => setShowCatDialog(true)} style={styles.selector}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              Categoria
            </Text>
            <View style={styles.selectorValue}>
              <Avatar.Icon size={32} icon={selectedCategory?.icon || "help"} style={{ backgroundColor: selectedCategory?.color || theme.colors.surfaceVariant }} />
              <Text variant="titleMedium">{selectedCategory?.name || "Selecionar"}</Text>
              <Avatar.Icon size={24} icon="chevron-down" style={{ backgroundColor: "transparent" }} color={theme.colors.onSurface} />
            </View>
          </TouchableOpacity>

          {/* Account/Card Selection */}
          <TouchableOpacity onPress={() => setShowSourceDialog(true)} style={styles.selector}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              {type === "expense" ? "Pago com" : "Recebido em"}
            </Text>
            <View style={styles.selectorValue}>
              <Avatar.Icon size={32} icon={useCard ? "credit-card" : "bank"} style={{ backgroundColor: (useCard ? selectedCard?.color : selectedAccount?.color) || theme.colors.surfaceVariant }} />
              <Text variant="titleMedium">{useCard ? selectedCard?.name || "Selecionar Cartão" : selectedAccount?.name || "Selecionar Conta"}</Text>
              <Avatar.Icon size={24} icon="chevron-down" style={{ backgroundColor: "transparent" }} color={theme.colors.onSurface} />
            </View>
          </TouchableOpacity>

          {/* Date Input (Simple Text for now) */}
          <TextInput label="Data (YYYY-MM-DD)" value={date} onChangeText={setDate} mode="outlined" style={styles.input} />

          <Button mode="contained" onPress={handleSave} loading={loading} style={[styles.button, { backgroundColor: color }]} contentStyle={{ height: 50 }}>
            Salvar Transação
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Dialog */}
      <Portal>
        <Dialog visible={showCatDialog} onDismiss={() => setShowCatDialog(false)} style={{ maxHeight: "80%" }}>
          <Dialog.Title>Selecionar Categoria</Dialog.Title>
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
            <Button onPress={() => setShowCatDialog(false)}>Cancelar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Source Dialog */}
      <Portal>
        <Dialog visible={showSourceDialog} onDismiss={() => setShowSourceDialog(false)}>
          <Dialog.Title>Selecionar Origem</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Contas Bancárias
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
                    Cartões de Crédito
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
            <Button onPress={() => setShowSourceDialog(false)}>Cancelar</Button>
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
    opacity: 0.5, // Highlight
    transform: [{ scale: 1.1 }],
  },
  sectionTitle: {
    fontWeight: "bold",
    color: "#666",
    marginLeft: 16,
    marginBottom: 4,
  },
});
