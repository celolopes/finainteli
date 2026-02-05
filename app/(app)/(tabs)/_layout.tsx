import React from "react";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";
import { useTheme } from "react-native-paper";
import { NativeTabs } from "../../../src/components/ui/NativeBottomTabs";

// Material Icons URLs for Android fallback
const ANDROID_ICONS = {
  home: "https://fonts.gstatic.com/s/i/materialiconsoutlined/home/v1/24px.svg",
  list: "https://fonts.gstatic.com/s/i/materialiconsoutlined/list/v1/24px.svg",
  chart: "https://fonts.gstatic.com/s/i/materialiconsoutlined/bar_chart/v1/24px.svg",
  target: "https://fonts.gstatic.com/s/i/materialiconsoutlined/flag/v1/24px.svg",
  chat: "https://fonts.gstatic.com/s/i/materialiconsoutlined/chat/v1/24px.svg",
};

export default function TabLayout() {
  const theme = useTheme();
  const { t } = useTranslation();
  const isIos = Platform.OS === "ios";

  // Helper to get icon based on platform
  const getIcon = (iosSfSymbol: string, androidKey: keyof typeof ANDROID_ICONS) => {
    if (isIos) {
      return { sfSymbol: iosSfSymbol };
    }
    return { uri: ANDROID_ICONS[androidKey] };
  };

  return (
    <NativeTabs tabBarActiveTintColor={theme.colors.primary} tabBarInactiveTintColor={theme.colors.onSurfaceVariant} labeled={true} translucent={isIos}>
      <NativeTabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: () => getIcon("house.fill", "home"),
        }}
      />
      <NativeTabs.Screen
        name="transactions"
        options={{
          title: t("tabs.transactions"),
          tabBarIcon: () => getIcon("list.bullet", "list"),
        }}
      />
      <NativeTabs.Screen
        name="reports"
        options={{
          title: "Relatórios",
          tabBarIcon: () => getIcon("chart.bar.fill", "chart"),
        }}
      />
      <NativeTabs.Screen
        name="goals"
        options={{
          title: t("tabs.goals"),
          tabBarIcon: () => getIcon("target", "target"),
        }}
      />
      <NativeTabs.Screen
        name="chat"
        options={{
          title: t("tabs.advisor"),
          tabBarIcon: () => getIcon("bubble.left.and.bubble.right.fill", "chat"),
        }}
      />
    </NativeTabs>
  );
}
