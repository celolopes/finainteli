import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { TextInput, Button, SegmentedButtons, HelperText, useTheme } from "react-native-paper";
import { useRouter, Stack } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { useStore } from "../../src/store/useStore";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
      <Stack.Screen options={{ title: "Add Transaction", presentation: "modal" }} />
      <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={styles.container}>
        <Controller
          control={control}
          name="type"
          render={({ field: { value, onChange } }) => (
            <SegmentedButtons
              value={value}
              onValueChange={onChange}
              buttons={[
                { value: "expense", label: "Expense", icon: "arrow-down" },
                { value: "income", label: "Income", icon: "arrow-up" },
              ]}
              style={styles.input}
            />
          )}
        />

        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, value } }) => (
            <View>
              <TextInput label="Amount" value={value} onChangeText={onChange} keyboardType="numeric" mode="outlined" style={styles.input} error={!!errors.amount} left={<TextInput.Affix text="$" />} />
              <HelperText type="error" visible={!!errors.amount}>
                {errors.amount?.message}
              </HelperText>
            </View>
          )}
        />

        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, value } }) => <TextInput label="Title" value={value} onChangeText={onChange} mode="outlined" style={styles.input} error={!!errors.title} />}
        />

        {type === "expense" && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}>
            {CATEGORIES.map((cat) => (
              <Button key={cat} mode={watch("category") === cat ? "contained" : "outlined"} onPress={() => setValue("category", cat)} style={{ margin: 4 }} compact>
                {cat}
              </Button>
            ))}
          </View>
        )}

        <Button mode="contained" onPress={handleSubmit(onSubmit)} style={styles.button}>
          Save Transaction
        </Button>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
    paddingVertical: 6,
  },
});
