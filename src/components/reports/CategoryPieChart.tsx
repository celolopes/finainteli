import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { VictoryPie } from "victory-native";

interface CategoryData {
  category: string;
  amount: number;
  color: string;
  percentage: number;
}

interface CategoryPieChartProps {
  data: CategoryData[];
}

export const CategoryPieChart = ({ data }: CategoryPieChartProps) => {
  const theme = useTheme();
  const screenWidth = Dimensions.get("window").width;

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height: 200, justifyContent: "center", alignItems: "center" }]}>
        <Text>Sem dados para exibir</Text>
      </View>
    );
  }

  // Aggregate small slices into "Outros" to avoid clutter
  const processedData = processPieData(data);

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Gastos por Categoria
      </Text>
      <View style={{ alignItems: "center" }}>
        <VictoryPie
          data={processedData}
          x="category"
          y="amount"
          colorScale={processedData.map((d) => d.color)}
          width={screenWidth - 32}
          height={300}
          innerRadius={60}
          padAngle={2}
          style={{
            labels: { fill: theme.colors.onSurface, fontSize: 12, fontWeight: "bold" },
          }}
          labelRadius={({ innerRadius }: { innerRadius: number }) => (Number(innerRadius) || 60) + 45}
          labels={({ datum }: { datum: any }) => `${datum.x}\n${Math.round(datum.percentage)}%`}
        />
      </View>
    </View>
  );
};

const processPieData = (data: CategoryData[]) => {
  // Top 5 categories + Others
  const sorted = [...data].sort((a, b) => b.amount - a.amount);
  if (sorted.length <= 5) return sorted;

  const top5 = sorted.slice(0, 5);
  const others = sorted.slice(5);
  const othersAmount = others.reduce((acc, curr) => acc + curr.amount, 0);
  const othersPercentage = others.reduce((acc, curr) => acc + curr.percentage, 0);

  return [
    ...top5,
    {
      category: "Outros",
      amount: othersAmount,
      color: "#A0A0A0",
      percentage: othersPercentage,
    },
  ];
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: "transparent",
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
  },
});
