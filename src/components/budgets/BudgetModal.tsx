import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, HelperText, Modal, Portal, Switch, Text, TextInput, useTheme } from "react-native-paper";
import { Budget } from "../../services/budget";
import { Database } from "../../types/schema";

type Category = Database["public"]["Tables"]["categories"]["Row"];

interface BudgetModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (budget: Partial<Budget>) => Promise<void>;
  categories: Category[];
  existingBudget?: Budget | null;
  loading?: boolean;
}

export const BudgetModal = ({ visible, onDismiss, onSave, categories, existingBudget, loading }: BudgetModalProps) => {
  const theme = useTheme();
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [alert50, setAlert50] = useState(true);
  const [alert80, setAlert80] = useState(true);
  const [alert100, setAlert100] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (existingBudget) {
      setAmount(existingBudget.amount?.toString() || "");
      setCategoryId(existingBudget.category_id || "");
      setAlert50(existingBudget.alert_50 ?? true);
      setAlert80(existingBudget.alert_80 ?? true);
      setAlert100(existingBudget.alert_100 ?? true);
    } else {
      setAmount("");
      setCategoryId("");
      setAlert50(true);
      setAlert80(true);
      setAlert100(true);
    }
    setError("");
  }, [existingBudget, visible]);

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount))) {
      setError("Informe um valor válido");
      return;
    }
    if (!categoryId) {
      setError("Selecione uma categoria");
      return;
    }

    try {
      await onSave({
        id: existingBudget?.id,
        category_id: categoryId,
        amount: Number(amount),
        period: "monthly",
        alert_50: alert50,
        alert_80: alert80,
        alert_100: alert100,
        currency_code: "BRL", // TODO: Get from user preference
        is_active: true,
        name: categories.find((c) => c.id === categoryId)?.name || "Orçamento",
        start_date: new Date().toISOString().split("T")[0],
      });
      // Don't modify visible stack here, let parent handle it
    } catch (e) {
      console.error(e);
      setError("Erro ao salvar orçamento");
    }
  };

  const getFilteredCategories = () => {
    // Filter out income categories and system categories if needed,
    // but usually budgets are for expenses.
    return categories.filter((c) => c.type === "expense");
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <Text variant="headlineSmall" style={styles.title}>
          {existingBudget ? "Editar Orçamento" : "Novo Orçamento"}
        </Text>

        <ScrollView contentContainerStyle={styles.scroll}>
          <Text variant="bodyMedium" style={styles.label}>
            Categoria
          </Text>
          <View style={styles.categories}>
            {getFilteredCategories().map((cat) => (
              <Button
                key={cat.id}
                mode={categoryId === cat.id ? "contained" : "outlined"}
                onPress={() => setCategoryId(cat.id)}
                style={styles.catChip}
                compact
                buttonColor={categoryId === cat.id ? theme.colors.primary : undefined}
              >
                {cat.name}
              </Button>
            ))}
          </View>

          <TextInput label="Valor Mensal (R$)" value={amount} onChangeText={setAmount} keyboardType="numeric" mode="outlined" style={styles.input} left={<TextInput.Affix text="R$" />} />

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Alertas
          </Text>

          <View style={styles.switchRow}>
            <Text>Atingir 50%</Text>
            <Switch value={alert50} onValueChange={setAlert50} />
          </View>
          <View style={styles.switchRow}>
            <Text>Atingir 80%</Text>
            <Switch value={alert80} onValueChange={setAlert80} />
          </View>
          <View style={styles.switchRow}>
            <Text>Atingir 100%</Text>
            <Switch value={alert100} onValueChange={setAlert100} />
          </View>

          {error ? (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          ) : null}

          <View style={styles.actions}>
            <Button onPress={onDismiss} style={styles.button}>
              Cancelar
            </Button>
            <Button mode="contained" onPress={handleSave} loading={loading} style={styles.button}>
              Salvar
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: "90%",
  },
  title: {
    marginBottom: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  scroll: {
    paddingBottom: 20,
  },
  label: {
    marginBottom: 8,
    fontWeight: "600",
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  catChip: {
    marginBottom: 4,
  },
  input: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 10,
    marginTop: 10,
    fontWeight: "600",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  button: {
    marginLeft: 10,
  },
});
