import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { Appbar, List, Surface, useTheme } from "react-native-paper";

export default function DebugMenuScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t("debug.title")} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Surface style={[styles.section, { backgroundColor: theme.colors.surface, borderRadius: 16 }]} elevation={1}>
          <List.Section>
            <List.Item
              title={t("debug.aiUsage")}
              left={(props) => <List.Icon {...props} icon="robot" color={theme.colors.primary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push("/(app)/settings/debug/ai-usage")}
            />
          </List.Section>
        </Surface>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  section: {
    marginBottom: 16,
    overflow: "hidden",
  },
});
