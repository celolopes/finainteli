import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { Dimensions, Image, StyleSheet } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const { width, height } = Dimensions.get("window");

interface AnimatedSplashScreenProps {
  onAnimationFinish?: () => void;
  isVisible: boolean;
}

export function AnimatedSplashScreen({ onAnimationFinish, isVisible }: AnimatedSplashScreenProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const containerOpacity = useSharedValue(1);
  const gradientScale = useSharedValue(1);

  useEffect(() => {
    if (isVisible) {
      // Entry animation: Smooth zoom and fade in
      opacity.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) });
      scale.value = withSpring(1, { damping: 12, stiffness: 90 });

      // Subtle constant pulse for the background/gradient
      gradientScale.value = withSequence(withTiming(1.1, { duration: 3000, easing: Easing.inOut(Easing.ease) }), withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }));
    } else {
      // Elegant Exit: Logo zooms in while background fades
      containerOpacity.value = withTiming(
        0,
        {
          duration: 900,
          easing: Easing.inOut(Easing.quad),
        },
        (finished) => {
          if (finished && onAnimationFinish) {
            scheduleOnRN(onAnimationFinish);
          }
        },
      );

      scale.value = withTiming(2.5, {
        duration: 900,
        easing: Easing.in(Easing.exp),
      });
    }
  }, [isVisible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    transform: [{ scale: gradientScale.value }],
  }));

  const reflectionStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.1,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      {/* Dynamic Background Background */}
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
        <LinearGradient colors={["#1C1B1F", "#2D2A33", "#1C1B1F"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      </Animated.View>

      {/* Main Logo */}
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Image source={require("../../../assets/images/logo-modal.png")} style={styles.logo} resizeMode="contain" />
      </Animated.View>

      {/* Subtle light reflection effect */}
      <Animated.View style={[styles.reflection, reflectionStyle]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1C1B1F", // fallback
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99999,
  },
  logoContainer: {
    width: width * 0.6,
    height: width * 0.6,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    // Soft shadow for the logo
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  reflection: {
    position: "absolute",
    width: width * 1.5,
    height: height * 0.5,
    backgroundColor: "#D0BCFF",
    borderRadius: width,
    transform: [{ rotate: "-45deg" }, { translateY: -height * 0.2 }],
    zIndex: 1,
    opacity: 0.05,
  },
});
