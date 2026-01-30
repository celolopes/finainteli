import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { Avatar, IconButton, Text, useTheme } from "react-native-paper";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../store/authStore";
import { SyncIndicator } from "../ui/SyncIndicator";

export const UserHeader = () => {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { user, profile } = useAuthStore();
  const insets = useSafeAreaInsets();

  const displayName = profile?.display_name || user?.email?.split("@")[0] || t("common.user");
  const avatarUrl = profile?.avatar_url;

  const greeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return t("common.greetings.morning");
    if (hours < 18) return t("common.greetings.afternoon");
    return t("common.greetings.night");
  };

  const Content = (
    <View style={styles.contentContainer}>
      <TouchableOpacity style={styles.userInfo} onPress={() => router.push("/settings" as any)}>
        {avatarUrl ? <Avatar.Image size={48} source={{ uri: avatarUrl }} style={styles.avatar} /> : <Avatar.Text size={48} label={displayName.substring(0, 2).toUpperCase()} style={styles.avatar} />}
        <View style={styles.textContainer}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, opacity: 0.8 }}>
            {greeting()},
          </Text>
          <Text variant="titleLarge" style={{ fontWeight: "bold", color: theme.colors.onSurface }}>
            {displayName}
          </Text>
        </View>
      </TouchableOpacity>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <SyncIndicator />
        <IconButton icon="bell-outline" iconColor={theme.colors.onSurface} size={24} onPress={() => {}} />
      </View>
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
    shadowColor: "#121212",
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
