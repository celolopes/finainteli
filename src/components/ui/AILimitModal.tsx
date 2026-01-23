import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { Button, Icon, MD3Theme, Modal, Portal, Text, useTheme } from "react-native-paper";
import Animated, { BounceIn, FadeIn } from "react-native-reanimated";

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onUpgrade: () => void;
  remainingTime?: string;
}

/**
 * Modal exibido quando o usuário atinge o limite de IA gratuita
 */
export const AILimitModal = ({ visible, onDismiss, onUpgrade, remainingTime }: Props) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
        <Animated.View entering={FadeIn.duration(300)}>
          {/* Ícone de Limite */}
          <Animated.View entering={BounceIn.delay(100)} style={styles.iconContainer}>
            <View style={[styles.iconBg, { backgroundColor: theme.colors.errorContainer }]}>
              <Icon source="robot-off" size={48} color={theme.colors.error} />
            </View>
          </Animated.View>

          {/* Título */}
          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
            {t("transactions.ai.limitReached.title")}
          </Text>

          {/* Descrição */}
          <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
            {t("transactions.ai.limitReached.description")}
          </Text>

          {/* Tempo até reset */}
          {remainingTime && (
            <View style={[styles.resetBadge, { backgroundColor: theme.colors.secondaryContainer }]}>
              <Icon source="clock-outline" size={16} color={theme.colors.secondary} />
              <Text variant="labelMedium" style={{ color: theme.colors.secondary, marginLeft: 6 }}>
                {t("transactions.ai.limitReached.resetIn")} {remainingTime}
              </Text>
            </View>
          )}

          {/* Benefícios Pro */}
          <View style={styles.benefits}>
            <Text variant="titleSmall" style={{ color: theme.colors.primary, marginBottom: 12 }}>
              ✨ {t("transactions.ai.limitReached.proBenefits")}
            </Text>

            <BenefitItem icon="infinity" text={t("transactions.ai.limitReached.benefit1")} theme={theme} />
            <BenefitItem icon="chart-line" text={t("transactions.ai.limitReached.benefit2")} theme={theme} />
            <BenefitItem icon="shield-check" text={t("transactions.ai.limitReached.benefit3")} theme={theme} />
          </View>

          {/* Botões */}
          <View style={styles.buttons}>
            <Button mode="contained" onPress={onUpgrade} style={styles.upgradeButton} icon="crown">
              {t("transactions.ai.limitReached.upgrade")}
            </Button>

            <Button mode="text" onPress={onDismiss} style={styles.dismissButton}>
              {t("transactions.ai.limitReached.later")}
            </Button>
          </View>
        </Animated.View>
      </Modal>
    </Portal>
  );
};

/**
 * Item de benefício do Pro
 */
const BenefitItem = ({ icon, text, theme }: { icon: string; text: string; theme: MD3Theme }) => (
  <View style={styles.benefitItem}>
    <Icon source={icon} size={18} color={theme.colors.primary} />
    <Text variant="bodySmall" style={{ marginLeft: 10, color: theme.colors.onSurfaceVariant }}>
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  modal: {
    margin: 24,
    padding: 24,
    borderRadius: 24,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconBg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 12,
  },
  description: {
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  resetBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: "center",
    marginBottom: 20,
  },
  benefits: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  buttons: {
    gap: 8,
  },
  upgradeButton: {
    borderRadius: 12,
  },
  dismissButton: {
    marginTop: 4,
  },
});
