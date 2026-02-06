import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { Appbar, Avatar, FAB, List, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassAppbar } from "../../../../src/components/ui/GlassAppbar";
import { FinancialService } from "../../../../src/services/financial";

export default function CategoriesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<any[]>([]);

  const loadCategories = async () => {
    const data = await FinancialService.getCategories();
    setCategories(data);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadCategories();
    }, []),
  );

  const handleDelete = async (id: string, name: string) => {
    Alert.alert("Excluir Categoria", `Deseja excluir a categoria "${name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await FinancialService.deleteCategory(id);
            loadCategories();
          } catch (e: any) {
            Alert.alert("Erro", e.message || "Falha ao excluir categoria.");
          }
        },
      },
    ]);
  };

  const renderCategory = (item: any) => (
    <List.Item
      key={item.id}
      title={item.name}
      left={(props) => <Avatar.Icon {...props} icon={item.icon || "help"} size={40} style={{ backgroundColor: item.color || theme.colors.surfaceVariant }} color="white" />}
      right={(props) => <List.Icon {...props} icon="chevron-right" />}
      onPress={() => router.push(`/(app)/settings/categories/${item.id}` as any)}
      onLongPress={() => handleDelete(item.id, item.name)}
      style={styles.item}
    />
  );

  const expenseCategories = categories.filter((c) => c.type === "expense" || c.type === "both");
  const incomeCategories = categories.filter((c) => c.type === "income" || c.type === "both");

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GlassAppbar elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Categorias" />
      </GlassAppbar>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}>
        <List.Section>
          <List.Subheader>Despesas</List.Subheader>
          {expenseCategories.map(renderCategory)}
        </List.Section>

        <List.Section>
          <List.Subheader>Receitas</List.Subheader>
          {incomeCategories.map(renderCategory)}
        </List.Section>
      </ScrollView>

      <FAB icon="plus" style={[styles.fab, { bottom: insets.bottom + 16 }]} onPress={() => router.push("/(app)/settings/categories/new" as any)} label="Nova Categoria" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 8 },
  item: {
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 8,
    borderRadius: 12,
  },
  fab: {
    position: "absolute",
    right: 16,
  },
});
