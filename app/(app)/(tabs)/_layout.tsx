import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet } from "react-native";
import { Icon, useTheme } from "react-native-paper";

export default function TabLayout() {
  const theme = useTheme();
  const { t } = useTranslation();
  const isIos = Platform.OS === "ios";

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.onBackground,
        tabBarStyle: {
          backgroundColor: isIos ? "transparent" : theme.colors.elevation.level2,
          borderTopWidth: 0,
          elevation: 0,
          height: isIos ? 88 : 68,
          paddingBottom: isIos ? 28 : 12,
          position: isIos ? "absolute" : "relative",
        },
        tabBarBackground: () => (isIos ? <BlurView intensity={80} tint={theme.dark ? "dark" : "light"} style={StyleSheet.absoluteFill} /> : undefined),
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Icon source="home-variant" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: t("tabs.transactions"),
          tabBarIcon: ({ color, size }) => <Icon source="format-list-bulleted" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Relatórios",
          tabBarIcon: ({ color, size }) => <Icon source="chart-box" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: t("tabs.goals"),
          tabBarIcon: ({ color, size }) => <Icon source="target" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t("tabs.advisor"),
          tabBarIcon: ({ color, size }) => <Icon source="robot" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
