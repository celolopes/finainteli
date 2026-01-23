import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import { Chip, FAB, IconButton, Searchbar, Text, useTheme } from "react-native-paper";
import { PaywallModal } from "../../../src/components/paywall/PaywallModal";
import { TransactionItem } from "../../../src/components/TransactionItem";
import { usePremium } from "../../../src/hooks/usePremium";
import { ExportService } from "../../../src/services/export";
import { FinancialService } from "../../../src/services/financial";
import { Transaction } from "../../../src/types";

export default function TransactionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { isPro } = usePremium();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [exporting, setExporting] = useState(false);

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
        data?.map((txn) => ({
          id: txn.id,
          title: txn.description || t("transactions.noDescription"),
          amount: txn.amount,
          type: txn.type,
          category: txn.category?.name || "Outros",
          date: txn.transaction_date,
          notes: txn.notes,
          sync_status: txn.sync_status,
        })) || [];

      setTransactions(adapted);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!isPro) {
      setShowPaywall(true);
      return;
    }

    Alert.alert(t("export.title") || "Exportar Transações", t("export.chooseFormat") || "Escolha o formato desejado", [
      {
        text: "CSV (Excel)",
        onPress: async () => {
          try {
            setExporting(true);
            await ExportService.exportTransactionsCSV();
          } catch (error) {
            console.error(error);
          } finally {
            setExporting(false);
          }
        },
      },
      {
        text: "PDF (Relatório)",
        onPress: async () => {
          try {
            setExporting(true);
            await ExportService.exportTransactionsPDF();
          } catch (error) {
            console.error(error);
          } finally {
            setExporting(false);
          }
        },
      },
      {
        text: "Cancelar",
        style: "cancel",
      },
    ]);
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
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Searchbar placeholder={t("transactions.searchPlaceholder")} onChangeText={setSearchQuery} value={searchQuery} style={[styles.search, { flex: 1 }]} />
          <IconButton icon="export" mode="contained" onPress={handleExport} loading={exporting} style={{ marginLeft: 8 }} />
        </View>
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
        renderItem={({ item }) => <TransactionItem transaction={item} onPress={() => router.push(`/transactions/${item.id}`)} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 32, opacity: 0.5 }}>{t("transactions.noResults")}</Text>}
      />

      <FAB icon="plus" style={[styles.fab, { backgroundColor: theme.colors.primary }]} color={theme.colors.onPrimary} onPress={() => router.push("/add-transaction")} />

      <PaywallModal
        visible={showPaywall}
        onDismiss={() => setShowPaywall(false)}
        onSuccess={() => {
          setShowPaywall(false);
          handleExport();
        }}
      />
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
