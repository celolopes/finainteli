import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Icon, Text, useTheme } from "react-native-paper";

interface PaywallGateProps {
  feature: string;
  description: string;
  onUnlock: () => void;
  variant?: "fullscreen" | "card";
}

export function PaywallGate({ feature, description, onUnlock, variant = "fullscreen" }: PaywallGateProps) {
  const theme = useTheme();

  if (variant === "card") {
    return (
      <View style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Icon source="lock-outline" size={32} color={theme.colors.primary} />
        <View style={{ gap: 4, flex: 1 }}>
          <Text variant="titleMedium" style={{ fontWeight: "bold" }}>
            {feature}
          </Text>
          <Text variant="bodySmall">{description}</Text>
        </View>
        <Button mode="contained" onPress={onUnlock} compact>
          Desbloquear
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Icon source="crown" size={64} color={theme.colors.primary} />
      <Text variant="headlineSmall" style={{ marginTop: 24, fontWeight: "bold", textAlign: "center" }}>
        {feature}
      </Text>
      <Text variant="bodyLarge" style={{ textAlign: "center", marginTop: 8, marginBottom: 32, opacity: 0.7, paddingHorizontal: 32 }}>
        {description}
      </Text>
      <Button mode="contained" onPress={onUnlock} icon="lock-open" contentStyle={{ height: 48 }}>
        Desbloquear Premium
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 16,
    marginVertical: 8,
  },
});
