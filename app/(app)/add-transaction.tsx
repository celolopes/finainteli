import { zodResolver } from "@hookform/resolvers/zod";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Chip, HelperText, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import { useStore } from "../../src/store/useStore";

const CATEGORIES = ["Food", "Transport", "Bills", "Entertainment", "Shopping", "Health", "Other"];

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount"),
  type: z.enum(["income", "expense"]),
  category: z.string(),
});

type FormData = z.infer<typeof schema>;

export default function AddTransactionScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { addTransaction } = useStore();
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

  const onSubmit = (data: FormData) => {
    addTransaction({
      id: Date.now().toString(),
      title: data.title,
      amount: parseFloat(data.amount),
      type: data.type,
      category: data.type === "income" ? "Income" : data.category,
      date: new Date().toISOString(),
    });
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: "New Transaction", presentation: "modal", headerShown: false }} />
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
                  { value: "expense", label: "Expense", icon: "arrow-down-circle-outline", checkedColor: theme.colors.error },
                  { value: "income", label: "Income", icon: "arrow-up-circle-outline", checkedColor: theme.colors.primary },
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
                  label="Amount"
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
            render={({ field: { onChange, value } }) => <TextInput label="Description" value={value} onChangeText={onChange} mode="outlined" style={styles.input} error={!!errors.title} />}
          />
          <HelperText type="error" visible={!!errors.title}>
            {errors.title?.message}
          </HelperText>
        </View>

        {type === "expense" && (
          <View style={styles.formGroup}>
            <Text variant="titleSmall" style={{ marginBottom: 12, color: theme.colors.onSurfaceVariant }}>
              Category
            </Text>
            <View style={styles.chipContainer}>
              {CATEGORIES.map((cat) => (
                <Chip key={cat} selected={selectedCategory === cat} onPress={() => setValue("category", cat)} showSelectedOverlay style={styles.chip} mode="outlined">
                  {cat}
                </Chip>
              ))}
            </View>
          </View>
        )}

        <Button mode="contained" onPress={handleSubmit(onSubmit)} style={styles.saveButton} contentStyle={{ paddingVertical: 8 }} labelStyle={{ fontSize: 16 }}>
          Save Transaction
        </Button>

        <Button mode="text" onPress={() => router.back()} style={styles.cancelButton} textColor={theme.colors.onSurfaceVariant}>
          Cancel
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
