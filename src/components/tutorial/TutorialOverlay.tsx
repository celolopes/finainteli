import React, { useEffect } from "react";
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
        const PADDING = 8;
        spotTop.value = withSpring(target.y - PADDING, SPRING_CONFIG);
        spotLeft.value = withSpring(target.x - PADDING, SPRING_CONFIG);
        spotWidth.value = withSpring(target.width + PADDING * 2, SPRING_CONFIG);
        spotHeight.value = withSpring(target.height + PADDING * 2, SPRING_CONFIG);
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
    const topPos = isBottom ? spotTop.value + spotHeight.value + 20 : spotTop.value - 150; // Altura estimada do card

    return {
      position: "absolute",
      left: 20, // Margem fixa lateral
      right: 20,
      top: topPos,
      opacity: opacity.value,
    };
  });

  if (!isActive || !currentStep) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]} pointerEvents="box-none">
      {/* O Spotlight Overlay (intercepta toques fora do buraco?) */}
      {/* Na verdade, pointerEvents="auto" na view gigante bloqueia tudo, inclusive o buraco se tiver bg transparente mas fizer parte da view. O buraco é o 'content' da view com bordas. O content é transparente e CLICA? Sim. */}
      {/* Para bloquear toques *fora*, precisamos de uma view full screen transparente atrás. */}

      <Animated.View style={[styles.spotlight, { borderColor: "rgba(0,0,0,0.85)" }, overlayStyle]} />

      {/* Tooltip Card */}
      <Animated.View style={tooltipStyle}>
        <Surface style={styles.card} elevation={4}>
          <View style={styles.cardContent}>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={{ fontWeight: "bold", color: theme.colors.primary }}>
                {currentStep.title}
              </Text>
              <Text variant="bodyMedium" style={{ marginTop: 8 }}>
                {currentStep.description}
              </Text>
            </View>
            <IconButton icon="close" size={20} onPress={skipTutorial} />
          </View>

          <View style={styles.actions}>
            <Button compact onPress={skipTutorial}>
              Pular
            </Button>
            <Button mode="contained" compact onPress={nextStep}>
              Próximo
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
    borderRadius: 16, // Arredondar o buraco
    // O hack funciona assim: a view tem tamanho width/height do buraco.
    // As bordas são gigantes para fora.
  },
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: "white",
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
});
