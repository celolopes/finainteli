import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";
import { Appbar, useTheme } from "react-native-paper";

type Props = React.ComponentProps<typeof Appbar.Header>;

/**
 * An Appbar with optional blur effect on iOS.
 * Uses native BlurView on iOS for a frosted glass appearance.
 */
export function GlassAppbar({ style, ...rest }: Props) {
  const theme = useTheme();
  const isIOS = Platform.OS === "ios";

  // On Android, just use a regular Appbar
  if (!isIOS) {
    return <Appbar.Header {...rest} style={style} />;
  }

  // Extract shadow properties from style to avoid passing them to BlurView
  const flatStyle = style ? StyleSheet.flatten(style) : {};
  const safeStyle: ViewStyle = {};

  // Copy only safe properties
  if (flatStyle && typeof flatStyle === "object") {
    const { backgroundColor: _bg, elevation: _el, shadowColor: _sc, shadowOffset: _so, shadowOpacity: _sop, shadowRadius: _sr, ...rest } = flatStyle as ViewStyle & { elevation?: number };
    Object.assign(safeStyle, rest);
  }

  return (
    <View style={[styles.container, { borderBottomColor: theme.colors.outlineVariant }]}>
      <BlurView intensity={80} tint="systemUltraThinMaterial" style={StyleSheet.absoluteFill} />
      <Appbar.Header {...rest} elevated={false} style={[styles.header, safeStyle]} />
    </View>
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
