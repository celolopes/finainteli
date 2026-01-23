import { Stack, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Appbar, Button, Checkbox, FAB, IconButton, Modal, Portal, ProgressBar, Text, TextInput, useTheme } from "react-native-paper";
import { useBudgets } from "../../../src/hooks/useBudgetMonitor";
import { BudgetService, BudgetStatus } from "../../../src/services/budget";
import { FinancialService } from "../../../src/services/financial";
import { NotificationService } from "../../../src/services/notifications";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export default function BudgetsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const { budgets, isLoading, refresh } = useBudgets();
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [amount, setAmount] = useState("");
  const [alert50, setAlert50] = useState(true);
  const [alert80, setAlert80] = useState(true);
  const [alert100, setAlert100] = useState(true);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);

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

  const openModal = (budget?: BudgetStatus) => {
    if (budget) {
      // Editar existente
      setEditingBudgetId(budget.budget.id);
      setSelectedCategory(budget.budget.category as Category);
      setAmount(String(budget.budget.amount));
      setAlert50(budget.budget.alert_50 ?? true);
      setAlert80(budget.budget.alert_80 ?? true);
      setAlert100(budget.budget.alert_100 ?? true);
    } else {
      // Novo
      setEditingBudgetId(null);
      setSelectedCategory(null);
      setAmount("");
      setAlert50(true);
      setAlert80(true);
      setAlert100(true);
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedCategory(null);
    setAmount("");
  };

  const handleSave = async () => {
    if (!selectedCategory || !amount) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }

    setSaving(true);
    try {
      await BudgetService.upsertBudget({
        category_id: selectedCategory.id,
        amount: parseFloat(amount),
        alert_50: alert50,
        alert_80: alert80,
        alert_100: alert100,
      });

      // Solicitar permissão de notificação se ainda não tem
      await NotificationService.requestPermissions();

      closeModal();
      refresh();
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

  // Categorias disponíveis (sem orçamento ainda)
  const availableCategories = categories.filter((cat) => !budgets.some((b) => b.budget.category_id === cat.id));

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
              <View key={status.budget.id} style={[styles.budgetCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.categoryInfo}>
                    <View style={[styles.categoryDot, { backgroundColor: status.budget.category?.color || "#ccc" }]} />
                    <Text variant="titleMedium">{status.budget.category?.name}</Text>
                  </View>
                  <IconButton icon="pencil" onPress={() => openModal(status)} size={20} />
                </View>

                <View style={styles.amounts}>
                  <Text variant="bodyLarge" style={{ fontWeight: "bold" }}>
                    R$ {status.spent.toFixed(2)}
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    {" "}
                    / R$ {Number(status.budget.amount).toFixed(2)}
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

        <FAB icon="plus" style={[styles.fab, { backgroundColor: theme.colors.primary }]} onPress={() => openModal()} />

        {/* Modal de Edição */}
        <Portal>
          <Modal visible={modalVisible} onDismiss={closeModal} contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              {editingBudgetId ? "Editar Orçamento" : "Novo Orçamento"}
            </Text>

            {/* Seletor de Categoria */}
            {!editingBudgetId && (
              <>
                <Text variant="labelLarge" style={{ marginBottom: 8 }}>
                  Categoria
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {availableCategories.map((cat) => (
                    <Button key={cat.id} mode={selectedCategory?.id === cat.id ? "contained" : "outlined"} onPress={() => setSelectedCategory(cat)} style={{ marginRight: 8 }} compact>
                      {cat.name}
                    </Button>
                  ))}
                </ScrollView>
              </>
            )}

            {selectedCategory && (
              <View style={[styles.selectedCategory, { borderColor: selectedCategory.color || "#ccc" }]}>
                <Text>Categoria selecionada: {selectedCategory.name}</Text>
              </View>
            )}

            <TextInput label="Valor do Orçamento (R$)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" mode="outlined" style={{ marginBottom: 16 }} />

            <Text variant="labelLarge" style={{ marginBottom: 8 }}>
              Alertas
            </Text>
            <Checkbox.Item label="Alertar em 50%" status={alert50 ? "checked" : "unchecked"} onPress={() => setAlert50(!alert50)} />
            <Checkbox.Item label="Alertar em 80%" status={alert80 ? "checked" : "unchecked"} onPress={() => setAlert80(!alert80)} />
            <Checkbox.Item label="Alertar em 100%" status={alert100 ? "checked" : "unchecked"} onPress={() => setAlert100(!alert100)} />

            <View style={styles.modalActions}>
              {editingBudgetId && (
                <Button
                  mode="outlined"
                  onPress={() => {
                    closeModal();
                    handleDelete(editingBudgetId, selectedCategory?.name || "");
                  }}
                  textColor={theme.colors.error}
                  style={{ marginRight: 8 }}
                >
                  Remover
                </Button>
              )}
              <Button mode="text" onPress={closeModal}>
                Cancelar
              </Button>
              <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving || !selectedCategory || !amount}>
                Salvar
              </Button>
            </View>
          </Modal>
        </Portal>
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
  modal: { margin: 16, padding: 24, borderRadius: 16 },
  modalTitle: { marginBottom: 16, fontWeight: "bold" },
  selectedCategory: { padding: 8, borderWidth: 1, borderRadius: 8, marginBottom: 16 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 16 },
});
