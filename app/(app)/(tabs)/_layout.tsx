import { Tabs } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet } from "react-native";
import { Icon, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../../../src/context/ThemeContext";
import { LiquidGlassSurface } from "../../../src/components/ui/LiquidGlassSurface";

export default function TabLayout() {
  const theme = useTheme();
  const { t } = useTranslation();
  const isIos = Platform.OS === "ios";
  const { isLiquidGlass, colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const iosTabHeight = 88 + insets.bottom;
  const iosTabPaddingBottom = Math.max(insets.bottom, 18);
  const tabBarStyle = {
    backgroundColor: isIos ? "transparent" : theme.colors.elevation.level2,
    borderTopWidth: isIos ? (isLiquidGlass ? 0 : StyleSheet.hairlineWidth) : 0,
    borderWidth: isIos && isLiquidGlass ? StyleSheet.hairlineWidth : 0,
    borderColor: isLiquidGlass ? colors.glassBorder : "transparent",
    elevation: 0,
    height: isIos ? iosTabHeight : 68,
    paddingBottom: isIos ? iosTabPaddingBottom : 12,
    paddingTop: isIos ? 12 : 0,
    position: isIos ? "absolute" : "relative",
    marginHorizontal: isIos ? 10 : 0,
    marginBottom: isIos ? 6 : 0,
    borderRadius: isIos ? 42 : 0,
    overflow: "hidden",
    shadowColor: isIos ? "#000" : "transparent",
    shadowOpacity: isIos ? 0.25 : 0,
    shadowRadius: isIos ? 18 : 0,
    shadowOffset: isIos ? { width: 0, height: 8 } : { width: 0, height: 0 },
  } as const;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: isLiquidGlass ? "transparent" : theme.colors.background },
        headerTintColor: theme.colors.onBackground,
        headerTransparent: isLiquidGlass,
        headerShadowVisible: !isLiquidGlass,
        headerBackground: isLiquidGlass
          ? () => <LiquidGlassSurface effect="clear" useBlurFallback={false} style={StyleSheet.absoluteFill} />
          : undefined,
        tabBarStyle,
        tabBarBackground: () =>
          isIos ? (
            <LiquidGlassSurface
              effect="regular"
              blurIntensity={96}
              blurTint="systemThinMaterialDark"
              style={StyleSheet.absoluteFill}
            />
          ) : undefined,
        tabBarActiveTintColor: isIos && isLiquidGlass ? "#ffffff" : theme.colors.primary,
        tabBarInactiveTintColor: isIos && isLiquidGlass ? "rgba(255,255,255,0.7)" : theme.colors.onSurfaceVariant,
        tabBarItemStyle: isIos ? { paddingTop: 4 } : undefined,
        tabBarLabelStyle: isIos ? { marginTop: 6, fontSize: 13, fontWeight: "600" } : undefined,
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
          headerShown: false,
          title: "Relatórios",
          tabBarIcon: ({ color, size }) => <Icon source="chart-box" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          headerShown: false,
          title: t("tabs.goals"),
          tabBarIcon: ({ color, size }) => <Icon source="target" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          headerShown: false,
          title: t("tabs.advisor"),
          tabBarIcon: ({ color, size }) => <Icon source="robot" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
