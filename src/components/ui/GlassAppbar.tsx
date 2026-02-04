import React from "react";
import { StyleSheet } from "react-native";
import { Appbar } from "react-native-paper";
import { useAppTheme } from "../../context/ThemeContext";
import { LiquidGlassSurface } from "./LiquidGlassSurface";

type Props = React.ComponentProps<typeof Appbar.Header>;

export function GlassAppbar({ style, ...rest }: Props) {
  const { isLiquidGlass, colors } = useAppTheme();

  if (!isLiquidGlass) {
    return <Appbar.Header {...rest} style={style} />;
  }

  const flattened = StyleSheet.flatten(style) || {};
  const { backgroundColor, elevation, shadowColor, shadowOffset, shadowOpacity, shadowRadius, ...sanitizedStyle } = flattened;

  return (
    <LiquidGlassSurface
      effect="clear"
      interactive={false}
      useBlurFallback={false}
      style={[styles.container, { borderBottomColor: colors.glassBorder }]}
    >
      <Appbar.Header {...rest} elevated={false} style={[styles.header, sanitizedStyle]} />
    </LiquidGlassSurface>
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
