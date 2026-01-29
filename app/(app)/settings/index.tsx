import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Switch, View } from "react-native";
import { Appbar, Avatar, Button, Divider, List, Text, useTheme } from "react-native-paper";
import { authHelpers } from "../../../src/services/supabase";
import { useAuthStore } from "../../../src/store/authStore";
import { useSecurityStore } from "../../../src/store/securityStore";

export default function SettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { user, profile, signOut } = useAuthStore();
  const { isSecurityEnabled, toggleSecurity, isBiosEnabled, toggleBiometrics, hasPinSet } = useSecurityStore();
  const [notifEnabled, setNotifEnabled] = useState(profile?.notifications_enabled ?? true);
  const [bioSupported, setBioSupported] = useState(false);

  React.useEffect(() => {
    LocalAuthentication.supportedAuthenticationTypesAsync().then((types) => {
      setBioSupported(types.length > 0);
    });
  }, []);

  const handleSecurityToggle = async (value: boolean) => {
    if (value && !hasPinSet) {
      router.push("/(app)/settings/security/pin-setup");
    } else {
      await toggleSecurity(value);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    setNotifEnabled(value);
    if (user) {
      await authHelpers.updateProfile(user.id, { notifications_enabled: value });
      useAuthStore.setState((state) => ({
        ...state,
        profile: state.profile ? { ...state.profile, notifications_enabled: value } : null,
      }));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t("profile.settings")} />
        <Appbar.Action icon="logout" onPress={handleSignOut} color={theme.colors.error} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {profile?.avatar_url ? <Avatar.Image size={80} source={{ uri: profile.avatar_url }} /> : <Avatar.Text size={80} label={profile?.display_name?.substring(0, 2).toUpperCase() || "US"} />}
          <Text variant="titleLarge" style={{ marginTop: 16, fontWeight: "bold" }}>
            {profile?.display_name || user?.email}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {user?.email}
          </Text>
        </View>

        <List.Section>
          <List.Subheader>{t("profile.account")}</List.Subheader>

          <List.Item
            title={t("budgets.title")}
            description={t("budgets.subtitle")}
            left={(props) => <List.Icon {...props} icon="chart-pie" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push("/(app)/settings/budgets")}
          />

          <List.Item
            title={t("profile.notifications")}
            description={t("profile.notificationsDesc") || "Receber alertas de orçamento"}
            left={(props) => <List.Icon {...props} icon="bell-outline" />}
            right={() => <Switch value={notifEnabled} onValueChange={toggleNotifications} />}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>{t("profile.title")}</List.Subheader>

          <List.Item
            title={t("profile.theme")}
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            right={(props) => (
              <Text {...props} style={{ alignSelf: "center", marginRight: 16 }}>
                {t("profile.themeSystem")}
              </Text>
            )}
          />

          <List.Item
            title={t("profile.language")}
            left={(props) => <List.Icon {...props} icon="translate" />}
            right={(props) => (
              <Text {...props} style={{ alignSelf: "center", marginRight: 16 }}>
                {t("profile.languages.ptBR")}
              </Text>
            )}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Segurança</List.Subheader>

          <List.Item
            title="Bloqueio de App"
            description="Exigir PIN ao abrir"
            left={(props) => <List.Icon {...props} icon="lock-outline" />}
            right={() => <Switch value={isSecurityEnabled} onValueChange={handleSecurityToggle} />}
          />

          {isSecurityEnabled && (
            <>
              {bioSupported && (
                <List.Item
                  title="Biometria"
                  description="Usar Face ID / Touch ID"
                  left={(props) => <List.Icon {...props} icon="fingerprint" />}
                  right={() => <Switch value={isBiosEnabled} onValueChange={toggleBiometrics} />}
                />
              )}

              <List.Item
                title="Alterar PIN"
                left={(props) => <List.Icon {...props} icon="key-outline" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => router.push("/(app)/settings/security/pin-setup")}
              />
            </>
          )}
        </List.Section>

        <Divider />

        <View style={styles.logoutContainer}>
          <Button mode="outlined" onPress={handleSignOut} textColor={theme.colors.error} style={{ borderColor: theme.colors.error }}>
            {t("auth.logout")}
          </Button>
        </View>

        <Text variant="bodySmall" style={{ textAlign: "center", marginTop: 24, color: theme.colors.onSurfaceVariant }}>
          FinAInteli v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  profileHeader: {
    alignItems: "center",
    padding: 24,
  },
  logoutContainer: {
    padding: 16,
    marginTop: 8,
  },
});
