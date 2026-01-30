import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Button, Checkbox, Divider, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FinancialService } from "../../services/financial";

export interface FilterState {
  type: "all" | "income" | "expense";
  accountIds: string[];
  categoryIds: string[];
  dateRange: { start: Date | null; end: Date | null }; // Simplified for now, can expand later
}

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onApply: (filters: FilterState) => void;
  currentFilters: FilterState;
}

export function FiltersModal({ visible, onDismiss, onApply, currentFilters }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [localFilters, setLocalFilters] = useState<FilterState>(currentFilters);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (visible) {
      setLocalFilters(currentFilters);
      loadMetadata();
    }
  }, [visible]);

  const loadMetadata = async () => {
    try {
      const [accs, cats] = await Promise.all([FinancialService.getAccounts(), FinancialService.getCategories()]);
      setAccounts(accs.map((a) => ({ id: a.id, name: a.name })));
      setCategories(cats.map((c) => ({ id: c.id, name: c.name })));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleAccount = (id: string) => {
    setLocalFilters((prev) => {
      const exists = prev.accountIds.includes(id);
      return {
        ...prev,
        accountIds: exists ? prev.accountIds.filter((x) => x !== id) : [...prev.accountIds, id],
      };
    });
  };

  const toggleCategory = (id: string) => {
    setLocalFilters((prev) => {
      const exists = prev.categoryIds.includes(id);
      return {
        ...prev,
        categoryIds: exists ? prev.categoryIds.filter((x) => x !== id) : [...prev.categoryIds, id],
      };
    });
  };

  const apply = () => {
    onApply(localFilters);
    onDismiss();
  };

  const clear = () => {
    const cleared: FilterState = { type: "all", accountIds: [], categoryIds: [], dateRange: { start: null, end: null } };
    setLocalFilters(cleared);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onDismiss}>
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onDismiss}>
            <Text style={{ color: theme.colors.primary }}>{t("common.cancel")}</Text>
          </TouchableOpacity>
          <Text variant="titleMedium" style={{ fontWeight: "bold", color: theme.colors.onSurface }}>
            Filtros
          </Text>
          <TouchableOpacity onPress={clear}>
            <Text style={{ color: theme.colors.error }}>{t("transactions.filter.clear")}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Type */}
          <Text variant="labelLarge" style={styles.sectionTitle}>
            Tipo
          </Text>
          <View style={styles.row}>
            {["all", "income", "expense"].map((tType) => (
              <TouchableOpacity
                key={tType}
                onPress={() => setLocalFilters((prev) => ({ ...prev, type: tType as any }))}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: localFilters.type === tType ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
                    borderColor: localFilters.type === tType ? theme.colors.primary : "transparent",
                    borderWidth: 1,
                  },
                ]}
              >
                <Text style={{ color: localFilters.type === tType ? theme.colors.primary : theme.colors.onSurfaceVariant }}>{t(`transactions.filter.${tType}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Divider style={styles.divider} />

          {/* Accounts */}
          <Text variant="labelLarge" style={styles.sectionTitle}>
            {t("transactions.accounts")}
          </Text>
          {accounts.map((acc) => (
            <TouchableOpacity key={acc.id} style={styles.checkRow} onPress={() => toggleAccount(acc.id)}>
              <Checkbox status={localFilters.accountIds.includes(acc.id) ? "checked" : "unchecked"} onPress={() => toggleAccount(acc.id)} />
              <Text>{acc.name}</Text>
            </TouchableOpacity>
          ))}

          <Divider style={styles.divider} />

          {/* Categories */}
          <Text variant="labelLarge" style={styles.sectionTitle}>
            {t("transactions.category")}
          </Text>
          {categories.map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.checkRow} onPress={() => toggleCategory(cat.id)}>
              <Checkbox status={localFilters.categoryIds.includes(cat.id) ? "checked" : "unchecked"} onPress={() => toggleCategory(cat.id)} />
              <Text>{cat.name}</Text>
            </TouchableOpacity>
          ))}

          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: theme.colors.outlineVariant }]}>
          <Button mode="contained" onPress={apply} style={{ flex: 1 }}>
            {t("common.apply", "Aplicar Filtros")}
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: "bold",
    opacity: 0.7,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    flexDirection: "row",
  },
});
