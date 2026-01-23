import NetInfo from "@react-native-community/netinfo";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native";
import { Surface, Text, useTheme } from "react-native-paper";

export const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(false);
  const theme = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false);
    });

    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.errorContainer }]} elevation={2}>
      <Text variant="labelMedium" style={{ color: theme.colors.onErrorContainer }}>
        {t("common.offline_mode_active")}
      </Text>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
