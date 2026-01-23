import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Button, Chip, HelperText, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import { FinancialService } from "../../src/services/financial";
import { CurrencyUtils } from "../../src/utils/currency";
// import { useStore } from "../../src/store/useStore";

const CATEGORIES = ["Food", "Transport", "Bills", "Entertainment", "Shopping", "Health", "Other"];

const createSchema = (t: any) =>
  z.object({
    title: z.string().min(1, t("transactions.validation.titleRequired")),
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/, t("transactions.validation.invalidAmount")),
    type: z.enum(["income", "expense"]),
    category: z.string(),
  });

export default function AddTransactionScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  // const { addTransaction } = useStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const schema = useMemo(() => createSchema(t), [t]);
  type FormData = z.infer<typeof schema>;

  useEffect(() => {
    const load = async () => {
      const [c, a] = await Promise.all([FinancialService.getCategories(), FinancialService.getAccounts()]);
      setCategories(c || []);
      setAccounts(a || []);
    };
    load();
  }, []);
  const insets = useSafeAreaInsets();

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
      category: "Food",
    },
  });

  const type = watch("type");
  const selectedCategory = watch("category");

  const onSubmit = async (data: FormData) => {
    if (accounts.length === 0) {
      Alert.alert(t("common.error"), t("transactions.validation.createAccountFirst"));
      return;
    }
    setSubmitting(true);
    try {
      const catObj = categories.find((c) => c.name === data.category);
      await FinancialService.createTransaction({
        description: data.title,
        amount: CurrencyUtils.parse(data.amount),
        type: data.type,
        account_id: accounts[0].id,
        category_id: catObj?.id,
        transaction_date: new Date().toISOString(),
        status: "completed",
        currency_code: "BRL", // Todo: dynamic
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

  return (
    <>
      <Stack.Screen options={{ title: t("transactions.newTitle"), presentation: "modal", headerShown: false }} />
      <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={[styles.container, { paddingTop: insets.top + 24 }]}>
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
                    checkedColor: theme.colors.error,
                  },
                  {
                    value: "income",
                    label: t("dashboard.income"),
                    icon: "arrow-up-circle-outline",
                    checkedColor: theme.colors.primary,
                  },
                ]}
                style={styles.segmentedButton}
              />
            )}
          />
        </View>

        <View style={styles.formGroup}>
          <Controller
            control={control}
            name="amount"
            render={({ field: { onChange, value } }) => (
              <View>
                <TextInput
                  label={t("budgets.amount")}
                  value={value}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.input}
                  contentStyle={{ fontSize: 24, fontWeight: "bold" }}
                  error={!!errors.amount}
                  left={<TextInput.Affix text="$" />}
                />
                <HelperText type="error" visible={!!errors.amount}>
                  {errors.amount?.message}
                </HelperText>
              </View>
            )}
          />
        </View>

        <View style={styles.formGroup}>
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value } }) => (
              <TextInput label={t("transactions.description")} value={value} onChangeText={onChange} mode="outlined" style={styles.input} error={!!errors.title} />
            )}
          />
          <HelperText type="error" visible={!!errors.title}>
            {errors.title?.message}
          </HelperText>
        </View>

        {type === "expense" && (
          <View style={styles.formGroup}>
            <Text variant="titleSmall" style={{ marginBottom: 12, color: theme.colors.onSurfaceVariant }}>
              {t("transactions.category")}
            </Text>
            <View style={styles.chipContainer}>
              {categories.map((cat) => (
                <Chip key={cat.id} selected={selectedCategory === cat.name} onPress={() => setValue("category", cat.name)} showSelectedOverlay style={styles.chip} mode="outlined">
                  {cat.name}
                </Chip>
              ))}
            </View>
          </View>
        )}

        <Button mode="contained" onPress={handleSubmit(onSubmit)} style={styles.saveButton} contentStyle={{ paddingVertical: 8 }} labelStyle={{ fontSize: 16 }}>
          {t("common.save")}
        </Button>

        <Button mode="text" onPress={() => router.back()} style={styles.cancelButton} textColor={theme.colors.onSurfaceVariant}>
          {t("common.cancel")}
        </Button>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 24,
  },
  segmentedButton: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: "transparent",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    marginBottom: 4,
  },
  saveButton: {
    marginTop: 8,
    borderRadius: 50,
  },
  cancelButton: {
    marginTop: 12,
  },
});
