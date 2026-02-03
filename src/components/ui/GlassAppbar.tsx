import { BlurView } from "expo-blur";
import React from "react";
import { StyleSheet } from "react-native";
import { Appbar } from "react-native-paper";
import { useAppTheme } from "../../context/ThemeContext";

type Props = React.ComponentProps<typeof Appbar.Header>;

export function GlassAppbar({ style, ...rest }: Props) {
  const { isLiquidGlass, colors } = useAppTheme();

  if (!isLiquidGlass) {
    return <Appbar.Header {...rest} style={style} />;
  }

  const flattened = StyleSheet.flatten(style) || {};
  const { backgroundColor, elevation, shadowColor, shadowOffset, shadowOpacity, shadowRadius, ...sanitizedStyle } = flattened;

  return (
    <BlurView intensity={80} tint="systemThinMaterial" style={[styles.container, { borderBottomColor: colors.glassBorder }]}>
      <Appbar.Header {...rest} elevated={false} style={[styles.header, sanitizedStyle]} />
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: {
    backgroundColor: "transparent",
    elevation: 0,
  },
});
