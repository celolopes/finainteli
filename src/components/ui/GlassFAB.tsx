import { BlurView } from "expo-blur";
import { type ComponentProps } from "react";
import { Platform, Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { FAB, Icon, useTheme } from "react-native-paper";

type FABProps = ComponentProps<typeof FAB>;

type Props = {
  icon: FABProps["icon"];
  onPress?: FABProps["onPress"];
  onLongPress?: FABProps["onLongPress"];
  style?: StyleProp<ViewStyle>;
  color?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
};

/**
 * A Floating Action Button with optional blur effect on iOS.
 * Uses native BlurView on iOS for a frosted glass appearance.
 */
export function GlassFAB(props: Props) {
  const theme = useTheme();
  const isIOS = Platform.OS === "ios";

  // On Android, just use a regular FAB
  if (!isIOS) {
    return (
      <FAB
        icon={props.icon}
        label={props.accessibilityLabel ?? ""}
        onPress={props.onPress}
        onLongPress={props.onLongPress}
        style={props.style}
        color={props.color}
        disabled={props.disabled}
        accessibilityLabel={props.accessibilityLabel}
        testID={props.testID}
      />
    );
  }

  const { style, icon, onPress, onLongPress, color, disabled, accessibilityLabel, accessibilityHint, testID } = props;

  // Extract style properties safely
  const flatStyle = style ? StyleSheet.flatten(style) : {};
  const { backgroundColor, width, height, ...sanitizedStyle } = (flatStyle || {}) as ViewStyle & { width?: number; height?: number };

  const size = typeof width === "number" ? width : 56;
  const finalHeight = typeof height === "number" ? height : size;
  const radius = Math.min(size, finalHeight) / 2;
  const iconSize = Math.round(Math.min(size, finalHeight) * 0.45);
  const iconColor = color ?? theme.colors.onPrimary;
  const bgColor = typeof backgroundColor === "string" ? backgroundColor : theme.colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      testID={testID}
      style={[
        styles.base,
        {
          width: size,
          height: finalHeight,
          borderRadius: radius,
          borderColor: theme.colors.outlineVariant,
        },
        sanitizedStyle as ViewStyle,
      ]}
    >
      <BlurView intensity={80} tint="systemUltraThinMaterial" style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: bgColor, opacity: 0.85 }]} />
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
