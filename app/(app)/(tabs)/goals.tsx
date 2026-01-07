import React, { useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Text, TextInput, Button, ProgressBar, Card, useTheme, HelperText } from "react-native-paper";
import { useStore } from "../../../src/store/useStore";
import { GeminiService } from "../../../src/services/gemini";
import { Controller, useForm } from "react-hook-form";
import Markdown from "react-native-markdown-display"; // Needed? Or just Text.

// We might not have markdown installed, let's use simple Text for now or code block style
// Actually, user stack didn't specify Markdown renderer, but AI output is likely MD.
// I will render it inside a simple container.

export default function GoalsScreen() {
  const theme = useTheme();
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
      currentAmount: 0, // In real app, calculate from dedicated savings account
    });
  };

  const generatePlan = async () => {
    if (goals.length === 0) return;
    setGenerating(true);

    // Calculate context
    let inc = 0,
      exp = 0;
    transactions.forEach((t) => (t.type === "income" ? (inc += t.amount) : (exp += t.amount)));

    const context = {
      monthlyIncome: inc,
      monthlyExpenses: exp,
      savings: inc - exp,
      topCategories: [], // simplified
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
          Financial Goals
        </Text>
      </View>

      {!currentGoal ? (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Set a Goal</Text>
            <Controller
              control={control}
              name="targetAmount"
              render={({ field: { onChange, value } }) => <TextInput label="Target Amount ($)" value={value} onChangeText={onChange} keyboardType="numeric" mode="outlined" style={styles.input} />}
            />
            <Controller
              control={control}
              name="deadline"
              render={({ field: { onChange, value } }) => <TextInput label="Deadline (YYYY-MM-DD)" value={value} onChangeText={onChange} mode="outlined" style={styles.input} />}
            />
            <Button mode="contained" onPress={handleSubmit(onSubmit)} style={styles.button}>
              Start Goal
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <View>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: "bold" }}>
                ${currentGoal.targetAmount} by {currentGoal.deadline}
              </Text>
              <View style={styles.progressContainer}>
                <Text variant="bodySmall">Progress (Mock Data: 25%)</Text>
                <ProgressBar progress={0.25} color={theme.colors.primary} style={styles.progress} />
              </View>
            </Card.Content>
            <Card.Actions>
              <Button
                onPress={() => {
                  /* Edit Logic */
                }}
              >
                Edit
              </Button>
            </Card.Actions>
          </Card>

          <View style={styles.aiSection}>
            <Button mode="contained-tonal" icon="creation" onPress={generatePlan} loading={generating}>
              Generate AI Plan
            </Button>

            {currentGoal.aiPlan && (
              <Card style={[styles.card, { marginTop: 16, backgroundColor: theme.colors.surfaceVariant }]}>
                <Card.Content>
                  <Text variant="titleMedium" style={{ marginBottom: 8 }}>
                    Strategy
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
