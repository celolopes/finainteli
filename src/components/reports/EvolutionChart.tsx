import React, { useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { LineChart } from "react-native-gifted-charts";
import { buildLabelTexts, formatThousands, lightenColor, withAlpha } from "./chartUtils";

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
  const chartWidth = Math.max(screenWidth - 32, 240);
  const safeData = data ?? [];

  const axisLineColor = theme.colors.outlineVariant ?? theme.colors.onSurface;
  const isDark = theme.dark;
  const lineColor = isDark ? lightenColor(theme.colors.tertiary, 0.15) : theme.colors.tertiary;
  const glowFill = withAlpha(lineColor, isDark ? 0.3 : 0.18);
  const ruleColor = withAlpha(axisLineColor, isDark ? 0.35 : 0.5);
  const labels = useMemo(() => buildLabelTexts(safeData.map((item) => item.period), 6), [safeData]);
  const chartData = useMemo(
    () =>
      safeData.map((item, index) => ({
        value: item.balance,
        label: labels[index],
      })),
    [safeData, labels],
  );

  if (safeData.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Evolução Patrimonial
      </Text>
      <View
        style={[
          styles.chartSurface,
          { backgroundColor: theme.colors.surface },
          isDark && {
            borderWidth: 1,
            borderColor: withAlpha(lineColor, 0.18),
            shadowColor: lineColor,
            shadowOpacity: 0.25,
          },
        ]}
      >
        <View style={styles.chart}>
          <LineChart
            data={chartData}
            width={chartWidth}
            height={220}
            curved
            areaChart
            isAnimated
            animationDuration={900}
            color={lineColor}
            thickness={3}
            startFillColor={lineColor}
            endFillColor={theme.colors.background}
            startOpacity={isDark ? 0.35 : 0.22}
            endOpacity={0.01}
            lineGradient={isDark}
            lineGradientStartColor={lineColor}
            lineGradientEndColor={glowFill}
            yAxisTextStyle={{ color: theme.colors.onSurface, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: theme.colors.onSurface, fontSize: 10 }}
            xAxisColor={axisLineColor}
            yAxisColor={axisLineColor}
            rulesColor={ruleColor}
            rulesThickness={0.6}
            yAxisLabelWidth={48}
            noOfSections={4}
            rotateLabel
            xAxisLabelsHeight={32}
            xAxisLabelsVerticalShift={6}
            initialSpacing={16}
            endSpacing={16}
            adjustToWidth
            hideDataPoints={!isDark}
            dataPointsRadius={3}
            dataPointsColor={withAlpha(lineColor, 0.9)}
            formatYLabel={(label) => formatThousands(Number(label))}
          />
        </View>
      </View>
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
  chart: {
    height: 220,
  },
  chartSurface: {
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
});
