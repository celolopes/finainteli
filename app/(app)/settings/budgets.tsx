import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Appbar, FAB, IconButton, ProgressBar, Text, useTheme } from "react-native-paper";
import { BudgetModal } from "../../../src/components/budgets/BudgetModal";
import { useBudgets } from "../../../src/hooks/useBudgetMonitor";
import { Budget, BudgetService, BudgetStatus } from "../../../src/services/budget";
import { FinancialService } from "../../../src/services/financial";
import { NotificationService } from "../../../src/services/notifications";
import { Database } from "../../../src/types/schema";

type Category = Database["public"]["Tables"]["categories"]["Row"];

export default function BudgetsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const { budgets, isLoading, refresh } = useBudgets();
  const [categories, setCategories] = useState<Category[]>([]);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
      loadCategories();
    }, []),
  );

  const loadCategories = async () => {
    try {
      const cats = await FinancialService.getCategories();
      setCategories(cats.filter((c) => c.type === "expense"));
    } catch (error) {
      console.error(error);
    }
  };

  const openNewBudget = () => {
    setEditingBudget(null);
    setModalVisible(true);
  };

  const openEditBudget = (status: BudgetStatus) => {
    const b: Partial<Budget> = {
      id: status.budget_id,
      category_id: status.category_id,
      amount: status.budget_amount,
      alert_50: status.alerts_enabled[50],
      alert_80: status.alerts_enabled[80],
      alert_100: status.alerts_enabled[100],
    };
    setEditingBudget(b as Budget);
    setModalVisible(true);
  };

  const handleSave = async (budget: Partial<Budget>) => {
    setSaving(true);
    try {
      await BudgetService.upsertBudget(budget);
      await NotificationService.requestPermissions();
      refresh();
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível salvar o orçamento");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (budgetId: string, categoryName: string) => {
    Alert.alert("Remover Orçamento", `Deseja remover o orçamento de ${categoryName}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          try {
            await BudgetService.deleteBudget(budgetId);
            refresh();
          } catch (error) {
            Alert.alert("Erro", "Não foi possível remover");
          }
        },
      },
    ]);
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return theme.colors.error;
    if (percentage >= 80) return theme.colors.tertiary;
    if (percentage >= 50) return theme.colors.secondary;
    return theme.colors.primary;
  };

  // Filter out categories that already have a budget
  const availableCategories = categories.filter((cat) => !budgets.some((b) => b.category_id === cat.id));

  // Combine available categories + the one currently being edited (so it shows up in list)
  const modalCategories = editingBudget ? ([...availableCategories, categories.find((c) => c.id === editingBudget.category_id)].filter(Boolean) as Category[]) : availableCategories;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header elevated>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title="Orçamentos" subtitle="Defina limites por categoria" />
        </Appbar.Header>

        <ScrollView contentContainerStyle={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
            </View>
          ) : budgets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text variant="headlineSmall" style={{ textAlign: "center", marginBottom: 8 }}>
                Nenhum orçamento definido
              </Text>
              <Text variant="bodyMedium" style={{ textAlign: "center", color: theme.colors.onSurfaceVariant }}>
                Defina limites de gastos por categoria e receba alertas quando atingir 50%, 80% ou 100% do valor.
              </Text>
            </View>
          ) : (
            budgets.map((status) => (
              <View key={status.budget_id} style={[styles.budgetCard, { backgroundColor: theme.colors.surface }]} aria-label={`Orçamento ${status.category_name}`}>
                <View style={styles.cardHeader}>
                  <View style={styles.categoryInfo}>
                    <View style={[styles.categoryDot, { backgroundColor: categories.find((c) => c.id === status.category_id)?.color || "#ccc" }]} />
                    <Text variant="titleMedium">{status.category_name}</Text>
                  </View>
                  <View style={{ flexDirection: "row" }}>
                    <IconButton icon="pencil" onPress={() => openEditBudget(status)} size={20} />
                    <IconButton icon="delete" iconColor={theme.colors.error} onPress={() => handleDelete(status.budget_id, status.category_name)} size={20} />
                  </View>
                </View>

                <View style={styles.amounts}>
                  <Text variant="bodyLarge" style={{ fontWeight: "bold" }}>
                    R$ {status.spent_amount.toFixed(2)}
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    {" "}
                    / R$ {status.budget_amount.toFixed(2)}
                  </Text>
                </View>

                <ProgressBar progress={Math.min(status.percentage / 100, 1)} color={getProgressColor(status.percentage)} style={styles.progressBar} />

                <View style={styles.cardFooter}>
                  <Text variant="labelSmall" style={{ color: getProgressColor(status.percentage) }}>
                    {status.percentage.toFixed(0)}% utilizado
                  </Text>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Restam: R$ {Math.max(status.remaining, 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <FAB icon="plus" style={[styles.fab, { backgroundColor: theme.colors.primary }]} onPress={openNewBudget} />

        <BudgetModal visible={modalVisible} onDismiss={() => setModalVisible(false)} onSave={handleSave} categories={modalCategories} existingBudget={editingBudget} loading={saving} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  loadingContainer: { height: 200, justifyContent: "center", alignItems: "center" },
  emptyContainer: { padding: 32, alignItems: "center" },
  budgetCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryInfo: { flexDirection: "row", alignItems: "center" },
  categoryDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  amounts: { flexDirection: "row", alignItems: "baseline", marginTop: 8 },
  progressBar: { height: 8, borderRadius: 4, marginTop: 12 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  fab: { position: "absolute", right: 16, bottom: 24 },
});
