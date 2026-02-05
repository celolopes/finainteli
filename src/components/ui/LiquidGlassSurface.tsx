import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleProp, View, ViewStyle } from "react-native";

type BlurTint = React.ComponentProps<typeof BlurView>["tint"];
type BlurMethod = React.ComponentProps<typeof BlurView>["experimentalBlurMethod"];

type Props = {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  effect?: "clear" | "regular" | "none";
  useBlurFallback?: boolean;
  blurIntensity?: number;
  blurTint?: BlurTint;
  blurMethod?: BlurMethod;
};

/**
 * A surface component that provides blur effect on iOS and a simple view on Android.
 * This is a simplified version that no longer depends on @callstack/liquid-glass.
 */
export function LiquidGlassSurface({ style, children, effect = "clear", useBlurFallback = true, blurIntensity = 80, blurTint = "systemUltraThinMaterial", blurMethod = "dimezisBlurView" }: Props) {
  // On Android or when effect is "none", just render a simple View
  if (Platform.OS !== "ios" || effect === "none") {
    return <View style={style}>{children}</View>;
  }

  // On iOS, use BlurView
  if (useBlurFallback) {
    return (
      <BlurView intensity={blurIntensity} tint={blurTint} experimentalBlurMethod={blurMethod} style={style}>
        {children}
      </BlurView>
    );
  }

  return <View style={style}>{children}</View>;
}
