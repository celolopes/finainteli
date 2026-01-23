import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Card, Icon, Text, useTheme } from "react-native-paper";
import Animated, { FadeInUp } from "react-native-reanimated";
import { AIInsight } from "../../services/aiAdvisor";

interface Props {
  insight: AIInsight;
  onAction?: (insight: AIInsight) => void;
  index?: number;
}

export const AIInsightsCard = ({ insight, onAction, index = 0 }: Props) => {
  const theme = useTheme();

  const getColors = () => {
    switch (insight.type) {
      case "warning":
        return {
          bg: theme.colors.errorContainer,
          text: theme.colors.onErrorContainer,
          icon: theme.colors.error,
        };
      case "praise":
        return {
          bg: theme.colors.primaryContainer,
          text: theme.colors.onPrimaryContainer,
          icon: theme.colors.primary,
        };
      case "prediction":
        return {
          bg: theme.colors.tertiaryContainer,
          text: theme.colors.onTertiaryContainer,
          icon: theme.colors.tertiary,
        };
      default:
        // tip, alert
        return {
          bg: theme.colors.surfaceVariant,
          text: theme.colors.onSurfaceVariant,
          icon: theme.colors.secondary,
        };
    }
  };

  const colors = getColors();

  return (
    <Animated.View entering={FadeInUp.delay(index * 100).springify()}>
      <Card style={[styles.card, { backgroundColor: colors.bg }]} mode="contained">
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Icon source={insight.icon} size={24} color={colors.icon} />
              <Text variant="titleMedium" style={[styles.title, { color: colors.text }]}>
                {insight.title}
              </Text>
            </View>
            {insight.impact === "high" && (
              <View style={[styles.badge, { backgroundColor: colors.icon }]}>
                <Text variant="labelSmall" style={{ color: theme.colors.surface }}>
                  Importante
                </Text>
              </View>
            )}
          </View>

          <Text variant="bodyMedium" style={[styles.message, { color: colors.text }]}>
            {insight.message}
          </Text>

          {insight.category && (
            <View style={styles.categoryTag}>
              <Icon source="tag-outline" size={14} color={colors.text} />
              <Text variant="labelSmall" style={{ marginLeft: 4, color: colors.text, opacity: 0.8 }}>
                {insight.category}
              </Text>
            </View>
          )}

          {insight.actionable && insight.suggestedAction && (
            <Button
              mode="contained"
              onPress={() => onAction?.(insight)}
              style={styles.actionButton}
              buttonColor={colors.icon}
              textColor={theme.colors.surface}
              icon="arrow-right"
              contentStyle={{ flexDirection: "row-reverse" }}
            >
              {insight.suggestedAction}
            </Button>
          )}
        </Card.Content>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  title: {
    marginLeft: 8,
    fontWeight: "bold",
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  message: {
    marginBottom: 12,
    lineHeight: 20,
  },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  actionButton: {
    marginTop: 8,
    alignSelf: "flex-end",
  },
});
