import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
// @ts-ignore
import { VictoryAxis, VictoryChart, VictoryLine, VictoryTheme } from "victory-native";

interface EvolutionData {
  period: string;
  balance: number;
}

interface EvolutionChartProps {
  data: EvolutionData[];
}

export const EvolutionChart = ({ data }: EvolutionChartProps) => {
  const theme = useTheme();
  const screenWidth = Dimensions.get("window").width;

  if (!data || data.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Evolução Patrimonial
      </Text>
      <VictoryChart width={screenWidth - 32} height={220} theme={VictoryTheme.material} domainPadding={{ x: 20, y: 20 }}>
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
        <VictoryLine
          data={data}
          x="period"
          y="balance"
          style={{
            data: { stroke: theme.colors.tertiary, strokeWidth: 3 },
          }}
          animate={{
            duration: 1000,
            onLoad: { duration: 1000 },
          }}
          interpolation="monotoneX"
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
  },
});
