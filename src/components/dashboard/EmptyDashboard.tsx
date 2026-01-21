import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Icon, Text, useTheme } from "react-native-paper";
import Animated, { FadeInUp } from "react-native-reanimated";

export const EmptyDashboard = () => {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(300)} style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
          <Icon source="wallet-plus" size={48} color={theme.colors.primary} />
        </View>

        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
          Comece sua jornada
        </Text>

        <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Adicione sua primeira conta bancária ou cartão para visualizar seus insights financeiros aqui.
        </Text>

        <Button
          mode="contained"
          onPress={() => router.push("/(app)/onboarding" as any)} // Rota a ser criada
          style={styles.button}
          contentStyle={{ height: 48 }}
        >
          Configurar Finanças
        </Button>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
  },
  content: {
    alignItems: "center",
    width: "100%",
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 32,
    opacity: 0.8,
  },
  button: {
    width: "100%",
    borderRadius: 12,
  },
});
