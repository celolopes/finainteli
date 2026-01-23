import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Avatar, Button, Dialog, HelperText, Portal, RadioButton, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import { FinancialService } from "../../src/services/financial";
import { CurrencyUtils } from "../../src/utils/currency";

const createSchema = (t: any) =>
  z.object({
    title: z.string().min(1, t("transactions.validation.titleRequired")),
    amount: z.string().regex(/^\d+(?:[.,]\d{1,2})?$/, t("transactions.validation.invalidAmount")),
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

  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [showCatDialog, setShowCatDialog] = useState(false);
  const [showSourceDialog, setShowSourceDialog] = useState(false);

  const schema = useMemo(() => createSchema(t), [t]);
  type FormData = z.infer<typeof schema>;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      amount: "",
      type: "expense",
      category_id: "",
      use_card: false,
    },
  });

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
      await FinancialService.createTransaction({
        description: data.title,
        amount: CurrencyUtils.parse(data.amount),
        type: data.type,
        account_id: data.use_card ? null : data.account_id,
        credit_card_id: data.use_card ? data.credit_card_id : null,
        category_id: data.category_id,
        transaction_date: new Date().toISOString(),
        status: "completed",
        currency_code: "BRL", // Todo: fallback based on account
        user_id: undefined as any,
      } as any);
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
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen options={{ title: t("transactions.newTitle"), presentation: "modal", headerShown: true }} />
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}>
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
                    style: value === "expense" ? { backgroundColor: theme.colors.errorContainer } : undefined,
                  },
                  {
                    value: "income",
                    label: t("dashboard.income"),
                    icon: "arrow-up-circle-outline",
                    style: value === "income" ? { backgroundColor: theme.colors.primaryContainer } : undefined,
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
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                placeholder="0,00"
                style={styles.amountInput}
                contentStyle={{ fontSize: 40, fontWeight: "bold", color: color }}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                error={!!errors.amount}
              />
            )}
          />
        </View>

        <View style={styles.formGroup}>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label={t("transactions.description")}
                value={value}
                onChangeText={onChange}
                mode="outlined"
                style={styles.input}
                error={!!errors.title}
                placeholder="Ex: Almoço, Uber, Salário..."
              />
            )}
          />
          <HelperText type="error" visible={!!errors.title}>
            {errors.title?.message}
          </HelperText>
        </View>

        {/* Category Selector */}
        <TouchableOpacity onPress={() => setShowCatDialog(true)} style={styles.selector}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {t("transactions.category")}
          </Text>
          <View style={styles.selectorValue}>
            <Avatar.Icon size={32} icon={selectedCategory?.icon || "help"} style={{ backgroundColor: selectedCategory?.color || theme.colors.surfaceVariant }} />
            <Text variant="titleMedium">{selectedCategory?.name || "Selecionar"}</Text>
          </View>
        </TouchableOpacity>

        {/* Source Selector (Account/Card) */}
        <TouchableOpacity onPress={() => setShowSourceDialog(true)} style={styles.selector}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {type === "expense" ? "Pago com" : "Recebido em"}
          </Text>
          <View style={styles.selectorValue}>
            <Avatar.Icon size={32} icon={useCard ? "credit-card" : "bank"} style={{ backgroundColor: (useCard ? selectedCard?.color : selectedAccount?.color) || theme.colors.surfaceVariant }} />
            <Text variant="titleMedium">{useCard ? selectedCard?.name || "Selecionar Cartão" : selectedAccount?.name || "Selecionar Conta"}</Text>
          </View>
        </TouchableOpacity>

        <Button mode="contained" onPress={handleSubmit(onSubmit)} loading={submitting} style={[styles.saveButton, { backgroundColor: color }]} contentStyle={{ height: 50 }}>
          {t("common.save")}
        </Button>
      </ScrollView>

      {/* Category Dialog */}
      <Portal>
        <Dialog visible={showCatDialog} onDismiss={() => setShowCatDialog(false)} style={{ maxHeight: "70%" }}>
          <Dialog.Title>Escolher Categoria</Dialog.Title>
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
                    <Text variant="bodySmall" numberOfLines={1}>
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
          <Dialog.Title>Selecione a Origem</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              <Text variant="titleSmall" style={styles.dialogHeader}>
                Contas Bancárias
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
                    Cartões de Crédito
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  input: {
    backgroundColor: "white",
  },
  selector: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e0e0e0",
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
});
