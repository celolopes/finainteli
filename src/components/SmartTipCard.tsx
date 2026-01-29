import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Badge, Button, Icon, Surface, Text, useTheme } from "react-native-paper";
import Animated, { FadeInUp } from "react-native-reanimated";

import { useAILimit } from "../hooks/useAILimit";
import { usePremium } from "../hooks/usePremium";
import { PaywallModal } from "./paywall/PaywallModal";
import { AILimitModal } from "./ui/AILimitModal";

interface Props {
  tip: string;
  onPressReport: () => void;
  onRefreshTip?: () => Promise<void>;
  loading?: boolean;
}

/**
 * Card de Dicas Inteligentes com limite de IA para usuários Free
 * - Free: 3 dicas/dia
 * - Pro: Ilimitado
 */
export const SmartTipCard = ({ tip, onPressReport, onRefreshTip, loading }: Props) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { isPro } = usePremium();

  // Hook de limite de IA
  const { canUseTip, remainingTips, resetTime, incrementTipUsage, isLoading: limitLoading } = useAILimit();

  // Modais
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Calcula tempo restante até reset em formato legível
   */
  const getTimeUntilReset = useCallback((): string => {
    if (!resetTime) return "";

    const now = new Date();
    const diff = resetTime.getTime() - now.getTime();

    if (diff <= 0) return "em breve";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  }, [resetTime]);

  /**
   * Handler para atualizar dica
   */
  const handleRefreshTip = async () => {
    // Verificar se pode usar (Free tem limite)
    if (!canUseTip && !isPro) {
      setShowLimitModal(true);
      return;
    }

    // Incrementar uso antes de gerar nova dica
    const success = await incrementTipUsage();
    if (!success && !isPro) {
      setShowLimitModal(true);
      return;
    }

    // Chamar função de refresh se existir
    if (onRefreshTip) {
      setRefreshing(true);
      try {
        await onRefreshTip();
      } finally {
        setRefreshing(false);
      }
    }
  };

  /**
   * Handler para upgrade
   */
  const handleUpgrade = () => {
    setShowLimitModal(false);
    setShowPaywall(true);
  };

  return (
    <>
      <Animated.View entering={FadeInUp.delay(300)}>
        <Surface style={[styles.card, { backgroundColor: theme.colors.elevation.level2 }]} elevation={2}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Icon source="creation" size={24} color={theme.colors.primary} />
              <Text variant="titleMedium" style={{ marginLeft: 8, color: theme.colors.primary, fontWeight: "bold" }}>
                {t("dashboard.insight")}
              </Text>
            </View>

            {/* Badge de uso restante (apenas para Free) */}
            {!isPro && !limitLoading && (
              <Badge
                size={22}
                style={[
                  styles.usageBadge,
                  {
                    backgroundColor: remainingTips > 1 ? theme.colors.primary : theme.colors.error,
                    color: remainingTips > 1 ? theme.colors.onPrimary : theme.colors.onError,
                  },
                ]}
              >
                {remainingTips === Infinity ? "∞" : remainingTips}
              </Badge>
            )}
          </View>

          {/* Conteúdo da Dica */}
          <Text variant="bodyMedium" style={styles.content}>
            {loading || refreshing ? t("common.loading") : tip}
          </Text>

          {/* Contador de uso (apenas para Free) */}
          {!isPro && !limitLoading && (
            <View style={[styles.usageInfo, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Icon source="lightbulb-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text variant="labelSmall" style={{ marginLeft: 6, color: theme.colors.onSurfaceVariant }}>
                {remainingTips > 0 ? t("ai.remainingTips", "{{count}} dicas restantes hoje", { count: remainingTips }) : t("ai.noTipsLeft", "Limite atingido hoje")}
              </Text>
            </View>
          )}

          {/* Botões de Ação */}
          <View style={styles.actions}>
            {/* Botão de Nova Dica */}
            {onRefreshTip && (
              <Button mode="outlined" onPress={handleRefreshTip} style={styles.button} icon="refresh" disabled={loading || refreshing} loading={refreshing}>
                {t("ai.newTip", "Nova Dica")}
              </Button>
            )}

            {/* Botão de Relatório */}
            <Button mode="contained-tonal" onPress={onPressReport} style={styles.button} icon="chart-box-outline">
              {t("dashboard.viewReport")}
            </Button>
          </View>

          {/* Badge Pro */}
          {isPro && (
            <View style={[styles.proBadge, { backgroundColor: theme.colors.primaryContainer }]}>
              <Icon source="crown" size={14} color={theme.colors.primary} />
              <Text variant="labelSmall" style={{ marginLeft: 4, color: theme.colors.primary, fontWeight: "bold" }}>
                PRO
              </Text>
            </View>
          )}
        </Surface>
      </Animated.View>

      {/* Modal de Limite Atingido */}
      <AILimitModal visible={showLimitModal} onDismiss={() => setShowLimitModal(false)} onUpgrade={handleUpgrade} remainingTime={getTimeUntilReset()} />

      {/* Paywall Modal */}
      <PaywallModal visible={showPaywall} onDismiss={() => setShowPaywall(false)} onSuccess={() => setShowPaywall(false)} />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    position: "relative",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  usageBadge: {
    fontWeight: "bold",
  },
  content: {
    marginBottom: 12,
    lineHeight: 22,
  },
  usageInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
  },
  proBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
});
