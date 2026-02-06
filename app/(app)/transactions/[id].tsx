import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Appbar, Avatar, Button, Dialog, Divider, HelperText, Portal, RadioButton, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import { AutocompleteSuggestion, DescriptionAutocomplete } from "../../../src/components/DescriptionAutocomplete";
import { GlassAppbar } from "../../../src/components/ui/GlassAppbar";
import { FinancialService } from "../../../src/services/financial";
import { DetailedTransaction } from "../../../src/types";
import { Database } from "../../../src/types/schema";
import { CurrencyUtils } from "../../../src/utils/currency";
import { getLocalISODate, parseLocalISODate } from "../../../src/utils/date";

type Category = Database["public"]["Tables"]["categories"]["Row"];
type Account = Database["public"]["Tables"]["bank_accounts"]["Row"];
type Card = Database["public"]["Tables"]["credit_cards"]["Row"];
type Transaction = DetailedTransaction;

const createSchema = (t: any) =>
  z.object({
    title: z.string().min(1, t("transactions.validation.titleRequired") || "Descrição obrigatória"),
    amount: z.string().regex(/^\d+(?:[.,]\d{1,2})?$/, t("transactions.validation.invalidAmount") || "Valor inválido"),
    type: z.enum(["income", "expense"]),
    category_id: z.string().min(1, t("transactions.validation.categoryRequired") || "Categoria obrigatória"),
    account_id: z.string().optional(),
    credit_card_id: z.string().optional(),
    use_card: z.boolean(),
  });

