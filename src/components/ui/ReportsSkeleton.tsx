import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { Skeleton } from "./Skeleton";

const { width } = Dimensions.get("window");

export const ReportsSkeleton = () => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {/* AI Card Skeleton */}
      <View style={styles.section}>
        <Skeleton width={180} height={28} style={styles.title} />
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.row}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <View style={styles.textGroup}>
              <Skeleton width="80%" height={16} style={styles.line} />
              <Skeleton width="60%" height={14} />
            </View>
          </View>
        </View>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.row}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <View style={styles.textGroup}>
              <Skeleton width="75%" height={16} style={styles.line} />
              <Skeleton width="50%" height={14} />
            </View>
          </View>
        </View>
      </View>

      {/* Evolution Chart Skeleton */}
      <View style={styles.section}>
        <View style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}>
          <Skeleton width={150} height={20} style={styles.chartTitle} />
          <View style={styles.chartGrap}>
            {/* Simulating bars or lines with skeletons */}
            <View style={styles.barsContainer}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} width={(width - 100) / 6} height={60 + Math.random() * 80} style={styles.bar} />
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Pie Chart Skeleton */}
      <View style={styles.section}>
        <View style={[styles.chartContainer, { backgroundColor: theme.colors.surface, height: 260 }]}>
          <Skeleton width={140} height={20} style={styles.chartTitle} />
          <View style={styles.pieContainer}>
            <Skeleton width={140} height={140} borderRadius={70} />
            <View style={styles.pieLegend}>
              <Skeleton width={80} height={12} style={styles.line} />
              <Skeleton width={100} height={12} style={styles.line} />
              <Skeleton width={70} height={12} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
  },
  section: {
    gap: 12,
  },
  title: {
    marginBottom: 4,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  textGroup: {
    flex: 1,
    gap: 8,
    justifyContent: "center",
  },
  line: {
    marginBottom: 4,
  },
  chartContainer: {
    padding: 20,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  chartTitle: {
    alignSelf: "center",
    marginBottom: 24,
  },
  chartGrap: {
    height: 180,
    justifyContent: "flex-end",
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: "100%",
  },
  bar: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  pieContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    marginTop: 10,
  },
  pieLegend: {
    gap: 12,
  },
});
