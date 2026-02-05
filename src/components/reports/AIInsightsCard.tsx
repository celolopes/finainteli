import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Card, Text, useTheme } from "react-native-paper";
import { AIInsight } from "../../services/aiAdvisor";
import { Skeleton } from "../ui/Skeleton";

interface AIInsightsCardProps {
  insights: AIInsight[];
  loading?: boolean;
  onRefresh?: () => void;
}

export const AIInsightsCard = ({ insights, loading, onRefresh }: AIInsightsCardProps) => {
  const theme = useTheme();

  if (loading && (!insights || insights.length === 0)) {
    return (
      <View style={styles.container}>
        {[1, 2].map((i) => (
          <Card key={i} style={styles.card}>
            <Card.Content style={styles.content}>
              <View style={styles.header}>
                <Skeleton width={32} height={32} borderRadius={16} />
                <View style={[styles.textContainer, { marginLeft: 12 }]}>
                  <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
                  <Skeleton width="90%" height={12} />
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  }

  if (!insights || insights.length === 0) return null;

  return (
    <View style={styles.container}>
      {insights.map((insight, index) => (
        <Card key={index} style={[styles.card, { borderLeftColor: getImpactColor(insight.type, theme), borderLeftWidth: 4 }]} aria-label={`Dica de IA: ${insight.title}`}>
          <Card.Content style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.icon}>{insight.icon}</Text>
              <View style={styles.textContainer}>
                <Text variant="titleMedium" style={{ fontWeight: "bold" }}>
                  {insight.title}
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  {insight.message}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      ))}
      {onRefresh && (
        <Button mode="text" onPress={onRefresh} icon="refresh">
          Atualizar Análise
        </Button>
      )}
    </View>
  );
};

const getImpactColor = (type: string, theme: any) => {
  switch (type) {
    case "warning":
      return theme.colors.error;
    case "alert":
      return theme.colors.error;
    case "praise":
      return theme.colors.primary;
    case "prediction":
      return theme.colors.secondary;
    default:
      return theme.colors.secondaryContainer;
  }
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginBottom: 16,
  },
  card: {
    marginBottom: 4,
  },
  content: {
    paddingVertical: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
});
