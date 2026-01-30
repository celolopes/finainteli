import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Icon, Surface, Text, useTheme } from "react-native-paper";
import Animated, { FadeInRight } from "react-native-reanimated";

import { useTranslation } from "react-i18next";

export const QuickActions = () => {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const actions = [
    { label: t("dashboard.actions.transaction"), icon: "plus", route: "/add-transaction", color: "#6C63FF" },
    { label: t("dashboard.actions.account"), icon: "bank", route: "/(app)/accounts", color: "#03DAC6" },
    { label: t("dashboard.actions.card"), icon: "credit-card", route: "/(app)/cards", color: "#FF4081" },
    { label: t("dashboard.actions.goal"), icon: "target", route: "/(app)/(tabs)/goals", color: "#FF9100" },
  ];

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
        {t("dashboard.quickActions")}
      </Text>
      <View style={styles.row}>
        {actions.map((action, index) => (
          <Animated.View key={action.label} entering={FadeInRight.delay(300 + index * 100).springify()} style={styles.actionWrapper}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => action.route !== "#" && router.push(action.route as any)}>
              <Surface style={[styles.iconContainer, { backgroundColor: theme.colors.elevation.level1 }]} elevation={1} aria-label={action.label}>
                <Icon source={action.icon} size={24} color={action.color} />
              </Surface>
              <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionWrapper: {
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18, // Squircle-ish
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    textAlign: "center",
    opacity: 0.8,
  },
});
