import React, { useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { Text, useTheme } from "react-native-paper";
import { CountUp } from "use-count-up";
import { buildLabelTexts, formatThousands, lightenColor, withAlpha } from "./chartUtils";

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
  // Leave more margin to prevent overflow
  const chartWidth = Math.max(screenWidth - 80, 200);
  const safeData = data ?? [];

  // Transform data for the chart (simple bar for expenses)
  const labels = useMemo(
    () =>
      buildLabelTexts(
        safeData.map((item) => item.month),
        6,
      ),
    [safeData],
  );
  const showTopLabels = safeData.length <= 8;
  const barWidth = safeData.length > 10 ? 12 : 18;
  const spacing = safeData.length > 10 ? 12 : 18;
  const isDark = theme.dark;
  const baseBarColor = isDark ? lightenColor(theme.colors.primary, 0.08) : theme.colors.primary;
  const gradientColor = isDark ? lightenColor(theme.colors.primary, 0.28) : lightenColor(theme.colors.primary, 0.12);
  const chartData = useMemo(
    () =>
      safeData.map((d, index) => ({
        value: d.expense,
        label: labels[index],
        frontColor: baseBarColor,
        gradientColor,
        showGradient: true,
        topLabelComponent: showTopLabels
          ? () => (
              <Text style={{ fontSize: 10, color: theme.colors.onSurface }}>
                R$ <CountUp isCounting end={Math.round(d.expense)} duration={0.6} key={`${d.month}-${d.expense}`} />
              </Text>
            )
          : undefined,
      })),
    [safeData, labels, showTopLabels, theme.colors.onSurface, baseBarColor, gradientColor],
  );
  const axisLineColor = theme.colors.outlineVariant ?? theme.colors.onSurface;
  const ruleColor = withAlpha(axisLineColor, isDark ? 0.35 : 0.5);

  if (safeData.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Despesas Mensais
      </Text>
      <View
        style={[
          styles.chartSurface,
          { backgroundColor: theme.colors.surface },
          isDark && {
            borderWidth: 1,
            borderColor: withAlpha(baseBarColor, 0.18),
            shadowColor: baseBarColor,
            shadowOpacity: 0.25,
          },
        ]}
      >
        <View style={styles.chart}>
          <BarChart
            data={chartData}
            width={chartWidth}
            height={220}
            barWidth={24}
            spacing={24}
            barBorderRadius={6}
            isAnimated
            animationDuration={700}
            yAxisTextStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 11 }}
            xAxisLabelTextStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 11 }}
            xAxisColor="transparent"
            yAxisColor="transparent"
            yAxisThickness={0}
            xAxisThickness={0}
            rulesColor={ruleColor}
            rulesType="solid"
            rulesThickness={0.5}
            yAxisLabelWidth={35}
            noOfSections={3}
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
    marginBottom: 0,
  },
  chart: {
    height: 220,
  },
  chartSurface: {
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
});
