import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Icon, Surface, Text, useTheme } from "react-native-paper";
import Animated, { FadeInUp } from "react-native-reanimated";

interface Props {
  tip: string;
  onPressReport: () => void;
  loading?: boolean;
}

import { useTranslation } from "react-i18next";

export const SmartTipCard = ({ tip, onPressReport, loading }: Props) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Animated.View entering={FadeInUp.delay(300)}>
      <Surface style={[styles.card, { backgroundColor: theme.colors.elevation.level2 }]} elevation={2}>
        <View style={styles.header}>
          <Icon source="creation" size={24} color={theme.colors.primary} />
          <Text variant="titleMedium" style={{ marginLeft: 8, color: theme.colors.primary, fontWeight: "bold" }}>
            {t("dashboard.insight")}
          </Text>
        </View>

        <Text variant="bodyMedium" style={styles.content}>
          {loading ? t("common.loading") : tip}
        </Text>

        <Button mode="contained-tonal" onPress={onPressReport} style={styles.button} icon="chart-box-outline">
          {t("dashboard.viewReport")}
        </Button>
      </Surface>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  content: {
    marginBottom: 16,
    lineHeight: 22,
  },
  button: {
    alignSelf: "flex-start",
  },
});
