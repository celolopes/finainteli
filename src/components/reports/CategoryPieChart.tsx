import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { Text, useTheme } from "react-native-paper";
import { CountUp } from "use-count-up";
import { buildThemePalette, lightenColor, withAlpha } from "./chartUtils";

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
  // Limit chart size to fit within card with padding
  const maxChartSize = screenWidth - 80; // More margin for card padding
  const chartSize = Math.min(maxChartSize, 220);
  const radius = Math.max(chartSize / 2, 80);
  const innerRadius = Math.round(radius * 0.58);
  const isDark = theme.dark;

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height: 200, justifyContent: "center", alignItems: "center" }]}>
        <Text>Sem dados para exibir</Text>
      </View>
    );
  }

  // Aggregate small slices into "Outros" to avoid clutter
  const processedData = processPieData(data);
  const total = processedData.reduce((sum, item) => sum + item.amount, 0);
  const palette = buildThemePalette(theme.colors, isDark);
  const coloredData = processedData.map((item, index) => {
    const fallback = palette[index % palette.length] || item.color;
    const color = item.category === "Outros" ? (theme.colors.outlineVariant ?? fallback) : fallback;
    return {
      ...item,
      color,
      gradientCenterColor: isDark ? lightenColor(color, 0.18) : undefined,
    };
  });

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        Gastos por Categoria
      </Text>
      <View
        style={[
          styles.chartSurface,
          { backgroundColor: theme.colors.surface },
          isDark && {
            borderWidth: 1,
            borderColor: withAlpha(theme.colors.primary, 0.2),
            shadowColor: theme.colors.primary,
            shadowOpacity: 0.25,
          },
        ]}
      >
        <View style={[styles.chart, { height: radius * 2 + 24, alignItems: "center", justifyContent: "center" }]}>
          <PieChart
            data={coloredData.map((item) => ({
              value: item.amount,
              color: item.color,
              gradientCenterColor: item.gradientCenterColor,
              text: `${Math.round(item.percentage || 0)}%`,
            }))}
            donut
            radius={radius}
            innerRadius={innerRadius}
            showText
            textColor="#ffffff"
            textSize={12}
            isAnimated
            animationDuration={700}
            showGradient={isDark}
            strokeWidth={1}
            strokeColor={withAlpha(theme.colors.background, isDark ? 0.4 : 0.2)}
            centerLabelComponent={() => (
              <View style={styles.centerLabel}>
                <Text variant="labelSmall" style={{ opacity: 0.7 }}>
                  Total
                </Text>
                <Text variant="titleLarge" style={{ fontWeight: "700", color: theme.colors.onSurface }}>
                  R$ {total.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                </Text>
              </View>
            )}
          />
        </View>
      </View>
      <View style={styles.legend}>
        {coloredData.map((item) => (
          <View key={item.category} style={styles.legendRow}>
            <View
              style={[
                styles.legendSwatch,
                { backgroundColor: item.color },
                isDark && {
                  shadowColor: item.color,
                  shadowOpacity: 0.7,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 3,
                },
              ]}
            />
            <Text style={styles.legendLabel}>{item.category}</Text>
            <Text style={styles.legendValue}>
              <CountUp isCounting end={Math.round(item.percentage || 0)} duration={0.6} key={`${item.category}-${item.percentage}`} />%
            </Text>
          </View>
        ))}
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
  chart: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  chartSurface: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  centerLabel: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  legend: {
    marginTop: 12,
    gap: 8,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendLabel: {
    flex: 1,
  },
  legendValue: {
    opacity: 0.7,
  },
});
