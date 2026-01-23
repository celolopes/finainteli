import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Surface, Text, useTheme } from "react-native-paper";
import { AIInsight } from "../../services/aiAdvisor";
import { AIInsightsCard } from "./AIInsightsCard";

interface Props {
  insights: AIInsight[];
  loading?: boolean;
  onAction?: (insight: AIInsight) => void;
  emptyMessage?: string;
}

export const AIRecommendationsList = ({ insights, loading, onAction }: Props) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const emptyMessage = t("reports.advisor.empty");

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Surface style={styles.skeletonCard} elevation={1}>
          <View />
        </Surface>
        <Surface style={[styles.skeletonCard, { opacity: 0.7 }]} elevation={1}>
          <View />
        </Surface>
        <Surface style={[styles.skeletonCard, { opacity: 0.4 }]} elevation={0}>
          <View />
        </Surface>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text variant="bodySmall" style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}>
            {t("reports.advisor.analyzing")}
          </Text>
        </View>
      </View>
    );
  }

  if (insights.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: "center" }}>
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {insights.map((insight, index) => (
        <AIInsightsCard key={insight.id} insight={insight} onAction={onAction} index={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  loadingContainer: {
    paddingVertical: 16,
    gap: 16,
    position: "relative",
  },
  loadingContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  skeletonCard: {
    height: 120,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.05)", // Should adapt to theme ideally
    width: "100%",
  },
  emptyContainer: {
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
});
