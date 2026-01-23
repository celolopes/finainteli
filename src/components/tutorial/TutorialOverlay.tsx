import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, StyleSheet, View } from "react-native";
import { Button, IconButton, Surface, Text, useTheme } from "react-native-paper";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTutorial } from "../../context/TutorialContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Configuração da animação "Fluida"
const SPRING_CONFIG = {
  damping: 18,
  stiffness: 120,
};

export const TutorialOverlay = () => {
  const { isActive, currentStep, targets, nextStep, skipTutorial } = useTutorial();
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Valores animados do "Buraco" (Spotlight)
  const spotTop = useSharedValue(SCREEN_HEIGHT / 2);
  const spotLeft = useSharedValue(SCREEN_WIDTH / 2);
  const spotWidth = useSharedValue(0);
  const spotHeight = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isActive && currentStep) {
      const target = targets[currentStep.targetId];
      if (target) {
        // padding no spotlight para não colar no elemento
        const PADDING = 16;
        // Offset vertical manual para corrigir o deslocamento (titles sendo cortados)
        const VERTICAL_OFFSET = 25;

        spotTop.value = withSpring(target.y - PADDING - VERTICAL_OFFSET, SPRING_CONFIG);
        spotLeft.value = withSpring(target.x - PADDING, SPRING_CONFIG);
        spotWidth.value = withSpring(target.width + PADDING * 2, SPRING_CONFIG);
        spotHeight.value = withSpring(target.height + PADDING * 2 + VERTICAL_OFFSET, SPRING_CONFIG); // Aumentar altura também se offset subir
        opacity.value = withTiming(1);
      }
    } else {
      opacity.value = withTiming(0);
    }
  }, [isActive, currentStep, targets]);

  // Estilo do Overlay (Hack da Borda Gigante)
  // Cria um "buraco" transparente cercado por bordas escuras gigantes
  const overlayStyle = useAnimatedStyle(() => {
    return {
      top: spotTop.value - 1000, // Move a borda gigante para centralizar o buraco
      left: spotLeft.value - 1000,
      width: spotWidth.value + 2000, // Compensa o top/left negativo e adiciona tamanho
      height: spotHeight.value + 2000,
      opacity: opacity.value,
      borderWidth: 1000, // A "Mascara"
    };
  });

  // Estilo do Tooltip (posicionado dinamicamente)
  const tooltipStyle = useAnimatedStyle(() => {
    // Tenta posicionar abaixo, se não der, acima
    const isBottom = spotTop.value + spotHeight.value + 150 < SCREEN_HEIGHT;
    const topPos = isBottom ? spotTop.value + spotHeight.value + 20 : spotTop.value - 160;

    return {
      position: "absolute",
      left: 16,
      right: 16,
      top: topPos,
      opacity: opacity.value,
    };
  });

  if (!isActive || !currentStep) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]} pointerEvents="box-none">
      {/* O Spotlight Overlay (Mascara) */}
      <Animated.View style={[styles.spotlight, { borderColor: "rgba(0,0,0,0.85)" }, overlayStyle]} />

      {/* Borda de Destaque (Visual Indicator) */}
      <Animated.View
        style={[
          {
            position: "absolute",
            borderRadius: 16,
            borderWidth: 2,
            borderColor: "white", // Ou theme.colors.primary para cor temática
            top: spotTop,
            left: spotLeft,
            width: spotWidth,
            height: spotHeight,
            opacity: opacity,
          },
        ]}
      />

      {/* Tooltip Card */}
      <Animated.View style={tooltipStyle}>
        <Surface style={[styles.card, { backgroundColor: theme.colors.elevation.level3 }]} elevation={5}>
          <View style={styles.cardContent}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={styles.headerRow}>
                <Text variant="titleMedium" style={{ fontWeight: "bold", color: theme.colors.primary }}>
                  {currentStep.title}
                </Text>
              </View>
              <Text variant="bodyMedium" style={{ marginTop: 8, color: theme.colors.onSurface }}>
                {currentStep.description}
              </Text>
            </View>
            <IconButton icon="close" size={20} onPress={skipTutorial} iconColor={theme.colors.onSurfaceVariant} />
          </View>

          <View style={styles.actions}>
            <Button compact onPress={skipTutorial} textColor={theme.colors.onSurfaceVariant}>
              {t("tutorial.skip")}
            </Button>
            <Button mode="contained" onPress={nextStep}>
              {t("tutorial.next")}
            </Button>
          </View>
        </Surface>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  spotlight: {
    position: "absolute",
    borderRadius: 16,
  },
  card: {
    borderRadius: 20,
    padding: 20,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
});
