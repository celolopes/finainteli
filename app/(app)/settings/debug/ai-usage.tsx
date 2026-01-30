import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Appbar, Card, Divider, Text, useTheme } from "react-native-paper";
import { VictoryPie } from "victory-native";
import { USD_TO_BRL_RATE } from "../../../../src/constants/aiPricing";
import { AIUsageRepository } from "../../../../src/database/repositories/aiUsageRepository";

const { width } = Dimensions.get("window");

export default function AIUsageDashboard() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [featureData, setFeatureData] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const logs = await AIUsageRepository.getAllLogs();
      const breakdown = await AIUsageRepository.getFeatureBreakdown();

      let totalTokens = 0;
      let totalCost = 0;
      let inputTokens = 0;
      let outputTokens = 0;

      logs.forEach((log) => {
        totalTokens += log.totalTokens;
        totalCost += log.costBrl;
        inputTokens += log.promptTokens;
        outputTokens += log.candidatesTokens;
      });

      const featureChartData = Object.entries(breakdown).map(([name, data]) => ({
        x: name,
        y: data.totalCost,
        label: name,
      }));

      setStats({
        totalTokens,
        totalCost,
        inputTokens,
        outputTokens,
        avgCost: logs.length > 0 ? totalCost / logs.length : 0,
        count: logs.length,
      });
      setFeatureData(featureChartData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t("debug.aiUsage")} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Summary Info */}
        <View style={styles.row}>
          <Card style={styles.card} aria-label="Custo Total da IA">
            <Card.Content>
              <Text variant="labelMedium" style={{ opacity: 0.7 }}>
                {t("debug.totalCost")}
              </Text>
              <Text variant="headlineSmall" style={{ fontWeight: "bold" }}>
                R$ {stats.totalCost.toFixed(2)}
              </Text>
            </Card.Content>
          </Card>
          <Card style={styles.card} aria-label="Total de Tokens Utilizados">
            <Card.Content>
              <Text variant="labelMedium" style={{ opacity: 0.7 }}>
                {t("debug.totalTokens")}
              </Text>
              <Text variant="headlineSmall" style={{ fontWeight: "bold" }}>
                {(stats.totalTokens / 1000).toFixed(1)}k
              </Text>
            </Card.Content>
          </Card>
        </View>

        <Card style={styles.mainCard} aria-label="Detalhamento de Tokens">
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {t("debug.tokenBreakdown")}
            </Text>
            <View style={styles.detailRow}>
              <Text variant="bodyMedium">{t("debug.inputTokens")}</Text>
              <Text variant="bodyMedium">{stats.inputTokens.toLocaleString()}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.detailRow}>
              <Text variant="bodyMedium">{t("debug.outputTokens")}</Text>
              <Text variant="bodyMedium">{stats.outputTokens.toLocaleString()}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.detailRow}>
              <Text variant="bodyMedium">{t("debug.exchangeRate")}</Text>
              <Text variant="bodyMedium">{USD_TO_BRL_RATE.toFixed(2)}</Text>
            </View>
          </Card.Content>
        </Card>

        {featureData.length > 0 && (
          <Card style={styles.mainCard} aria-label="Uso por Funcionalidade">
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {t("debug.featureUsage")}
              </Text>
              <View style={{ alignItems: "center" }}>
                <VictoryPie
                  data={featureData}
                  width={width - 64}
                  height={220}
                  colorScale="qualitative"
                  innerRadius={50}
                  padAngle={2}
                  style={{
                    labels: { fill: theme.colors.onSurface, fontSize: 10 },
                  }}
                />
              </View>
            </Card.Content>
          </Card>
        )}

        <Text variant="labelLarge" style={styles.countText}>
          {stats.count} API calls logged
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16 },
  row: { flexDirection: "row", gap: 12, marginBottom: 12 },
  card: { flex: 1 },
  mainCard: { marginBottom: 16 },
  cardTitle: { marginBottom: 12, fontWeight: "bold" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  divider: { opacity: 0.3 },
  countText: { textAlign: "center", opacity: 0.5, marginTop: 16, marginBottom: 32 },
});
