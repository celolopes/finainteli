import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Avatar, IconButton, Text, useTheme } from "react-native-paper";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/authStore";

export const UserHeader = () => {
  const theme = useTheme();
  const { user, profile } = useAuthStore();
  const insets = useSafeAreaInsets();

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Usuário";
  const avatarUrl = profile?.avatar_url;

  const greeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Bom dia";
    if (hours < 18) return "Boa tarde";
    return "Boa noite";
  };

  const Content = (
    <View style={styles.contentContainer}>
      <View style={styles.userInfo}>
        {avatarUrl ? <Avatar.Image size={48} source={{ uri: avatarUrl }} style={styles.avatar} /> : <Avatar.Text size={48} label={displayName.substring(0, 2).toUpperCase()} style={styles.avatar} />}
        <View style={styles.textContainer}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, opacity: 0.8 }}>
            {greeting()},
          </Text>
          <Text variant="titleLarge" style={{ fontWeight: "bold", color: theme.colors.onSurface }}>
            {displayName}
          </Text>
        </View>
      </View>
      <IconButton icon="bell-outline" iconColor={theme.colors.onSurface} size={24} onPress={() => {}} />
    </View>
  );

  if (Platform.OS === "ios") {
    return (
      <View style={styles.containerIOS}>
        <BlurView intensity={80} tint={theme.dark ? "dark" : "light"} style={[styles.blur, { paddingTop: insets.top + 10 }]}>
          <Animated.View entering={FadeInDown.delay(100).springify()}>{Content}</Animated.View>
        </BlurView>
      </View>
    );
  }

  // Android (M3 Style)
  return (
    <View style={[styles.containerAndroid, { backgroundColor: theme.colors.surface, paddingTop: insets.top + 20 }]}>
      <Animated.View entering={FadeInDown.delay(100).springify()}>{Content}</Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerIOS: {
    marginBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  blur: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  containerAndroid: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
  },
  contentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    marginRight: 12,
    backgroundColor: "#6C63FF", // Fallback color
  },
  textContainer: {
    justifyContent: "center",
  },
});
