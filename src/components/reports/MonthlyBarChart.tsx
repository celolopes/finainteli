import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
// @ts-ignore
import { VictoryAxis, VictoryBar, VictoryChart, VictoryLabel, VictoryTheme } from "victory-native";

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface MonthlyBarChartProps {
  data: MonthlyData[];
}

export const MonthlyBarChart = ({ data }: MonthlyBarChartProps) => {
  const theme = useTheme();
  const screenWidth = Dimensions.get("window").width;

  if (!data || data.length === 0) return null;

  // Transform data for Victory (simple bar for Expenses)
  const chartData = data.map((d) => ({ x: d.month, y: d.expense }));

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Despesas Mensais
      </Text>
      <VictoryChart width={screenWidth - 32} height={220} theme={VictoryTheme.material} domainPadding={{ x: 20 }}>
        <VictoryAxis
          style={{
            tickLabels: { fill: theme.colors.onSurface, fontSize: 10, angle: -15 },
          }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(t: number) => `k${Math.round(t / 1000)}`}
          style={{
            tickLabels: { fill: theme.colors.onSurface, fontSize: 10 },
          }}
        />
        <VictoryBar
          data={chartData}
          style={{ data: { fill: theme.colors.primary } }}
          labels={({ datum }: { datum: any }) => `R$${Math.round(datum.y)}`}
          labelComponent={<VictoryLabel dy={-10} style={{ fill: theme.colors.onSurface, fontSize: 10 }} />}
          animate={{
            duration: 500,
            onLoad: { duration: 500 },
          }}
          barRatio={0.5}
          cornerRadius={4}
        />
      </VictoryChart>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    padding: 16,
  },
  title: {
    textAlign: "center",
    marginBottom: 0,
  },
});
