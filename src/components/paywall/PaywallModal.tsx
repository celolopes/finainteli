import React, { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Card, Text, useTheme } from "react-native-paper";
import { PurchasesPackage } from "react-native-purchases";
import { RCService } from "../../services/revenuecat";

export function PaywallModal({ visible, onDismiss, onSuccess }: { visible: boolean; onDismiss: () => void; onSuccess: () => void }) {
  const theme = useTheme();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) loadOfferings();
  }, [visible]);

  const loadOfferings = async () => {
    const offerings = await RCService.getOfferings();
    if (offerings && offerings.availablePackages) {
      setPackages(offerings.availablePackages);
    }
  };

  const handlePurchase = async (pack: PurchasesPackage) => {
    setLoading(true);
    const success = await RCService.purchase(pack);
    setLoading(false);
    if (success) {
      onSuccess();
      onDismiss();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineMedium" style={{ textAlign: "center", marginVertical: 32, fontWeight: "bold" }}>
          Seja FinAInteli Pro 🚀
        </Text>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20 }}>
          <View style={styles.featureList}>
            <Text variant="bodyLarge" style={styles.feature}>
              ✅ Contas e Cartões Ilimitados
            </Text>
            <Text variant="bodyLarge" style={styles.feature}>
              ✅ IA Avançada Ilimitada
            </Text>
            <Text variant="bodyLarge" style={styles.feature}>
              ✅ Sincronização em Nuvem Prioritária
            </Text>
            <Text variant="bodyLarge" style={styles.feature}>
              ✅ Suporte Exclusivo
            </Text>
          </View>

          <Text variant="titleMedium" style={{ marginTop: 20, marginBottom: 10 }}>
            Planos Disponíveis:
          </Text>

          {packages.length === 0 ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ActivityIndicator size="small" />
              <Text style={{ marginTop: 10 }}>Carregando ofertas...</Text>
              <Text variant="bodySmall" style={{ marginTop: 5, color: "gray", textAlign: "center" }}>
                (Se você estiver em ambiente de teste sem builds nativas, nenhuma oferta aparecerá aqui.)
              </Text>
            </View>
          ) : (
            packages.map((pack) => (
              <Card key={pack.identifier} style={styles.card} onPress={() => handlePurchase(pack)}>
                <Card.Title
                  title={pack.product.title}
                  subtitle={pack.product.description}
                  right={(props) => (
                    <Text variant="titleLarge" style={{ marginRight: 16, fontWeight: "bold", color: theme.colors.primary }}>
                      {pack.product.priceString}
                    </Text>
                  )}
                />
              </Card>
            ))
          )}
        </ScrollView>

        <Button mode="text" onPress={onDismiss} style={{ margin: 20 }}>
          Continuar Grátis (Limitado)
        </Button>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  featureList: { gap: 12, marginBottom: 20 },
  feature: { fontSize: 16 },
  card: { marginBottom: 12 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});
