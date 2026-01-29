import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from "react-native";
import { ActivityIndicator, useTheme } from "react-native-paper";

const { width } = Dimensions.get("window");

interface SyncLoadingProps {
  visible: boolean;
}

export const SyncLoadingScreen = ({ visible }: SyncLoadingProps) => {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />

      <View style={styles.content}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <MaterialCommunityIcons name="cloud-sync-outline" size={64} color={theme.colors.primary} />
        </Animated.View>

        <Text style={[styles.title, { color: theme.colors.primary }]}>Sincronizando dados</Text>

        <Text style={styles.subtitle}>Estamos recuperando suas finanças do servidor...</Text>

        <View style={styles.indicatorContainer}>
          <ActivityIndicator animating={true} color={theme.colors.primary} size="small" />
          <Text style={styles.pleaseWait}>Por favor, aguarde.</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  content: {
    alignItems: "center",
    padding: 30,
    backgroundColor: "rgba(30,30,30,0.9)",
    borderRadius: 20,
    width: width * 0.85,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#ccc",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  indicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pleaseWait: {
    fontSize: 12,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
