import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Appbar, Card, Divider, Text, useTheme } from "react-native-paper";
import { GlassAppbar } from "../../../../src/components/ui/GlassAppbar";
import { PieChart } from "react-native-gifted-charts";
import { CountUp } from "use-count-up";
import { buildThemePalette, lightenColor, withAlpha } from "../../../../src/components/reports/chartUtils";
import { USD_TO_BRL_RATE } from "../../../../src/constants/aiPricing";
import { AIUsageRepository } from "../../../../src/database/repositories/aiUsageRepository";

type FeatureChartItem = { label: string; value: number; color: string };

export default function AIUsageDashboard() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [featureData, setFeatureData] = useState<FeatureChartItem[]>([]);
  const totalFeatureCost = featureData.reduce((sum, item) => sum + item.value, 0);
  const isDark = theme.dark;

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

      const pieColors = buildThemePalette(theme.colors, theme.dark);

      const featureChartData = Object.entries(breakdown).map(([name, data], index) => ({
        label: name,
        value: data.totalCost,
        color: pieColors[index % pieColors.length],
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
      <GlassAppbar style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t("debug.aiUsage")} />
      </GlassAppbar>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Summary Info */}
        <View style={styles.row}>
          <Card style={styles.card} aria-label="Custo Total da IA">
            <Card.Content>
              <Text variant="labelMedium" style={{ opacity: 0.7 }}>
                {t("debug.totalCost")}
              </Text>
              <Text variant="headlineSmall" style={{ fontWeight: "bold" }}>
                R${" "}
                <CountUp
                  isCounting
                  end={stats.totalCost}
                  duration={1}
                  formatter={(value) =>
                    value.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  }
                  key={`total-cost-${stats.totalCost}`}
                />
              </Text>
            </Card.Content>
          </Card>
          <Card style={styles.card} aria-label="Total de Tokens Utilizados">
            <Card.Content>
              <Text variant="labelMedium" style={{ opacity: 0.7 }}>
                {t("debug.totalTokens")}
              </Text>
              <Text variant="headlineSmall" style={{ fontWeight: "bold" }}>
                <CountUp
                  isCounting
                  end={stats.totalTokens / 1000}
                  duration={1}
                  formatter={(value) =>
                    value.toLocaleString("pt-BR", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })
                  }
                  key={`total-tokens-${stats.totalTokens}`}
                />
                k
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
              <View
                style={[
                  styles.pieChart,
                  isDark && {
                    borderWidth: 1,
                    borderColor: withAlpha(theme.colors.primary, 0.2),
                    borderRadius: 18,
                    shadowColor: theme.colors.primary,
                    shadowOpacity: 0.22,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 3,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
              >
                <PieChart
                  data={featureData.map((item) => ({
                    value: item.value,
                    color: item.color,
                    gradientCenterColor: isDark ? lightenColor(item.color, 0.18) : undefined,
                    text: item.label,
                  }))}
                  donut
                  radius={110}
                  innerRadius={50}
                  showText={false}
                  isAnimated
                  animationDuration={700}
                  showGradient={isDark}
                  strokeWidth={1}
                  strokeColor={withAlpha(theme.colors.background, isDark ? 0.4 : 0.2)}
                  centerLabelComponent={() => (
                    <View style={styles.centerLabel}>
                      <Text variant="labelSmall" style={{ opacity: 0.7 }}>
                        Total IA
                      </Text>
                      <Text variant="titleMedium" style={{ fontWeight: "700" }}>
                        R${" "}
                        <CountUp
                          isCounting
                          end={totalFeatureCost}
                          duration={0.8}
                          formatter={(value) =>
                            value.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          }
                          key={`feature-total-${totalFeatureCost}`}
                        />
                      </Text>
                    </View>
                  )}
                />
              </View>
              <View style={styles.legend}>
                {featureData.map((item) => (
                  <View key={item.label} style={styles.legendRow}>
                    <View
                      style={[
                        styles.legendSwatch,
                        { backgroundColor: item.color },
                        isDark && {
                          shadowColor: item.color,
                          shadowOpacity: 0.7,
                          shadowRadius: 6,
                          shadowOffset: { width: 0, height: 0 },
                          elevation: 3,
                        },
                      ]}
                    />
                    <Text style={styles.legendLabel}>{item.label}</Text>
                    <Text style={styles.legendValue}>
                      R${" "}
                      <CountUp
                        isCounting
                        end={item.value}
                        duration={0.6}
                        formatter={(value) =>
                          value.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        }
                        key={`${item.label}-${item.value}`}
                      />
                    </Text>
                  </View>
                ))}
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
  pieChart: { height: 220, alignItems: "center", justifyContent: "center" },
  centerLabel: { alignItems: "center", justifyContent: "center", gap: 4 },
  legend: { marginTop: 12, gap: 8 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendSwatch: { width: 10, height: 10, borderRadius: 2 },
  legendLabel: { flex: 1 },
  legendValue: { opacity: 0.7 },
});
