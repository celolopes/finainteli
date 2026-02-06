import { zodResolver } from "@hookform/resolvers/zod";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Appbar, Avatar, Button, Checkbox, Dialog, Divider, HelperText, Portal, RadioButton, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import { DatePickerField } from "../../src/components/DatePickerField";
import { AutocompleteSuggestion, DescriptionAutocomplete } from "../../src/components/DescriptionAutocomplete";
import { GlassAppbar } from "../../src/components/ui/GlassAppbar";
import { FinancialService } from "../../src/services/financial";
import { CurrencyUtils } from "../../src/utils/currency";
import { getLocalISODate } from "../../src/utils/date";

const AndroidDateTimePicker = Platform.OS === "android" ? require("@react-native-community/datetimepicker").default : null;

const createSchema = (t: any) =>
  z.object({
    title: z.string().min(1, t("transactions.validation.titleRequired")),
    amount: z.string().regex(/^[0-9.,]+$/, t("transactions.validation.invalidAmount")),
    type: z.enum(["income", "expense"]),
    category_id: z.string().min(1, "Categoria é obrigatória"),
    account_id: z.string().optional(),
    credit_card_id: z.string().optional(),
    use_card: z.boolean(),
  });

export default function AddTransactionScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();

  const amountInputRef = useRef<any>(null); // Ref for Amount Input

  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Installment State
  const [isInstallment, setIsInstallment] = useState(false);
  const [installments, setInstallments] = useState("2");
  const [installmentMode, setInstallmentMode] = useState<"total" | "parcel">("total");

  // Recurrence State
  const [isRecurring, setIsRecurring] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<"daily" | "weekly" | "biweekly" | "monthly" | "bimonthly" | "semiannual" | "annual">("monthly");
  const [recurrenceCount, setRecurrenceCount] = useState("12");

  const [showCatDialog, setShowCatDialog] = useState(false);
  const [showSourceDialog, setShowSourceDialog] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    if (!selectedDate) {
      setShowDatePicker(false);
      return;
    }
    setDate(selectedDate);
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
  };

  const schema = useMemo(() => createSchema(t), [t]);
  type FormData = z.infer<typeof schema>;

  const { preselectedCardId } = useLocalSearchParams<{ preselectedCardId: string }>();

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
      use_card: !!preselectedCardId,
      credit_card_id: preselectedCardId || "", // Initialize if present
    },
  });

  // Reset form on focus to ensure clean state
  useFocusEffect(
    useCallback(() => {
      // Clean form state when opening "Quick Access"
      const timer = setTimeout(() => {
        reset({
          title: "",
          amount: "",
          type: "expense",
          category_id: "",
          use_card: !!preselectedCardId,
          credit_card_id: preselectedCardId || "",
          account_id: accounts.length > 0 ? accounts[0].id : "",
        });
        setDate(new Date());
        setIsInstallment(false);
        setIsRecurring(false);
        setIsFixed(false);
        setInstallments("2");
        setRecurrenceCount("12");

        // Force focus on amount input
        setTimeout(() => {
          amountInputRef.current?.focus();
        }, 300);
      }, 0);
      return () => clearTimeout(timer);
    }, [reset, preselectedCardId, accounts]),
  );

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

  useEffect(() => {
    const load = async () => {
      const [c, a, cr] = await Promise.all([FinancialService.getCategories(), FinancialService.getAccounts(), FinancialService.getCreditCards()]);
      setCategories(c || []);
      setAccounts(a || []);
      setCards(cr || []);

      if (a && a.length > 0) setValue("account_id", a[0].id);
      if (c && c.length > 0) {
        const firstExpense = c.find((cat) => cat.type === "expense" || cat.type === "both");
        if (firstExpense) setValue("category_id", firstExpense.id);
      }
    };
    load();
  }, [setValue]);

  const insets = useSafeAreaInsets();
  const type = watch("type");
  const categoryId = watch("category_id");
  const useCard = watch("use_card");
  const accountId = watch("account_id");
  const cardId = watch("credit_card_id");

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const selectedCard = cards.find((c) => c.id === cardId);

  // Auto-switch category when type changes
  useEffect(() => {
    if (categories.length > 0 && type) {
      // Check if current category is valid for new type
      const current = categories.find((c) => c.id === categoryId);
      if (current && (current.type === type || current.type === "both")) {
        return; // Valid, keep it
      }

      // Find new default
      const first = categories.find((c) => c.type === type || c.type === "both");
      if (first) setValue("category_id", first.id);
    }
  }, [type, categories]);

  const onSubmit = async (data: FormData) => {
    if (!data.use_card && !data.account_id) {
      Alert.alert(t("common.error"), "Selecione uma conta");
      return;
    }
    if (data.use_card && !data.credit_card_id) {
      Alert.alert(t("common.error"), "Selecione um cartão");
      return;
    }

    setSubmitting(true);
    try {
      // Logic for Installments / Recurrence
      const amountVal = CurrencyUtils.parse(data.amount);
      const baseTransaction = {
        description: data.title,
        amount: amountVal,
        type: data.type,
        account_id: data.use_card ? null : data.account_id,
        credit_card_id: data.use_card ? data.credit_card_id : null,
        category_id: data.category_id,
        transaction_date: getLocalISODate(date),
        status: "completed" as "completed",
        currency_code: "BRL",
        user_id: undefined as any,
      };

      await FinancialService.createComplexTransaction(baseTransaction, {
        isInstallment: data.use_card && isInstallment,
        installments: parseInt(installments) || 1,
        installmentMode,
        isRecurring,
        isFixed,
        recurrenceFreq,
        recurrenceCount: parseInt(recurrenceCount) || 1,
      });

      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert(t("common.error"), t("transactions.validation.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const color = type === "expense" ? theme.colors.error : theme.colors.primary;

  return (
    <Portal.Host>
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <GlassAppbar elevated>
          <Appbar.Action icon="close" onPress={() => router.back()} />
          <Appbar.Content title={t("transactions.newTitle")} />
        </GlassAppbar>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
          <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            {/* Banner Removed per user request */}
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
                      // Only allow digits
                      const raw = text.replace(/\D/g, "");

                      // If empty, reset
                      if (!raw) {
                        onChange("0,00");
                        return;
                      }

                      // Parse as integer
                      const amount = parseInt(raw, 10);

                      // Convert to currency string manually to avoid locale issues on Android/iOS
                      // 595 -> 5,95
                      // 5 -> 0,05
                      const result = (amount / 100).toFixed(2);

                      // Replace dot with comma for PT-BR visuals
                      const formatted = result.replace(".", ",");

                      // Add thousand separators if needed (e.g. 1000,00 -> 1.000,00)
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
                    ref={amountInputRef}
                    autoFocus={true}
                    accessibilityLabel={t("transactions.amount")}
                    aria-label={t("transactions.amount")}
                  />
                )}
              />
            </View>

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
                    placeholder="Ex: Almoço, Uber, Salário..."
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
                  {selectedCategory?.name || "Selecionar"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Source Selector (Account/Card) */}
            <TouchableOpacity onPress={() => setShowSourceDialog(true)} style={[styles.selector, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {t("transactions.source") || "Pago com"}
              </Text>
              <View style={styles.selectorValue}>
                <Avatar.Icon size={32} icon={useCard ? "credit-card" : "bank"} style={{ backgroundColor: theme.colors.surfaceVariant }} />
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                  {useCard ? selectedCard?.name : selectedAccount?.name || "Selecionar"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Date Selector */}
            <View style={styles.formGroup}>
              {Platform.OS === "ios" ? (
                <DatePickerField value={date} onChange={setDate} label="Data" />
              ) : (
                <>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
                    Data
                  </Text>
                  <TouchableOpacity style={[styles.selector, { marginBottom: 0 }]} onPress={() => setShowDatePicker(true)}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <Avatar.Icon size={32} icon="calendar" style={{ backgroundColor: theme.colors.surfaceVariant }} />
                      <Text variant="titleMedium">{date.toLocaleDateString("pt-BR")}</Text>
                    </View>
                  </TouchableOpacity>
                  {showDatePicker && AndroidDateTimePicker && <AndroidDateTimePicker testID="dateTimePicker" value={date} mode="date" is24Hour={true} onChange={onChangeDate} display="default" />}
                </>
              )}
            </View>

            {/* Installment Options (Only for Credit Card) */}
            {useCard && (
              <View style={[styles.optionGroup, { borderColor: theme.colors.outline }]}>
                <TouchableOpacity style={styles.optionHeader} onPress={() => setIsInstallment(!isInstallment)}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Avatar.Icon size={32} icon="calendar-month" style={{ backgroundColor: isInstallment ? theme.colors.primaryContainer : theme.colors.surfaceVariant }} />
                    <Text variant="bodyLarge">Parcelamento</Text>
                  </View>
                  <RadioButton value="yes" status={isInstallment ? "checked" : "unchecked"} onPress={() => setIsInstallment(!isInstallment)} />
                </TouchableOpacity>

                {isInstallment && (
                  <View style={styles.optionBody}>
                    <View style={styles.row}>
                      <Text variant="bodyMedium">Número de Parcelas</Text>
                      <TextInput value={installments} onChangeText={setInstallments} keyboardType="numeric" mode="outlined" style={styles.smallInput} dense contentStyle={{ textAlign: "center" }} />
                    </View>
                    <Divider style={{ marginVertical: 12 }} />
                    <SegmentedButtons
                      value={installmentMode}
                      onValueChange={(v) => setInstallmentMode(v as any)}
                      buttons={[
                        { value: "total", label: "Valor Total" },
                        { value: "parcel", label: "Valor da Parcela" },
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
                    <Text variant="bodyLarge">Lançamento Fixo / Recorrente</Text>
                  </View>
                  <RadioButton value="yes" status={isRecurring ? "checked" : "unchecked"} onPress={() => setIsRecurring(!isRecurring)} />
                </TouchableOpacity>

                {isRecurring && (
                  <View style={styles.optionBody}>
                    <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }} onPress={() => setIsFixed(!isFixed)}>
                      <Checkbox status={isFixed ? "checked" : "unchecked"} onPress={() => setIsFixed(!isFixed)} color={theme.colors.primary} uncheckedColor={theme.colors.onSurface} />
                      <Text variant="bodyLarge">Lançamento Fixo (Sem fim definido)</Text>
                    </TouchableOpacity>

                    <Text style={{ marginBottom: 8 }}>Frequência</Text>
                    <SegmentedButtons
                      value={recurrenceFreq}
                      onValueChange={(v) => setRecurrenceFreq(v as any)}
                      buttons={[
                        { value: "daily", label: "Diário" },
                        { value: "weekly", label: "Semanal" },
                        { value: "biweekly", label: "Quinz." },
                        { value: "monthly", label: "Mensal" },
                      ]}
                      style={{ marginBottom: 8 }}
                    />
                    <SegmentedButtons
                      value={recurrenceFreq}
                      onValueChange={(v) => setRecurrenceFreq(v as any)}
                      buttons={[
                        { value: "bimonthly", label: "Bimestral" },
                        { value: "semiannual", label: "Semestral" },
                        { value: "annual", label: "Anual" },
                      ]}
                      style={{ marginBottom: 8 }}
                    />

                    {!isFixed && (
                      <>
                        <View style={styles.row}>
                          <Text variant="bodyMedium">Validar por (vezes)</Text>
                          <TextInput
                            value={recurrenceCount}
                            onChangeText={setRecurrenceCount}
                            keyboardType="numeric"
                            mode="outlined"
                            style={styles.smallInput}
                            dense
                            contentStyle={{ textAlign: "center" }}
                            aria-label="Contagem de recorrência"
                          />
                        </View>
                        <HelperText type="info" visible>
                          Serão gerados {recurrenceCount} lançamentos futuros.
                        </HelperText>
                      </>
                    )}
                    {isFixed && (
                      <HelperText type="info" visible>
                        Serão gerados lançamentos{" "}
                        {recurrenceFreq === "daily"
                          ? "diários"
                          : recurrenceFreq === "weekly"
                            ? "semanais"
                            : recurrenceFreq === "biweekly"
                              ? "quinzenais"
                              : recurrenceFreq === "monthly"
                                ? "mensais"
                                : recurrenceFreq === "bimonthly"
                                  ? "bimestrais"
                                  : recurrenceFreq === "semiannual"
                                    ? "semestrais"
                                    : "anuais"}{" "}
                        automáticos por tempo indeterminado.
                      </HelperText>
                    )}
                  </View>
                )}
              </View>
            )}

            <Button mode="contained" onPress={handleSubmit(onSubmit)} loading={submitting} style={[styles.saveButton, { backgroundColor: color }]} contentStyle={{ height: 50 }}>
              {t("common.save")}
            </Button>
            <Button mode="outlined" onPress={() => router.back()} style={{ marginTop: 12, borderColor: theme.colors.outline }} textColor={theme.colors.onSurfaceVariant}>
              {t("common.cancel") || "Cancelar"}
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Category Dialog */}
        <Portal>
          <Dialog visible={showCatDialog} onDismiss={() => setShowCatDialog(false)}>
            <Dialog.Title>Escolher Categoria</Dialog.Title>
            <Dialog.ScrollArea>
              <ScrollView contentContainerStyle={styles.dialogGrid}>
                {categories
                  .filter((c) => c.type === "both" || c.type === type)
                  .map((cat) => {
                    const isSelected = categoryId === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.gridItem, isSelected && { backgroundColor: theme.colors.secondaryContainer, borderRadius: 12 }]}
                        onPress={() => {
                          setValue("category_id", cat.id);
                          setShowCatDialog(false);
                        }}
                      >
                        <Avatar.Icon
                          size={48}
                          icon={cat.icon || "circle"}
                          style={{
                            backgroundColor: cat.color || "#ddd",
                            opacity: isSelected ? 1 : 0.8,
                          }}
                          color="white"
                        />
                        <Text
                          variant="bodySmall"
                          numberOfLines={1}
                          style={{
                            color: theme.colors.onSurface,
                            fontWeight: isSelected ? "bold" : "normal",
                            marginTop: 4,
                          }}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                <TouchableOpacity
                  style={styles.gridItem}
                  onPress={() => {
                    setShowCatDialog(false);
                    router.push("/(app)/settings/categories/new" as any);
                  }}
                >
                  <Avatar.Icon size={48} icon="plus" style={{ backgroundColor: theme.colors.surfaceVariant }} color={theme.colors.primary} />
                  <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurface, marginTop: 4 }}>
                    Adicionar
                  </Text>
                </TouchableOpacity>
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
            <Dialog.Title>Selecione a Origem</Dialog.Title>
            <Dialog.ScrollArea>
              <ScrollView>
                <Text variant="titleSmall" style={styles.dialogHeader}>
                  Contas Bancárias
                </Text>
                {accounts.map((acc) => (
                  <TouchableOpacity
                    key={acc.id}
                    onPress={() => {
                      setValue("account_id", acc.id);
                      setValue("use_card", false);
                      setShowSourceDialog(false);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 12,
                      paddingHorizontal: 8,
                      borderRadius: 8,
                      backgroundColor: !useCard && accountId === acc.id ? theme.colors.secondaryContainer : "transparent",
                    }}
                  >
                    <Avatar.Icon size={40} icon="bank" style={{ backgroundColor: theme.colors.primaryContainer, marginRight: 12 }} color={theme.colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyLarge" style={{ fontWeight: "600" }}>
                        {acc.name}
                      </Text>
                      <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                        Saldo: {CurrencyUtils.format(acc.current_balance || 0, acc.currency_code)}
                      </Text>
                    </View>
                    {!useCard && accountId === acc.id && <Avatar.Icon size={24} icon="check" style={{ backgroundColor: "transparent" }} color={theme.colors.primary} />}
                  </TouchableOpacity>
                ))}

                {type === "expense" && cards.length > 0 && (
                  <>
                    <Text variant="titleSmall" style={[styles.dialogHeader, { marginTop: 16 }]}>
                      Cartões de Crédito
                    </Text>
                    {cards.map((card) => (
                      <TouchableOpacity
                        key={card.id}
                        onPress={() => {
                          setValue("credit_card_id", card.id);
                          setValue("use_card", true);
                          setShowSourceDialog(false);
                        }}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 12,
                          paddingHorizontal: 8,
                          borderRadius: 8,
                          backgroundColor: useCard && cardId === card.id ? theme.colors.secondaryContainer : "transparent",
                        }}
                      >
                        <Avatar.Icon size={40} icon="credit-card" style={{ backgroundColor: theme.colors.errorContainer, marginRight: 12 }} color={theme.colors.error} />
                        <View style={{ flex: 1 }}>
                          <Text variant="bodyLarge" style={{ fontWeight: "600" }}>
                            {card.name}
                          </Text>
                          <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                            Limite: {CurrencyUtils.format(card.available_limit || card.credit_limit, card.currency_code)}
                          </Text>
                        </View>
                        {useCard && cardId === card.id && <Avatar.Icon size={24} icon="check" style={{ backgroundColor: "transparent" }} color={theme.colors.primary} />}
                      </TouchableOpacity>
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
    </Portal.Host>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
  },
  trustBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    opacity: 0.7,
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  trustDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(18, 18, 18, 0.1)",
    marginHorizontal: 12,
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
  title: {
    fontWeight: "bold",
    marginBottom: 8,
    lineHeight: 28,
  },
  subtitle: {
    opacity: 0.7,
    marginBottom: 24,
    lineHeight: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: "500",
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 16,
    lineHeight: 24,
  },
  securityText: {
    fontSize: 10,
    opacity: 0.6,
    lineHeight: 14,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  input: {
    // Removed fixed white bg
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
    width: "30%", // 3 columns
    minWidth: 80,
    alignItems: "center",
    marginBottom: 6,
    paddingVertical: 8,
    gap: 4,
  },
  dialogHeader: {
    marginVertical: 8,
    opacity: 0.6,
    fontWeight: "bold",
  },
  optionGroup: {
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  optionHeader: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionBody: {
    padding: 16,
    paddingTop: 0,
  },
  smallInput: {
    width: 64,
    height: 40,
    backgroundColor: "transparent",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
