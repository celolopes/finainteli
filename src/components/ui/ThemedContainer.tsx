import { BlurView } from "expo-blur";
import React from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { Surface } from "react-native-paper";
import { useAppTheme } from "../../context/ThemeContext";

interface GlassProps extends ViewStyle {
  intensity?: number;
}

interface Props {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  intensity?: number;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5; // Material elevation
}

export function ThemedContainer({ style, children, intensity = 50, elevation = 0 }: Props) {
  const { isGlass, colors, isDark } = useAppTheme();

  if (isGlass) {
    // iOS Liquid Glass
    return (
      <BlurView
        intensity={intensity}
        tint={isDark ? "dark" : "light"}
        experimentalBlurMethod="dimezisBlurView" // Better performance
        style={[
          styles.glass,
          {
            backgroundColor: colors.glass,
            borderColor: colors.glassBorder,
          },
          style,
        ]}
      >
        {children}
      </BlurView>
    );
  }

  // Android Material Surface
  return (
    <Surface elevation={elevation} style={[styles.surface, { backgroundColor: colors.surface }, style]}>
      {children}
    </Surface>
  );
}

const styles = StyleSheet.create({
  glass: {
    overflow: "hidden",
    borderWidth: 1,
  },
  surface: {
    // Material standard
  },
});
