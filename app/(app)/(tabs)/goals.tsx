import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, ProgressBar, Text, TextInput, useTheme } from "react-native-paper";
import { GeminiService } from "../../../src/services/gemini";
import { useStore } from "../../../src/store/useStore";

export default function GoalsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { goals, addGoal, setGoalPlan, transactions } = useStore();
  const [generating, setGenerating] = useState(false);

  const { control, handleSubmit } = useForm({
    defaultValues: {
      targetAmount: "",
      deadline: "",
      description: "",
    },
  });

  const onSubmit = (data: any) => {
    addGoal({
      targetAmount: parseFloat(data.targetAmount),
      deadline: data.deadline,
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

    const plan = await GeminiService.generateGoalPlan(context, "Reach my savings target");
    setGoalPlan(plan);
    setGenerating(false);
  };

  const currentGoal = goals[0];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ fontWeight: "bold", color: theme.colors.onBackground }}>
          {t("goals.title")}
        </Text>
      </View>

      {!currentGoal ? (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">{t("goals.setGoal")}</Text>
            <Controller
              control={control}
              name="targetAmount"
              render={({ field: { onChange, value } }) => (
                <TextInput label={t("goals.targetAmount")} value={value} onChangeText={onChange} keyboardType="numeric" mode="outlined" style={styles.input} />
              )}
            />
            <Controller
              control={control}
              name="deadline"
              render={({ field: { onChange, value } }) => <TextInput label={t("goals.deadline")} value={value} onChangeText={onChange} mode="outlined" style={styles.input} />}
            />
            <Button mode="contained" onPress={handleSubmit(onSubmit)} style={styles.button}>
              {t("goals.startGoal")}
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <View>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: "bold" }}>
                R$ {currentGoal.targetAmount} - {currentGoal.deadline}
              </Text>
              <View style={styles.progressContainer}>
                <Text variant="bodySmall">{t("goals.progress")} (25%)</Text>
                <ProgressBar progress={0.25} color={theme.colors.primary} style={styles.progress} />
              </View>
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => {}}>{t("goals.edit")}</Button>
            </Card.Actions>
          </Card>

          <View style={styles.aiSection}>
            <Button mode="contained-tonal" icon="creation" onPress={generatePlan} loading={generating}>
              {t("goals.generatePlan")}
            </Button>

            {currentGoal.aiPlan && (
              <Card style={[styles.card, { marginTop: 16, backgroundColor: theme.colors.surfaceVariant }]}>
                <Card.Content>
                  <Text variant="titleMedium" style={{ marginBottom: 8 }}>
                    {t("goals.strategy")}
                  </Text>
                  <Text variant="bodyMedium">{currentGoal.aiPlan}</Text>
                </Card.Content>
              </Card>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
  progressContainer: {
    marginTop: 16,
  },
  progress: {
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  aiSection: {
    marginTop: 8,
  },
});
