import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from "react-native";
import { Appbar, Avatar, Button, Divider, Icon, List, Surface, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authHelpers, supabase } from "../../../src/services/supabase";
import { useAuthStore } from "../../../src/store/authStore";
import { useSecurityStore } from "../../../src/store/securityStore";

export default function SettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { user, profile, signOut } = useAuthStore();
  const { isSecurityEnabled, toggleSecurity, isBiosEnabled, toggleBiometrics, hasPinSet } = useSecurityStore();

  const [notifEnabled, setNotifEnabled] = useState(profile?.notifications_enabled ?? true);
  const [bioSupported, setBioSupported] = useState(false);
  const [uploading, setUploading] = useState(false);

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
    Alert.alert(t("auth.logout"), t("auth.logoutConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("auth.logout"),
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t("common.error"), "Falha ao selecionar imagem.");
    }
  };

  const uploadAvatar = async (uri: string) => {
    if (!user) return;
    setUploading(true);

    try {
      // 1. Convert URI to Blob
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 2. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, blob, { contentType: `image/${fileExt}` });

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // 4. Update Profile
      const updatedProfile = await authHelpers.updateProfile(user.id, { avatar_url: publicUrl });

      // 5. Update Local State
      if (updatedProfile) {
        useAuthStore.setState((state) => ({ ...state, profile: updatedProfile }));
      }

      Alert.alert(t("common.success"), "Foto de perfil atualizada!");
    } catch (error) {
      console.error("Avatar upload error:", error);
      Alert.alert(t("common.error"), "Falha ao enviar imagem. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const getInitials = () => {
    const name = profile?.display_name || user?.email || "User";
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient colors={[theme.colors.surfaceVariant, theme.colors.background]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} style={StyleSheet.absoluteFillObject} />

      <Appbar.Header style={{ backgroundColor: "transparent" }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t("profile.settings")} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={pickImage} disabled={uploading}>
            <View>
              {profile?.avatar_url ? (
                <Avatar.Image size={100} source={{ uri: profile.avatar_url }} />
              ) : (
                <Avatar.Text size={100} label={getInitials()} style={{ backgroundColor: theme.colors.primary }} />
              )}

              <Surface style={[styles.editBadge, { backgroundColor: theme.colors.elevation.level3 }]} elevation={2}>
                <Icon source={uploading ? "loading" : "camera"} size={20} color={theme.colors.primary} />
              </Surface>
            </View>
          </TouchableOpacity>

          <Text variant="headlineSmall" style={{ marginTop: 16, fontWeight: "bold" }}>
            {profile?.display_name || "Usuário"}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {user?.email}
          </Text>
        </View>

        <Surface style={[styles.section, { backgroundColor: theme.colors.surface, borderRadius: 16 }]} elevation={1}>
          <List.Section>
            <List.Subheader style={styles.subheader}>{t("profile.account")}</List.Subheader>

            <List.Item
              title={t("budgets.title")}
              description={t("budgets.subtitle")} // "Defina limites por categoria"
              left={(props) => <List.Icon {...props} icon="chart-pie" color={theme.colors.primary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push("/(app)/settings/budgets")}
              style={styles.listItem}
            />
            <Divider style={styles.divider} />

            <List.Item
              title={t("profile.notifications")}
              description={t("profile.notificationsDesc") || "Receber alertas de orçamento"}
              left={(props) => <List.Icon {...props} icon="bell-outline" color={theme.colors.primary} />}
              right={() => <Switch value={notifEnabled} onValueChange={toggleNotifications} />}
              style={styles.listItem}
            />
          </List.Section>
        </Surface>

        <Surface style={[styles.section, { backgroundColor: theme.colors.surface, borderRadius: 16 }]} elevation={1}>
          <List.Section>
            <List.Subheader style={styles.subheader}>{t("profile.title")}</List.Subheader>

            <List.Item
              title={t("profile.language")}
              left={(props) => <List.Icon {...props} icon="translate" color={theme.colors.primary} />}
              right={() => (
                <Text variant="bodySmall" style={{ alignSelf: "center", marginRight: 16, color: theme.colors.onSurfaceVariant }}>
                  {t("profile.languages.ptBR")}
                </Text>
              )}
              style={styles.listItem}
            />
          </List.Section>
        </Surface>

        <Surface style={[styles.section, { backgroundColor: theme.colors.surface, borderRadius: 16 }]} elevation={1}>
          <List.Section>
            <List.Subheader style={styles.subheader}>Segurança</List.Subheader>

            <List.Item
              title="Bloqueio de App"
              description="Exigir PIN ao abrir"
              left={(props) => <List.Icon {...props} icon="lock-outline" color={theme.colors.primary} />}
              right={() => <Switch value={isSecurityEnabled} onValueChange={handleSecurityToggle} />}
              style={styles.listItem}
            />

            {isSecurityEnabled && (
              <>
                <Divider style={styles.divider} />
                {bioSupported && (
                  <List.Item
                    title="Biometria"
                    description="Usar Face ID / Touch ID"
                    left={(props) => <List.Icon {...props} icon="fingerprint" color={theme.colors.primary} />}
                    right={() => <Switch value={isBiosEnabled} onValueChange={toggleBiometrics} />}
                    style={styles.listItem}
                  />
                )}

                <Divider style={styles.divider} />
                <List.Item
                  title="Alterar PIN"
                  left={(props) => <List.Icon {...props} icon="key-outline" color={theme.colors.primary} />}
                  right={(props) => <List.Icon {...props} icon="chevron-right" />}
                  onPress={() => router.push("/(app)/settings/security/pin-setup")}
                  style={styles.listItem}
                />
              </>
            )}
          </List.Section>
        </Surface>

        <View style={styles.logoutContainer}>
          <Button mode="contained-tonal" onPress={handleSignOut} textColor={theme.colors.error} style={{ backgroundColor: theme.colors.errorContainer }} icon="logout">
            {t("auth.logout")}
          </Button>

          <Text variant="bodySmall" style={{ textAlign: "center", marginTop: 16, color: theme.colors.onSurfaceVariant, opacity: 0.6 }}>
            FinAInteli v1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  profileHeader: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 16,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: "white", // Or match background
  },
  section: {
    marginBottom: 16,
    overflow: "hidden",
  },
  subheader: {
    fontWeight: "600",
    fontSize: 14,
    opacity: 0.7,
  },
  listItem: {
    paddingVertical: 8,
  },
  divider: {
    opacity: 0.5,
  },
  logoutContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
});
