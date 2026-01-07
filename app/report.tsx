import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Text, Surface, ActivityIndicator, useTheme, Button } from "react-native-paper";
import { Stack, useRouter } from "expo-router";
import { useStore } from "../src/store/useStore";
import { GeminiService } from "../src/services/gemini";
import { VictoryBar, VictoryChart, VictoryTheme, VictoryAxis } from "victory-native";

export default function ReportScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { transactions } = useStore();
  const [report, setReport] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generate();
  }, []);

  const generate = async () => {
    let inc = 0,
      exp = 0;
    const cats: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.type === "income") inc += t.amount;
      else {
        exp += t.amount;
        cats[t.category] = (cats[t.category] || 0) + t.amount;
      }
    });

    const topCats = Object.entries(cats)
      .map(([k, v]) => ({ category: k, amount: v }))
      .sort((a, b) => b.amount - a.amount);

    const context = {
      monthlyIncome: inc,
      monthlyExpenses: exp,
      savings: inc - exp,
      topCategories: topCats,
    };

    const text = await GeminiService.generateMonthlyReport(context);
    setReport(text);
    setLoading(false);
  };

  const chartData = [
    { x: "Week 1", y: 450 },
    { x: "Week 2", y: 320 },
    { x: "Week 3", y: 550 },
    { x: "Week 4", y: 200 },
  ]; // Mock weekly trend for UI demo

  return (
    <>
      <Stack.Screen options={{ title: "Monthly AI Report", presentation: "modal" }} />
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 16 }}>Compiling financial insights...</Text>
          </View>
        ) : (
          <View>
            <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <Text variant="titleMedium" style={{ marginBottom: 16, fontWeight: "bold" }}>
                Spending Trend
              </Text>
              <VictoryChart width={300} height={200} theme={VictoryTheme.material}>
                <VictoryAxis dependentAxis />
                <VictoryAxis />
                <VictoryBar data={chartData} style={{ data: { fill: theme.colors.primary } }} />
              </VictoryChart>
            </Surface>

            <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <Text variant="titleLarge" style={{ color: theme.colors.primary, marginBottom: 12 }}>
                Analysis
              </Text>
              <Text variant="bodyMedium" style={{ lineHeight: 24 }}>
                {report}
              </Text>
            </Surface>

            <Button mode="contained" onPress={() => router.back()} style={{ marginVertical: 24 }}>
              Close Report
            </Button>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
  },
});
