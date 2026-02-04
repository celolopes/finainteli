import { LiquidGlassView, isLiquidGlassSupported } from "@callstack/liquid-glass";
import { BlurView } from "expo-blur";
import React from "react";
import { ColorValue, Platform, StyleProp, View, ViewStyle } from "react-native";

type BlurTint = React.ComponentProps<typeof BlurView>["tint"];
type BlurMethod = React.ComponentProps<typeof BlurView>["experimentalBlurMethod"];

type Props = {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  effect?: "clear" | "regular" | "none";
  tintColor?: ColorValue;
  interactive?: boolean;
  useBlurFallback?: boolean;
  blurIntensity?: number;
  blurTint?: BlurTint;
  blurMethod?: BlurMethod;
};

export function LiquidGlassSurface({
  style,
  children,
  effect = "clear",
  tintColor,
  interactive = false,
  useBlurFallback = true,
  blurIntensity = 80,
  blurTint = "systemUltraThinMaterial",
  blurMethod = "dimezisBlurView",
}: Props) {
  if (Platform.OS !== "ios") {
    return <View style={style}>{children}</View>;
  }

  if (isLiquidGlassSupported) {
    return (
      <LiquidGlassView style={style} effect={effect} tintColor={tintColor} interactive={interactive}>
        {children}
      </LiquidGlassView>
    );
  }

  if (!useBlurFallback) {
    return <View style={style}>{children}</View>;
  }

  return (
    <BlurView intensity={blurIntensity} tint={blurTint} experimentalBlurMethod={blurMethod} style={style}>
      {children}
    </BlurView>
  );
}
