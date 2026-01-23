import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, StyleSheet, View } from "react-native";
import { Chip, FAB, Searchbar, Text, useTheme } from "react-native-paper";
import { TransactionItem } from "../../../src/components/TransactionItem";
import { FinancialService } from "../../../src/services/financial";

export default function TransactionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Local state for search/filter remains, but operates on fetched data
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const FILTERS = [
    { key: "all", label: t("transactions.filter.all") },
    { key: "income", label: t("transactions.filter.income") },
    { key: "expense", label: t("transactions.filter.expense") },
  ];

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await FinancialService.getTransactions();

      // Adapt DB data to UI format
      const adapted =
        data?.map((t) => ({
          id: t.id,
          title: t.description || t("transactions.noDescription"),
          amount: t.amount,
          type: t.type,
          category: t.category?.name || "Outros",
          date: t.transaction_date,
          notes: t.notes,
        })) || [];

      setTransactions(adapted);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, []),
  );

  const filteredData = transactions.filter((tx) => {
    const matchesSearch = tx.title?.toLowerCase().includes(searchQuery.toLowerCase()) || tx.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" ? true : tx.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Searchbar placeholder={t("transactions.searchPlaceholder")} onChangeText={setSearchQuery} value={searchQuery} style={styles.search} />
        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <Chip key={f.key} selected={filter === f.key} onPress={() => setFilter(f.key)} style={styles.chip} showSelectedOverlay>
              {f.label}
            </Chip>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 32, opacity: 0.5 }}>{t("transactions.noResults")}</Text>}
      />

      <FAB icon="plus" style={[styles.fab, { backgroundColor: theme.colors.primary }]} color={theme.colors.onPrimary} onPress={() => router.push("/add-transaction")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  search: {
    marginBottom: 12,
  },
  filters: {
    flexDirection: "row",
  },
  chip: {
    marginRight: 8,
  },
  list: {
    paddingBottom: 80,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