export default function TransactionDetails() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalTransaction, setOriginalTransaction] = useState<Transaction | null>(null);

  // Data Sources
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<Card[]>([]);

  // States for Installment/Recurrence (Matching Add Screen)
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState("2");
  const [installmentMode, setInstallmentMode] = useState<"total" | "parcel">("total");

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<"weekly" | "biweekly" | "monthly" | "bimonthly" | "semiannual" | "annual">("monthly");
  const [recurrenceCount, setRecurrenceCount] = useState("12");

  // Dialogs & UI State
  const [showCatDialog, setShowCatDialog] = useState(false);
  const [showSourceDialog, setShowSourceDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const schema = useMemo(() => createSchema(t), [t]);
  type FormData = z.infer<typeof schema>;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      amount: "",
      type: "expense",
      category_id: "",
      use_card: false,
      credit_card_id: "",
      account_id: "",
    },
  });

  const type = watch("type");
  const categoryId = watch("category_id");
  const useCard = watch("use_card");
  const accountId = watch("account_id");
  const cardId = watch("credit_card_id");

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const selectedCard = cards.find((c) => c.id === cardId);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [cats, accs, crds] = await Promise.all([FinancialService.getCategories(), FinancialService.getAccounts(), FinancialService.getCreditCards()]);
      setCategories(cats || []);
      setAccounts(accs || []);
      setCards(crds || []);

      if (id) {
        const txn = await FinancialService.getTransactionById(id);
        if (txn) {
          // Fill Form
          const formattedAmount = CurrencyUtils.format(txn.amount).replace("R$", "").trim();
          reset({
            title: txn.description || "",
            amount: formattedAmount,
            type: txn.type as "income" | "expense",
            category_id: txn.category_id || "",
            use_card: !!txn.credit_card_id,
            credit_card_id: txn.credit_card_id || "",
            account_id: txn.account_id || "",
          });
          // Use parseLocalISODate to avoid timezone issues when loading YYYY-MM-DD strings
          setDate(parseLocalISODate(txn.transaction_date.split("T")[0]));
          setOriginalTransaction(txn);
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t("common.error"), "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionSelect = (suggestion: AutocompleteSuggestion) => {
    if (suggestion.category_id) setValue("category_id", suggestion.category_id);
    if (suggestion.type) setValue("type", suggestion.type as "income" | "expense");

    if (suggestion.credit_card_id) {
      setValue("use_card", true);
      setValue("credit_card_id", suggestion.credit_card_id);
    } else if (suggestion.account_id) {
      setValue("use_card", false);
      setValue("account_id", suggestion.account_id);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === "ios");
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    setDate(currentDate);
  };

  const onSubmit = async (data: FormData) => {
    if (!id) return;

    if (!data.use_card && !data.account_id) {
      Alert.alert(t("common.error"), t("transactions.selectSource"));
      return;
    }
    if (data.use_card && !data.credit_card_id) {
      Alert.alert(t("common.error"), t("transactions.selectCard"));
      return;
    }

    setSaving(true);
    try {
      const amountVal = CurrencyUtils.parse(data.amount);

      const updates: any = {
        description: data.title,
        amount: amountVal,
        type: data.type,
        account_id: data.use_card ? null : data.account_id,
        credit_card_id: data.use_card ? data.credit_card_id : null,
        category_id: data.category_id,
        // Use getLocalISODate to preserve local date without UTC conversion
        transaction_date: getLocalISODate(date),
      };

      const complexOptions = {
        isInstallment: data.use_card && isInstallment,
        installments: parseInt(installments) || 1,
        installmentMode,
        isRecurring: !isInstallment && isRecurring,
        recurrenceFreq,
        recurrenceCount: parseInt(recurrenceCount) || 1,
      };

      if ((complexOptions.isInstallment && complexOptions.installments > 1) || (complexOptions.isRecurring && complexOptions.recurrenceCount > 1)) {
        await FinancialService.updateTransactionToComplex(id, updates, complexOptions);
      } else {
        await FinancialService.updateTransaction(id, updates);
      }
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert(t("common.error"), t("transactions.validation.saveError") || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (deleteAllFuture: boolean = false) => {
    if (!id) return;
    setShowDeleteDialog(false);
    try {
      await FinancialService.deleteTransaction(id, { deleteAllFuture });
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
      <GlassAppbar elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t("transactions.edit")} />
        <Appbar.Action icon="delete" onPress={() => setShowDeleteDialog(true)} />
      </GlassAppbar>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
          {/* Type Selector */}
          <View style={styles.formGroup}>
            <Controller
              control={control}
              name="type"
              render={({ field: { value, onChange } }) => (
                <SegmentedButtons
                  value={value}
                  onValueChange={onChange}
                  buttons={[
                    {
                      value: "expense",
                      label: t("dashboard.expense"),
                      icon: "arrow-down-circle-outline",
                      style: value === "expense" ? { backgroundColor: theme.colors.errorContainer, borderColor: theme.colors.error } : undefined,
                    },
                    {
                      value: "income",
                      label: t("dashboard.income"),
                      icon: "arrow-up-circle-outline",
                      style: value === "income" ? { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.primary } : undefined,
                    },
                  ]}
                  style={styles.segmentedButton}
                />
              )}
            />
          </View>

          {/* Amount Input */}
          <View style={styles.amountContainer}>
            <Text variant="displaySmall" style={{ color: color, fontWeight: "bold" }}>
              R$
            </Text>
            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  value={value || "0,00"}
                  onChangeText={(text) => {
                    const raw = text.replace(/\D/g, "");
                    if (!raw) {
                      onChange("0,00");
                      return;
                    }
                    const amount = parseInt(raw, 10);
                    const result = (amount / 100).toFixed(2);
                    const formatted = result.replace(".", ",");
                    const parts = formatted.split(",");
                    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                    const finalString = parts.join(",");
                    onChange(finalString);
                  }}
                  keyboardType="numeric"
                  placeholder="0,00"
                  placeholderTextColor={theme.colors.onSurfaceDisabled}
                  style={[styles.amountInput, { color: color }]}
                  contentStyle={{ fontSize: 40, fontWeight: "bold", color: color }}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                  caretHidden={true}
                  error={!!errors.amount}
                />
              )}
            />
          </View>

          {/* Description Autocomplete */}
          <View style={styles.formGroup}>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, value } }) => (
                <DescriptionAutocomplete
                  value={value}
                  onChangeText={onChange}
                  onSelectSuggestion={handleSuggestionSelect}
                  label={t("transactions.description")}
                  placeholder={t("transactions.descriptionPlaceholder")}
                />
              )}
            />
            <HelperText type="error" visible={!!errors.title}>
              {errors.title?.message}
            </HelperText>
          </View>

          {/* Category Selector */}
          <TouchableOpacity onPress={() => setShowCatDialog(true)} style={[styles.selector, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t("transactions.category")}
            </Text>
            <View style={styles.selectorValue}>
              <Avatar.Icon size={32} icon={selectedCategory?.icon || "help"} style={{ backgroundColor: selectedCategory?.color || theme.colors.surfaceVariant }} />
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                {selectedCategory?.name || t("common.select")}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Source Selector (Account/Card) */}
          <TouchableOpacity onPress={() => setShowSourceDialog(true)} style={[styles.selector, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t("transactions.source")}
            </Text>
            <View style={styles.selectorValue}>
              <Avatar.Icon size={32} icon={useCard ? "credit-card" : "bank"} style={{ backgroundColor: theme.colors.surfaceVariant }} />
              <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                {useCard ? selectedCard?.name : selectedAccount?.name || t("common.select")}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Date Selector */}
          <View style={styles.formGroup}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
              {t("common.date")}
            </Text>
            <TouchableOpacity style={[styles.selector, { marginBottom: 0 }]} onPress={() => setShowDatePicker(true)}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Avatar.Icon size={32} icon="calendar" style={{ backgroundColor: theme.colors.surfaceVariant }} />
                <Text variant="titleMedium">{date.toLocaleDateString("pt-BR")}</Text>
              </View>
            </TouchableOpacity>
            {showDatePicker && <DateTimePicker testID="dateTimePicker" value={date} mode="date" is24Hour={true} onChange={onChangeDate} display={Platform.OS === "ios" ? "spinner" : "default"} />}
            {Platform.OS === "ios" && showDatePicker && <Button onPress={() => setShowDatePicker(false)}>{t("common.confirm")}</Button>}
          </View>

          {/* Installment Options (Only for Credit Card) */}
          {useCard && (
            <View style={[styles.optionGroup, { borderColor: theme.colors.outline, marginTop: 16 }]}>
              <TouchableOpacity style={styles.optionHeader} onPress={() => setIsInstallment(!isInstallment)}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Avatar.Icon size={32} icon="calendar-month" style={{ backgroundColor: isInstallment ? theme.colors.primaryContainer : theme.colors.surfaceVariant }} />
                  <Text variant="bodyLarge">{t("transactions.installments")}</Text>
                </View>
                <RadioButton value="yes" status={isInstallment ? "checked" : "unchecked"} onPress={() => setIsInstallment(!isInstallment)} />
              </TouchableOpacity>

              {isInstallment && (
                <View style={styles.optionBody}>
                  <View style={styles.row}>
                    <Text>{t("transactions.installmentCount")}</Text>
                    <TextInput value={installments} onChangeText={setInstallments} keyboardType="numeric" style={styles.smallInput} dense />
                  </View>
                  <Divider style={{ marginVertical: 12 }} />
                  <SegmentedButtons
                    value={installmentMode}
                    onValueChange={(v) => setInstallmentMode(v as any)}
                    buttons={[
                      { value: "total", label: t("transactions.installmentTotal") },
                      { value: "parcel", label: t("transactions.installmentParcel") },
                    ]}
                  />
                  <HelperText type="info" visible>
                    {installmentMode === "total"
                      ? `Serão ${installments}x de ${CurrencyUtils.format(CurrencyUtils.parse(watch("amount") || "0") / (parseInt(installments) || 1))}`
                      : `Total será ${CurrencyUtils.format(CurrencyUtils.parse(watch("amount") || "0") * (parseInt(installments) || 1))}`}
                  </HelperText>
                </View>
              )}
            </View>
          )}

          {/* Recurrence Options (Fixed Launch) */}
          {!isInstallment && (
            <View style={[styles.optionGroup, { borderColor: theme.colors.outline, marginTop: 16 }]}>
              <TouchableOpacity style={styles.optionHeader} onPress={() => setIsRecurring(!isRecurring)}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Avatar.Icon size={32} icon="update" style={{ backgroundColor: isRecurring ? theme.colors.tertiaryContainer : theme.colors.surfaceVariant }} />
                  <Text variant="bodyLarge">{t("transactions.recurrence")}</Text>
                </View>
                <RadioButton value="yes" status={isRecurring ? "checked" : "unchecked"} onPress={() => setIsRecurring(!isRecurring)} />
              </TouchableOpacity>

              {isRecurring && (
                <View style={styles.optionBody}>
                  <Text style={{ marginBottom: 8 }}>{t("transactions.recurrenceFreq")}</Text>
                  <SegmentedButtons
                    value={recurrenceFreq}
                    onValueChange={(v) => setRecurrenceFreq(v as any)}
                    buttons={[
                      { value: "weekly", label: t("transactions.recurrenceWeekly").substring(0, 5) },
                      { value: "monthly", label: t("transactions.recurrenceMonthly") },
                      { value: "bimonthly", label: t("transactions.recurrenceBimonthly").substring(0, 6) },
                    ]}
                    style={{ marginBottom: 8 }}
                  />
                  <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 12 }}>
                    {["daily", "biweekly", "semiannual", "annual"].map((opt) => (
                      <TouchableOpacity key={opt} onPress={() => setRecurrenceFreq(opt as any)}>
                        <Text
                          style={{
                            color: recurrenceFreq === opt ? theme.colors.primary : theme.colors.onSurfaceVariant,
                            fontWeight: recurrenceFreq === opt ? "bold" : "normal",
                          }}
                        >
                          {t(`transactions.recurrence${opt.charAt(0).toUpperCase() + opt.slice(1)}`)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.row}>
                    <Text>{t("transactions.recurrenceCount")}</Text>
                    <TextInput value={recurrenceCount} onChangeText={setRecurrenceCount} keyboardType="numeric" style={styles.smallInput} dense />
                  </View>
                  <HelperText type="info" visible>
                    {`Serão gerados ${recurrenceCount} lançamentos futuros.`}
                  </HelperText>
                </View>
              )}
            </View>
          )}

          {/* Save Button */}
          <Button mode="contained" onPress={handleSubmit(onSubmit)} loading={saving} style={[styles.saveButton, { backgroundColor: color }]} contentStyle={{ height: 50 }}>
            {t("common.save")}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Dialog */}
      <Portal>
        <Dialog visible={showCatDialog} onDismiss={() => setShowCatDialog(false)} style={{ maxHeight: "70%" }}>
          <Dialog.Title>{t("transactions.selectCategory")}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={styles.dialogGrid}>
              {categories
                .filter((c) => c.type === "both" || c.type === type)
                .map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.gridItem}
                    onPress={() => {
                      setValue("category_id", cat.id);
                      setShowCatDialog(false);
                    }}
                  >
                    <Avatar.Icon size={48} icon={cat.icon || "circle"} style={{ backgroundColor: cat.color || "#ddd" }} />
                    <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurface }}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowCatDialog(false)}>{t("common.cancel")}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Source Dialog */}
      <Portal>
        <Dialog visible={showSourceDialog} onDismiss={() => setShowSourceDialog(false)}>
          <Dialog.Title>{t("transactions.selectSource")}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <Text variant="titleSmall" style={styles.dialogHeader}>
                {t("transactions.accounts")}
              </Text>
              {accounts.map((acc) => (
                <RadioButton.Item
                  key={acc.id}
                  label={acc.name}
                  value={acc.id}
                  status={!useCard && accountId === acc.id ? "checked" : "unchecked"}
                  onPress={() => {
                    setValue("account_id", acc.id);
                    setValue("use_card", false);
                    setShowSourceDialog(false);
                  }}
                  color={theme.colors.primary}
                />
              ))}

              {type === "expense" && cards.length > 0 && (
                <>
                  <Text variant="titleSmall" style={[styles.dialogHeader, { marginTop: 16 }]}>
                    {t("transactions.cards")}
                  </Text>
                  {cards.map((card) => (
                    <RadioButton.Item
                      key={card.id}
                      label={card.name}
                      value={card.id}
                      status={useCard && cardId === card.id ? "checked" : "unchecked"}
                      onPress={() => {
                        setValue("credit_card_id", card.id);
                        setValue("use_card", true);
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
            <Button onPress={() => setShowSourceDialog(false)}>{t("common.cancel")}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>{t("transactions.deleteConfirm.title") || "Excluir Transação"}</Dialog.Title>
          <Dialog.Content>
            <Text>{t("transactions.deleteConfirm.message") || "Tem certeza que deseja excluir esta transação?"}</Text>
            {(originalTransaction?.is_installment || originalTransaction?.description?.includes("(Rec.)") || originalTransaction?.description?.includes("(Fixo)")) && (
              <Text style={{ marginTop: 12, fontWeight: "bold", color: theme.colors.primary }}>Esta é uma transação recorrente ou parcelada.</Text>
            )}
          </Dialog.Content>
          <Dialog.Actions style={{ flexDirection: "column", alignItems: "stretch", paddingHorizontal: 16, paddingBottom: 16 }}>
            {originalTransaction?.is_installment || originalTransaction?.description?.includes("(Rec.)") || originalTransaction?.description?.includes("(Fixo)") ? (
              <>
                <Button mode="contained" onPress={() => handleDelete(true)} style={{ marginBottom: 8 }} buttonColor={theme.colors.error}>
                  Excluir esta e todas as futuras
                </Button>
                <Button mode="outlined" onPress={() => handleDelete(false)} style={{ marginBottom: 8 }} textColor={theme.colors.error}>
                  Excluir apenas esta
                </Button>
              </>
            ) : (
              <Button mode="contained" onPress={() => handleDelete(false)} style={{ marginBottom: 8 }} buttonColor={theme.colors.error}>
                {t("common.delete") || "Excluir"}
              </Button>
            )}
            <Button onPress={() => setShowDeleteDialog(false)}>{t("common.cancel") || "Cancelar"}</Button>
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
    padding: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  segmentedButton: {
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  amountInput: {
    backgroundColor: "transparent",
    minWidth: 150,
    textAlign: "center",
  },
  selector: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  selectorValue: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 12,
  },
  saveButton: {
    marginTop: 24,
    borderRadius: 8,
  },
  dialogGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 16,
  },
  gridItem: {
    width: 75,
    alignItems: "center",
    gap: 4,
  },
  dialogHeader: {
    marginVertical: 8,
    opacity: 0.6,
    fontWeight: "bold",
  },
  optionGroup: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
  },
  optionHeader: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionBody: {
    padding: 16,
    backgroundColor: "rgba(18, 18, 18, 0.02)",
  },
  smallInput: {
    width: 60,
    backgroundColor: "transparent",
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
