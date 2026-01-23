import NetInfo from "@react-native-community/netinfo";
import React, { useEffect, useState } from "react";
import { Animated } from "react-native";
import { IconButton, useTheme } from "react-native-paper";
import { mySync } from "../../services/sync";

export const SyncIndicator = () => {
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(true);
  const theme = useTheme();
  const rotation = new Animated.Value(0);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(!!state.isConnected);
      if (state.isConnected) {
        handleSync();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);

    // Start rotation animation
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ).start();

    try {
      await mySync();
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setSyncing(false);
      rotation.stopAnimation();
      rotation.setValue(0);
    }
  };

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (!online) {
    return <IconButton icon="cloud-off-outline" iconColor={theme.colors.error} size={20} onPress={() => {}} />;
  }

  return (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <IconButton icon="sync" iconColor={syncing ? theme.colors.primary : theme.colors.outline} size={20} onPress={handleSync} disabled={syncing} />
    </Animated.View>
  );
};
