import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ProgressBar, Text, useTheme } from "react-native-paper";

interface UpdateModalProps {
  isVisible: boolean;
}

export const UpdateModal = ({ isVisible }: UpdateModalProps) => {
  const theme = useTheme();
  const [progress, setProgress] = useState(0);

  // Simulation of "Real" progress
  useEffect(() => {
    if (!isVisible) return;

    let interval: any;
    const simulateProgress = () => {
      setProgress((prev) => {
        if (prev >= 0.9) return prev; // Stall at 90% until done
        const increment = Math.random() * 0.1;
        return Math.min(prev + increment, 0.9);
      });
    };

    interval = setInterval(simulateProgress, 500);
    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <View style={[styles.content, { backgroundColor: theme.colors.elevation.level3 }]}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="cloud-download" size={32} color={theme.colors.primary} />
          <Text variant="titleMedium" style={{ fontWeight: "bold", marginLeft: 12 }}>
            Atualizando...
          </Text>
        </View>

        <Text variant="bodyMedium" style={{ marginBottom: 16, marginTop: 8 }}>
          Estamos baixando a nova versão do FinAInteli para você.
        </Text>

        <ProgressBar progress={progress} color={theme.colors.primary} style={{ height: 8, borderRadius: 4 }} indeterminate={false} />

        <Text variant="labelSmall" style={{ marginTop: 8, textAlign: "right", color: theme.colors.outline }}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)", // Dim background of Splash
    justifyContent: "flex-end", // Bottom aligned
    zIndex: 200000, // Higher than Splash
    elevation: 20, // Android zIndex equivalent
  },
  content: {
    padding: 24,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 64, // Raise it up a bit
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
});
