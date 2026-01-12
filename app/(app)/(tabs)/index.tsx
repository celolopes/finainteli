import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { VictoryPie } from "victory-native";
import { SmartTipCard } from "../../../src/components/SmartTipCard";
import { SummaryCards } from "../../../src/components/SummaryCards";
import { GeminiService } from "../../../src/services/gemini";
import { useStore } from "../../../src/store/useStore";

console.log("VictoryPie:", VictoryPie);
console.log("SummaryCards:", SummaryCards);
console.log("SmartTipCard:", SmartTipCard);

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { transactions, goals, initialize, isLoading } = useStore();
  const [tip, setTip] = useState<string>("");
  const [loadingTip, setLoadingTip] = useState(false);

  const { income, expenses, topCategories } = useMemo(() => {
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

    const sortedCats = Object.entries(cats)
      .map(([category, amount]) => ({ x: category, y: amount, label: `${category}\n$${amount}` }))
      .sort((a, b) => b.y - a.y)
      .slice(0, 5);

    return { income: inc, expenses: exp, topCategories: sortedCats };
  }, [transactions]);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (transactions.length > 0 && !tip) {
      loadSmartTip();
    }
  }, [transactions]);

  const loadSmartTip = async () => {
    setLoadingTip(true);
    const context = {
      monthlyIncome: income,
      monthlyExpenses: expenses,
      savings: income - expenses,
      topCategories: topCategories.map((c) => ({ category: c.x, amount: c.y })),
      goal: goals[0]
        ? {
            target: goals[0].targetAmount,
            deadline: goals[0].deadline,
            current: income - expenses,
          }
        : undefined,
    };

    const newTip = await GeminiService.generateSmartTip(context);
    setTip(newTip);
    setLoadingTip(false);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} refreshControl={<RefreshControl refreshing={isLoading} onRefresh={initialize} />}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={{ color: theme.colors.onBackground, fontWeight: "bold" }}>
          Dashboard
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Your financial health at a glance
        </Text>
      </View>

      <SmartTipCard tip={tip} loading={loadingTip} onPressReport={() => router.push("/report")} />

      <SummaryCards income={income} expenses={expenses} />

      {topCategories.length > 0 && (
        <View style={styles.chartContainer}>
          <Text variant="titleMedium" style={{ marginLeft: 16, marginTop: 16 }}>
            Top Spending
          </Text>
          {/* <VictoryPie
            data={topCategories}
            colorScale={["#6C63FF", "#03DAC6", "#FF4081", "#FF9100", "#7C4DFF"]}
            innerRadius={60}
            style={{ labels: { fill: theme.colors.onBackground, fontSize: 12 } }}
            height={300}
          /> */}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 8,
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
});
