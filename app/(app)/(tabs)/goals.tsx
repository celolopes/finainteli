import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Appbar, Button, Card, Icon, IconButton, ProgressBar, Text, TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GeminiService } from "../../../src/services/gemini";
import { useStore } from "../../../src/store/useStore";
import { CurrencyUtils } from "../../../src/utils/currency";

export default function GoalsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { goals, addGoal, setGoalPlan, transactions } = useStore();

  const [generating, setGenerating] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      targetAmount: "",
      description: "",
    },
  });

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    setDate(currentDate);
  };

  const onSubmit = (data: any) => {
    // Parse currency string to number
    const amount = CurrencyUtils.parse(data.targetAmount);

    if (amount <= 0) return;

    addGoal({
      targetAmount: amount,
      deadline: date.toLocaleDateString("pt-BR"), // Store as string for display, or ISO if backend requires. User asked for Locale fix. Storing consistent format (e.g. YYYY-MM-DD or ISO) is better for logic, but for now matching existing pattern.
      currentAmount: 0,
    });
  };

  const generatePlan = async () => {
    if (goals.length === 0) return;
    setGenerating(true);

    let inc = 0,
      exp = 0;
    transactions.forEach((t) => (t.type === "income" ? (inc += t.amount) : (exp += t.amount)));

    const context = {
      monthlyIncome: inc,
      monthlyExpenses: exp,
      savings: inc - exp,
      topCategories: [],
      goal: goals[0]
        ? {
            target: goals[0].targetAmount,
            deadline: goals[0].deadline,
            current: goals[0].currentAmount || 0,
          }
        : undefined,
    };

    try {
      const plan = await GeminiService.generateGoalPlan(context, "Reach my savings target");
      setGoalPlan(plan);
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const currentGoal = goals[0];
  const progress = currentGoal ? (currentGoal.currentAmount || 0) / currentGoal.targetAmount : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient colors={[theme.colors.surfaceVariant, theme.colors.background]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} />

      <Appbar.Header style={{ backgroundColor: "transparent" }}>
        <Appbar.Content title={t("goals.title", "Metas Financeiras")} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        {!currentGoal ? (
          <View style={styles.formContainer}>
            <View style={styles.heroIcon}>
              <Icon source="target" size={64} color={theme.colors.primary} />
            </View>
            <Text variant="headlineSmall" style={{ textAlign: "center", marginBottom: 8, fontWeight: "bold" }}>
              {t("goals.createTitle", "Defina seu Objetivo")}
            </Text>
            <Text variant="bodyMedium" style={{ textAlign: "center", marginBottom: 32, opacity: 0.7 }}>
              {t("goals.createDesc", "O que você quer conquistar? Defina um valor e um prazo para começarmos.")}
            </Text>

            <View style={styles.cardForm}>
              <Controller
                control={control}
                name="targetAmount"
                rules={{ required: true }}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    label={t("goals.targetAmount", "Valor Alvo (R$)")}
                    value={value}
                    onChangeText={(text) => {
                      // Simple currency masking
                      const numeric = text.replace(/\D/g, "");
                      const formatted = (Number(numeric) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                      onChange(formatted);
                    }}
                    keyboardType="numeric"
                    mode="outlined"
                    style={styles.input}
                    left={<TextInput.Icon icon="cash" />}
                  />
                )}
              />

              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <View pointerEvents="none">
                  <TextInput
                    label={t("goals.deadline", "Prazo")}
                    value={date.toLocaleDateString("pt-BR")}
                    mode="outlined"
                    style={styles.input}
                    left={<TextInput.Icon icon="calendar" />}
                    editable={false}
                  />
                </View>
              </TouchableOpacity>

              {showDatePicker && <DateTimePicker value={date} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={onChangeDate} minimumDate={new Date()} />}
              {Platform.OS === "ios" && showDatePicker && <Button onPress={() => setShowDatePicker(false)}>Confirmar Data</Button>}

              <Button mode="contained" onPress={handleSubmit(onSubmit)} style={styles.button} contentStyle={{ height: 56 }}>
                {t("goals.startGoal", "Iniciar Meta")}
              </Button>
            </View>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <Card style={styles.activeCard}>
              <Card.Content>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <Icon source="flag-checkered" size={32} color={theme.colors.primary} />
                  <IconButton icon="dots-vertical" onPress={() => {}} />
                </View>

                <Text variant="bodyMedium" style={{ opacity: 0.7 }}>
                  Meta Atual
                </Text>
                <Text variant="displaySmall" style={{ fontWeight: "bold", color: theme.colors.primary, marginVertical: 4 }}>
                  {CurrencyUtils.format(currentGoal.targetAmount)}
                </Text>
                <Text variant="bodyMedium" style={{ marginBottom: 24 }}>
                  Até {currentGoal.deadline}
                </Text>

                <View style={styles.progressContainer}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                    <Text variant="bodySmall" style={{ fontWeight: "bold" }}>
                      Progresso
                    </Text>
                    <Text variant="bodySmall">{(progress * 100).toFixed(1)}%</Text>
                  </View>
                  <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progress} />
                  <Text variant="bodySmall" style={{ marginTop: 8, textAlign: "right", opacity: 0.6 }}>
                    Faltam {CurrencyUtils.format(currentGoal.targetAmount - (currentGoal.currentAmount || 0))}
                  </Text>
                </View>
              </Card.Content>
            </Card>

            <View style={styles.aiSection}>
              <View style={styles.aiHeader}>
                <Icon source="robot" size={24} color={theme.colors.secondary} />
                <Text variant="titleMedium" style={{ fontWeight: "bold", flex: 1, marginLeft: 12 }}>
                  {t("goals.advisorTitle", "Consultor IA")}
                </Text>
              </View>

              {!currentGoal.aiPlan ? (
                <View style={styles.aiEmpty}>
                  <Text variant="bodyMedium" style={{ textAlign: "center", marginBottom: 16, opacity: 0.8 }}>
                    Precisa de ajuda para atingir essa meta? Posso criar um plano personalizado para você.
                  </Text>
                  <Button mode="contained-tonal" icon="creation" onPress={generatePlan} loading={generating}>
                    {t("goals.generatePlan", "Gerar Plano Estratégico")}
                  </Button>
                </View>
              ) : (
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                  <Card.Content>
                    <Text variant="titleMedium" style={{ marginBottom: 12, fontWeight: "bold" }}>
                      {t("goals.strategy", "Plano de Ação")}
                    </Text>
                    <Text variant="bodyMedium" style={{ lineHeight: 22 }}>
                      {currentGoal.aiPlan}
                    </Text>
                  </Card.Content>
                </Card>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  formContainer: {
    justifyContent: "center",
    paddingTop: 32,
  },
  heroIcon: {
    alignSelf: "center",
    marginBottom: 24,
    backgroundColor: "rgba(108, 99, 255, 0.1)",
    padding: 24,
    borderRadius: 64,
  },
  cardForm: {
    marginTop: 24,
    gap: 16,
  },
  input: {
    backgroundColor: "transparent",
  },
  button: {
    marginTop: 16,
    borderRadius: 12,
  },
  activeCard: {
    borderRadius: 24,
    elevation: 4,
  },
  progressContainer: {
    marginTop: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 16,
    borderRadius: 16,
  },
  progress: {
    height: 12,
    borderRadius: 6,
  },
  aiSection: {
    marginTop: 8,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  aiEmpty: {
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    borderStyle: "dashed",
    alignItems: "center",
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
  },
});
