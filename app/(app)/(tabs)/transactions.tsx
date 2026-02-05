import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Platform, SectionList, StyleSheet, View } from "react-native";
import { Chip, IconButton, Searchbar, Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PaywallModal } from "../../../src/components/paywall/PaywallModal";
import { TransactionItem } from "../../../src/components/TransactionItem";
import { FiltersModal, FilterState } from "../../../src/components/transactions/FiltersModal";
import { GlassFAB } from "../../../src/components/ui/GlassFAB";
import { useAppTheme } from "../../../src/context/ThemeContext";
import { usePremium } from "../../../src/hooks/usePremium";
import { ExportService } from "../../../src/services/export";
import { FinancialService } from "../../../src/services/financial";
import { Transaction } from "../../../src/types";
import { groupTransactionsByDate } from "../../../src/utils/transactions";

export default function TransactionsScreen() {
  const theme = useTheme();
  const { isLiquidGlass } = useAppTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { isPro } = usePremium();
  const listRef = useRef<SectionList>(null);
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Advanced Filters State
  const [filters, setFilters] = useState<FilterState>({
    type: "all",
    accountIds: [],
    categoryIds: [],
    dateRange: { start: null, end: null },
  });
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Quick Filters for Type
  const QUICK_FILTERS = [
    { key: "all", label: t("transactions.filter.all") },
    { key: "income", label: t("transactions.filter.income") },
    { key: "expense", label: t("transactions.filter.expense") },
  ];

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await FinancialService.getTransactions();

      // Adapt DB data to UI format
      const adapted: Transaction[] =
        data?.map((txn) => ({
          id: txn.id,
          title: txn.description || t("transactions.noDescription"),
          amount: txn.amount,
          type: txn.type,
          category: txn.category?.name || "Outros",
          categoryIcon: txn.category?.icon,
          categoryColor: txn.category?.color,
          date: txn.transaction_date,
          notes: txn.notes,
          sync_status: txn.sync_status,
          credit_card_id: txn.credit_card_id,
          account_id: txn.account_id, // Ensure we map this for filtering
          category_id: txn.category_id, // Ensure we map this for filtering
          status: txn.status,
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

  const sections = useMemo(() => {
    const filtered = transactions.filter((tx) => {
      const matchesSearch = tx.title?.toLowerCase().includes(searchQuery.toLowerCase()) || tx.category?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = filters.type === "all" ? true : tx.type === filters.type;

      const matchesAccount =
        filters.accountIds.length === 0 ? true : (tx.account_id && filters.accountIds.includes(tx.account_id)) || (tx.credit_card_id && filters.accountIds.includes(tx.credit_card_id!));

      const matchesCategory = filters.categoryIds.length === 0 ? true : tx.category_id && filters.categoryIds.includes(tx.category_id as string);

      // TODO: Date Range Logic if needed
      // const matchesDate = ...

      return matchesSearch && matchesType && matchesAccount && matchesCategory;
    });
    return groupTransactionsByDate(filtered);
  }, [transactions, searchQuery, filters]);

  const activeFiltersCount = filters.accountIds.length + filters.categoryIds.length + (filters.type !== "all" ? 1 : 0);

  const hasScrolledRef = useRef(false);

  useEffect(() => {
    if (!loading && sections.length > 0 && !hasScrolledRef.current) {
      const todayTitle = t("transactions.today");
      const index = sections.findIndex((s) => s.title === todayTitle);
      if (index !== -1) {
        setTimeout(() => {
          listRef.current?.scrollToLocation({
            sectionIndex: index,
            itemIndex: 0,
            animated: true,
            viewPosition: 0,
          });
        }, 500);
      }
      hasScrolledRef.current = true;
    }
  }, [loading, sections]);

  const headerPaddingTop = insets.top > 0 ? insets.top + 8 : 16;
  const listPaddingBottom = Platform.OS === "ios" ? insets.bottom + 140 : 120;
  const fabBottom = Platform.OS === "ios" ? insets.bottom + 72 : 16;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Searchbar placeholder={t("transactions.searchPlaceholder")} onChangeText={setSearchQuery} value={searchQuery} style={[styles.search, { flex: 1 }]} />
          <IconButton icon="export" mode="contained" onPress={handleExport} loading={exporting} style={{ marginLeft: 8 }} />
        </View>
        <View style={styles.filters}>
          <IconButton
            icon="tune"
            mode={activeFiltersCount > 0 && filters.type === "all" ? "contained" : "outlined"} // visual feedback
            onPress={() => setFiltersVisible(true)}
            style={{ margin: 0, marginRight: 8 }}
          />
          {QUICK_FILTERS.map((f) => (
            <Chip key={f.key} selected={filters.type === f.key} onPress={() => setFilters((prev) => ({ ...prev, type: f.key as any }))} style={styles.chip} showSelectedOverlay>
              {f.label}
            </Chip>
          ))}
        </View>
      </View>

      <SectionList
        ref={listRef}
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionItem transaction={item} onPress={() => router.push(`/transactions/${item.id}`)} />}
        renderSectionHeader={({ section: { title } }) => (
          <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, opacity: 0.8, fontWeight: "bold" }}>
              {title}
            </Text>
          </View>
        )}
        contentContainerStyle={[styles.list, { paddingBottom: listPaddingBottom }]}
        ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 32, opacity: 0.5 }}>{t("transactions.noResults")}</Text>}
        stickySectionHeadersEnabled={false}
      />

      <GlassFAB icon="plus" style={[styles.fab, { backgroundColor: theme.colors.primary, bottom: fabBottom }]} color={theme.colors.onPrimary} onPress={() => router.push("/add-transaction")} />

      <FiltersModal visible={filtersVisible} onDismiss={() => setFiltersVisible(false)} onApply={setFilters} currentFilters={filters} />

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
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
