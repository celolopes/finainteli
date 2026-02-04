import React from "react";
import { Pressable, StyleSheet, StyleProp, View, ViewStyle } from "react-native";
import { FAB, Icon } from "react-native-paper";
import { useAppTheme } from "../../context/ThemeContext";
import { LiquidGlassSurface } from "./LiquidGlassSurface";

type Props = {
  icon: React.ComponentProps<typeof FAB>["icon"];
  onPress: React.ComponentProps<typeof FAB>["onPress"];
  onLongPress?: React.ComponentProps<typeof FAB>["onLongPress"];
  onPressIn?: React.ComponentProps<typeof FAB>["onPressIn"];
  onPressOut?: React.ComponentProps<typeof FAB>["onPressOut"];
  style?: StyleProp<ViewStyle>;
  color?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
};

export function GlassFAB(props: Props) {
  const { isLiquidGlass, colors } = useAppTheme();

  if (!isLiquidGlass) {
    return <FAB {...props} />;
  }

  const { style, icon, onPress, onLongPress, onPressIn, onPressOut, color, disabled, accessibilityLabel, accessibilityHint, testID } = props;
  const flattened = StyleSheet.flatten(style) || {};
  const {
    backgroundColor,
    elevation,
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
    width,
    height,
    ...sanitizedStyle
  } = flattened;

  const size = typeof width === "number" ? width : 56;
  const finalHeight = typeof height === "number" ? height : size;
  const radius = Math.min(size, finalHeight) / 2;
  const iconSize = Math.round(Math.min(size, finalHeight) * 0.45);
  const iconColor = color ?? colors.text;
  const tintOverlayColor = typeof backgroundColor === "string" ? backgroundColor : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      testID={testID}
      style={[
        styles.base,
        {
          width: size,
          height: finalHeight,
          borderRadius: radius,
          borderColor: colors.glassBorder,
        },
        sanitizedStyle,
      ]}
    >
      <LiquidGlassSurface
        effect="clear"
        interactive={true}
        useBlurFallback={false}
        style={StyleSheet.absoluteFill}
      />
      {tintOverlayColor ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: tintOverlayColor, opacity: 0.18 }]} /> : null}
      <Icon source={icon as any} size={iconSize} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
