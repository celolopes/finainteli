import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Appbar, Avatar, Button, Dialog, Portal, RadioButton, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";
import { DatePickerField } from "../../../src/components/DatePickerField";
import { AutocompleteSuggestion, DescriptionAutocomplete } from "../../../src/components/DescriptionAutocomplete";
import { GlassAppbar } from "../../../src/components/ui/GlassAppbar";
import { useBudgetMonitor } from "../../../src/hooks/useBudgetMonitor";
import { FinancialService } from "../../../src/services/financial";
import { Database } from "../../../src/types/schema";
import { getLocalISODate } from "../../../src/utils/date";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Account = Database["public"]["Tables"]["bank_accounts"]["Row"];
type Card = Database["public"]["Tables"]["credit_cards"]["Row"];

export default function NewTransaction() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { checkBudgets } = useBudgetMonitor();

  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<Card[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [useCard, setUseCard] = useState(false);

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
      if (accs && accs.length > 0) setSelectedAccount(accs[0]);
    } catch (e) {
      console.error(e);
    }
  };

  // Handler para quando o usuário seleciona uma sugestão do autocomplete
  const handleSelectSuggestion = (suggestion: AutocompleteSuggestion) => {
    // Preencher categoria
    if (suggestion.category_id && suggestion.category) {
      const cat = categories.find((c) => c.id === suggestion.category_id);
      if (cat) setSelectedCategory(cat);
    }

    // Preencher conta ou cartão
    if (suggestion.credit_card_id && suggestion.card) {
      const card = cards.find((c) => c.id === suggestion.credit_card_id);
      if (card) {
        setSelectedCard(card);
        setUseCard(true);
      }
    } else if (suggestion.account_id && suggestion.account) {
      const acc = accounts.find((a) => a.id === suggestion.account_id);
      if (acc) {
        setSelectedAccount(acc);
        setUseCard(false);
      }
    }

    // Ajustar tipo se necessário
    if (suggestion.type && (suggestion.type === "income" || suggestion.type === "expense")) {
      setType(suggestion.type);
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
        transaction_date: getLocalISODate(selectedDate),
        category_id: selectedCategory.id,
        account_id: useCard ? null : selectedAccount!.id,
        credit_card_id: useCard ? selectedCard!.id : null,
        currency_code: "BRL",
        status: "completed" as any,
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

      // Verificar orçamentos após criar despesa (dispara notificação se limite atingido)
      if (type === "expense") {
        checkBudgets();
      }

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
      <GlassAppbar elevated style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t("transactions.newTitle")} />
      </GlassAppbar>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {/* Type Selector */}
          <SegmentedButtons
            value={type}
            onValueChange={setType}
            buttons={[
              {
                value: "expense",
                label: t("dashboard.expense"),
                style: type === "expense" ? { backgroundColor: theme.colors.errorContainer } : undefined,
              },
              {
                value: "income",
                label: t("dashboard.income"),
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
              autoFocus
            />
          </View>

          {/* Description with Autocomplete */}
          <DescriptionAutocomplete
            value={description}
            onChangeText={setDescription}
            onSelectSuggestion={handleSelectSuggestion}
            label={t("transactions.description")}
            placeholder={t("transactions.descriptionPlaceholder")}
          />

          {/* Category Selection */}
          <TouchableOpacity onPress={() => setShowCatDialog(true)} style={[styles.selector, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              {t("transactions.category")}
            </Text>
            <View style={styles.selectorValue}>
              <Avatar.Icon size={32} icon={selectedCategory?.icon || "help"} style={{ backgroundColor: selectedCategory?.color || theme.colors.surface }} />
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, flex: 1 }}>
                {selectedCategory?.name || t("common.select")}
              </Text>
              <Avatar.Icon size={24} icon="chevron-down" style={{ backgroundColor: "transparent" }} color={theme.colors.onSurfaceVariant} />
            </View>
          </TouchableOpacity>

          {/* Account/Card Selection */}
          <TouchableOpacity onPress={() => setShowSourceDialog(true)} style={[styles.selector, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]}>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              {type === "expense" ? t("transactions.payWith") : t("transactions.receivedIn")}
            </Text>
            <View style={styles.selectorValue}>
              <Avatar.Icon size={32} icon={useCard ? "credit-card" : "bank"} style={{ backgroundColor: (useCard ? selectedCard?.color : selectedAccount?.color) || theme.colors.surface }} />
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface, flex: 1 }}>
                {useCard ? selectedCard?.name || t("transactions.selectCard") : selectedAccount?.name || t("transactions.selectAccount")}
              </Text>
              <Avatar.Icon size={24} icon="chevron-down" style={{ backgroundColor: "transparent" }} color={theme.colors.onSurfaceVariant} />
            </View>
          </TouchableOpacity>

          {/* Date Picker */}
          <DatePickerField value={selectedDate} onChange={setSelectedDate} label={t("common.date")} />

          <Button mode="contained" onPress={handleSave} loading={loading} style={styles.button} buttonColor={color} textColor={theme.colors.onError} contentStyle={{ height: 50 }}>
            {t("common.save")}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Dialog */}
      <Portal>
        <Dialog visible={showCatDialog} onDismiss={() => setShowCatDialog(false)} style={{ maxHeight: "80%", backgroundColor: theme.colors.surface }}>
          <Dialog.Title>{t("transactions.selectCategory")}</Dialog.Title>
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
                      <Avatar.Icon size={40} icon={cat.icon || "circle"} style={{ backgroundColor: cat.color || theme.colors.surfaceVariant }} />
                      <Text variant="bodySmall" style={{ textAlign: "center", color: theme.colors.onSurface }} numberOfLines={1}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowCatDialog(false)}>{t("common.cancel")}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Source Dialog */}
      <Portal>
        <Dialog visible={showSourceDialog} onDismiss={() => setShowSourceDialog(false)} style={{ backgroundColor: theme.colors.surface }}>
          <Dialog.Title>{t("transactions.selectSource")}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
                {t("transactions.accounts")}
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
                  labelStyle={{ color: theme.colors.onSurface }}
                />
              ))}

              {type === "expense" && (
                <>
                  <Text variant="titleSmall" style={[styles.sectionTitle, { marginTop: 16, color: theme.colors.onSurfaceVariant }]}>
                    {t("transactions.cards")}
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
                      labelStyle={{ color: theme.colors.onSurface }}
                    />
                  ))}
                </>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowSourceDialog(false)}>{t("common.cancel")}</Button>
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
  },
  selector: {
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  selectorValue: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },
  button: {
    borderRadius: 12,
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
    marginLeft: 16,
    marginBottom: 4,
  },
});
