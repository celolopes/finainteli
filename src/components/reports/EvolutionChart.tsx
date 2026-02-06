import React, { useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { Text, useTheme } from "react-native-paper";
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
  // Leave more margin to prevent overflow
  const chartWidth = Math.max(screenWidth - 80, 200);
  const safeData = data ?? [];

  const axisLineColor = theme.colors.outlineVariant ?? theme.colors.onSurface;
  const isDark = theme.dark;
  const lineColor = isDark ? lightenColor(theme.colors.tertiary, 0.15) : theme.colors.tertiary;
  const glowFill = withAlpha(lineColor, isDark ? 0.3 : 0.18);
  const ruleColor = withAlpha(axisLineColor, isDark ? 0.35 : 0.5);
  const labels = useMemo(
    () =>
      buildLabelTexts(
        safeData.map((item) => item.period),
        6,
      ),
    [safeData],
  );
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
            yAxisTextStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 11 }}
            xAxisLabelTextStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 11 }}
            xAxisColor="transparent"
            yAxisColor="transparent"
            rulesColor={ruleColor}
            rulesType="solid"
            rulesThickness={0.5}
            yAxisLabelWidth={35}
            noOfSections={3}
            formatYLabel={(label) => formatThousands(Number(label))}
            hideDataPoints={false}
            dataPointsColor={lineColor}
            dataPointsRadius={4}
            pointerConfig={{
              pointerStripHeight: 160,
              pointerStripColor: ruleColor,
              pointerStripWidth: 2,
              pointerColor: ruleColor,
              radius: 6,
              pointerLabelWidth: 100,
              pointerLabelHeight: 90,
              activatePointersOnLongPress: true,
              autoAdjustPointerLabelPosition: false,
              pointerLabelComponent: (items: any) => {
                const item = items[0];
                return (
                  <View
                    style={{
                      height: 90,
                      width: 100,
                      justifyContent: "center",
                      marginTop: -30,
                      marginLeft: -40,
                    }}
                  >
                    <View style={{ padding: 6, borderRadius: 8, backgroundColor: theme.colors.inverseSurface }}>
                      <Text style={{ color: theme.colors.inverseOnSurface, fontSize: 10, textAlign: "center" }}>{item.label}</Text>
                      <Text style={{ color: theme.colors.inverseOnSurface, fontSize: 12, fontWeight: "bold", textAlign: "center" }}>R$ {formatThousands(item.value)}</Text>
                    </View>
                  </View>
                );
              },
            }}
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
    paddingHorizontal: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
});
