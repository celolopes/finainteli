import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Text, useTheme } from "react-native-paper";
import { PurchasesPackage } from "react-native-purchases";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RCService } from "../../services/revenuecat";

export function PaywallModal({ visible, onDismiss, onSuccess }: { visible: boolean; onDismiss: () => void; onSuccess: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);

  useEffect(() => {
    if (visible) loadOfferings();
  }, [visible]);

  const loadOfferings = async () => {
    try {
      const offerings = await RCService.getOfferings();
      if (offerings && offerings.availablePackages.length > 0) {
        setPackages(offerings.availablePackages);
        // Prioritize ANNUAL package selection
        const annual = offerings.availablePackages.find((p) => p.packageType === "ANNUAL");
        setSelectedPackage(annual || offerings.availablePackages[0]);
      }
    } catch (e) {
      console.error("Error loading offerings", e);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    setLoading(true);
    const success = await RCService.purchase(selectedPackage);
    setLoading(false);
    if (success) {
      onSuccess();
      onDismiss();
    }
  };

  const getPackageName = (pack: PurchasesPackage) => {
    switch (pack.packageType) {
      case "ANNUAL":
        return t("paywall.plans.annual", "Plano Anual");
      case "MONTHLY":
        return t("paywall.plans.monthly", "Plano Mensal");
      case "WEEKLY":
        return t("paywall.plans.weekly", "Plano Semanal");
      case "LIFETIME":
        return t("paywall.plans.lifetime", "Vitalício");
      default:
        // Fallback: Clean the product title (remove parens like "(com.app...)")
        return pack.product.title.replace(/\s*\(.*?\)\s*/g, "").trim();
    }
  };

  const FeatureItem = ({ icon, text, delay }: { icon: string; text: string; delay: number }) => (
    <Animated.View entering={FadeInDown.delay(delay).duration(500)} style={styles.featureItem}>
      <BlurView intensity={20} tint="dark" style={styles.featureIconContainer}>
        <Ionicons name={icon as any} size={22} color="#14b8a6" />
      </BlurView>
      <Text variant="bodyLarge" style={styles.featureText}>
        {text}
      </Text>
    </Animated.View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onDismiss}>
      <LinearGradient colors={["#0f172a", "#1b1b1b", "#121212"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container} aria-label="Paywall Display">
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Animated.View entering={ZoomIn.duration(800)} style={styles.headerIconContainer}>
              <View style={styles.iconGradient}>
                <Image source={require("../../../assets/images/logo-modal.png")} style={{ width: 80, height: 80 }} resizeMode="contain" />
              </View>
            </Animated.View>
            <Text variant="headlineMedium" style={styles.title}>
              {t("paywall.title", "Seja FinAInteli Pro")}
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {t("paywall.subtitle", "Desbloqueie todo o potencial da sua vida financeira com Inteligência Artificial.")}
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <FeatureItem icon="card-outline" text={t("paywall.features.unlimited", "Contas e Cartões Ilimitados")} delay={100} />
            <FeatureItem icon="sparkles" text={t("paywall.features.ai", "IA Financeira Ilimitada")} delay={200} />
            <FeatureItem icon="cloud-upload-outline" text={t("paywall.features.backup", "Backup e Sync Prioritário")} delay={300} />
            <FeatureItem icon="chatbubbles-outline" text={t("paywall.features.support", "Suporte VIP Exclusivo")} delay={400} />
          </View>

          {/* Plans */}
          <Text variant="titleMedium" style={styles.plansTitle}>
            {t("paywall.cta", "Escolha seu plano")}
          </Text>

          {packages.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#14b8a6" size="small" />
              <Text style={styles.loadingText}>{t("paywall.loading", "Carregando ofertas...")}</Text>
            </View>
          ) : (
            <View style={styles.plansContainer}>
              {packages.map((pack) => {
                const isSelected = selectedPackage?.identifier === pack.identifier;
                const isAnnual = pack.packageType === "ANNUAL";
                const title = getPackageName(pack);

                return (
                  <TouchableOpacity key={pack.identifier} onPress={() => setSelectedPackage(pack)} activeOpacity={0.9} style={styles.planWrapper}>
                    <Animated.View style={[styles.planCard, isSelected && styles.selectedPlanCard]}>
                      {isSelected && <LinearGradient colors={["rgba(20, 184, 166, 0.15)", "transparent"]} style={StyleSheet.absoluteFillObject} />}

                      <View style={styles.planHeader}>
                        <Text style={[styles.planTitle, isSelected && styles.selectedText]} numberOfLines={1}>
                          {title}
                        </Text>
                        {isAnnual && (
                          <LinearGradient colors={["#22c55e", "#16a34a"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.badge}>
                            <Text style={styles.badgeText}>{t("paywall.plans.bestValue", "MELHOR VALOR")}</Text>
                          </LinearGradient>
                        )}
                      </View>

                      <View style={styles.priceContainer}>
                        <Text style={[styles.price, isSelected && styles.selectedText]}>{pack.product.priceString}</Text>
                      </View>
                      <Text style={styles.period} numberOfLines={2}>
                        {pack.product.description}
                      </Text>

                      {isSelected && (
                        <View style={styles.checkIcon}>
                          <Ionicons name="checkmark-circle" size={24} color="#14b8a6" />
                        </View>
                      )}
                    </Animated.View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Spacer */}
          <View style={{ height: 20 }} />

          {/* CTA */}
          <TouchableOpacity style={styles.ctaButton} onPress={handlePurchase} disabled={loading || !selectedPackage}>
            <LinearGradient colors={["#14b8a6", "#0d9488"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.ctaText}>{t("paywall.cta", "Assinar Agora")}</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={onDismiss} style={styles.ghostButton}>
            <Text style={styles.ghostText}>{t("paywall.free", "Continuar com plano Grátis")}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t("paywall.restore", "Restaurar Compra")} • {t("paywall.terms", "Termos")} • {t("paywall.privacy", "Privacidade")}
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  header: {
    alignItems: "center",
    marginBottom: 15,
  },
  headerIconContainer: {
    marginBottom: 5,
    shadowColor: "#14b8a6",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  highlight: {
    color: "#14b8a6",
  },
  subtitle: {
    color: "#94a3b8",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  featuresContainer: {
    marginBottom: 32,
    gap: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    overflow: "hidden",
    backgroundColor: "rgba(20, 184, 166, 0.1)",
  },
  featureText: {
    color: "#e2e8f0",
    fontWeight: "500",
    flex: 1,
  },
  plansTitle: {
    color: "white",
    fontWeight: "bold",
    marginBottom: 16,
  },
  plansContainer: {
    gap: 12,
  },
  planWrapper: {
    marginBottom: 8,
  },
  planCard: {
    backgroundColor: "#1e293b",
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
    overflow: "hidden",
  },
  selectedPlanCard: {
    borderColor: "#14b8a6",
    backgroundColor: "#134e4a", // Darker teal bg
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  planTitle: {
    color: "#cbd5e1",
    fontSize: 18,
    fontWeight: "600",
    flex: 1, // Allow title to take flexible width
    marginRight: 8,
  },
  selectedText: {
    color: "white",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    color: "#cbd5e1",
    fontSize: 24,
    fontWeight: "bold",
    marginRight: 4,
  },
  period: {
    color: "#64748b",
    fontSize: 14,
    marginTop: 2,
  },
  checkIcon: {
    position: "absolute",
    top: 20,
    right: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    color: "#94a3b8",
    marginTop: 10,
  },
  ctaButton: {
    borderRadius: 24,
    overflow: "hidden",
    marginTop: 8,
    elevation: 8,
    shadowColor: "#14b8a6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradientButton: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  ghostButton: {
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  ghostText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "500",
  },
  footer: {
    marginTop: 20,
    alignItems: "center",
  },
  footerText: {
    color: "#475569",
    fontSize: 12,
  },
});
