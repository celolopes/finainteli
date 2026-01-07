import React from "react";
import { Tabs } from "expo-router";
import { useTheme, Icon, Text } from "react-native-paper";
import { Platform } from "react-native";

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.onBackground,
        tabBarStyle: {
          backgroundColor: theme.colors.elevation.level2,
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === "ios" ? 88 : 68,
          paddingBottom: Platform.OS === "ios" ? 28 : 12,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerTitle: "FinAInteli",
          tabBarIcon: ({ color, size }) => <Icon source="home-variant" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarIcon: ({ color, size }) => <Icon source="format-list-bulleted" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "Goals",
          tabBarIcon: ({ color, size }) => <Icon source="target" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Advisor",
          tabBarIcon: ({ color, size }) => <Icon source="robot" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
