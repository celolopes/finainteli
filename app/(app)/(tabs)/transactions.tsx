import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Platform, ScrollView, SectionList, StyleSheet, View } from "react-native";
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 40;

  // Advanced Filters State
  const [filters, setFilters] = useState<FilterState & { quickType: "all" | "income" | "expense" | "planned" }>({
    type: "all",
    quickType: "all",
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
    { key: "planned", label: t("transactions.filter.planned") },
  ];

  const loadTransactions = async (pageNum = 0, isInitial = false) => {
    try {
      if (pageNum === 0) setLoading(true);
      else setLoadingMore(true);

      const now = new Date();
      now.setHours(23, 59, 59, 999);

      const fiveDaysFuture = new Date();
      fiveDaysFuture.setDate(fiveDaysFuture.getDate() + 5);
      fiveDaysFuture.setHours(23, 59, 59, 999);

      const sixDaysFuture = new Date();
      sixDaysFuture.setDate(sixDaysFuture.getDate() + 6);
      sixDaysFuture.setHours(0, 0, 0, 0);

      const fetchOptions: any = {
        limit: LIMIT,
        offset: pageNum * LIMIT,
      };

      // Date Logic
      if (filters.quickType === "planned") {
        // Show everything from 6 days onwards
        fetchOptions.startDate = sixDaysFuture;
      } else {
        // Show past + today + next 5 days
        fetchOptions.endDate = fiveDaysFuture;
        if (filters.quickType !== "all") {
          fetchOptions.type = filters.quickType;
        }
      }

      const data = await FinancialService.getTransactions(fetchOptions);

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
          account_id: txn.account_id,
          category_id: txn.category_id,
          status: txn.status,
        })) || [];

      if (pageNum === 0) {
        setTransactions(adapted);
        setPage(0);
        hasScrolledRef.current = false; // Reset scroll on fresh reload
      } else {
        setTransactions((prev) => [...prev, ...adapted]);
      }

      setHasMore(adapted.length === LIMIT);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadTransactions(nextPage);
    }
  };

  const handleToggleStatus = async (item: Transaction) => {
    try {
      await FinancialService.toggleTransactionPaymentStatus(item.id);
      // Optimistic update locally to avoid full reload
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id === item.id) {
            return {
              ...t,
              status: t.status === "completed" ? "pending" : "completed",
            };
          }
          return t;
        }),
      );
    } catch (error) {
      console.error(error);
      Alert.alert(t("common.error"), "Não foi possível atualizar o status.");
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

      const matchesType = filters.quickType === "all" || filters.quickType === "planned" ? true : tx.type === filters.quickType;

      // Note: Backend already filters by type if supplied, but we keep this for safety/consistency
      const matchesAccount =
        filters.accountIds.length === 0 ? true : (tx.account_id && filters.accountIds.includes(tx.account_id)) || (tx.credit_card_id && filters.accountIds.includes(tx.credit_card_id!));

      const matchesCategory = filters.categoryIds.length === 0 ? true : tx.category_id && filters.categoryIds.includes(tx.category_id as string);

      return matchesSearch && matchesType && matchesAccount && matchesCategory;
    });
    return groupTransactionsByDate(filtered);
  }, [transactions, searchQuery, filters]);

  useEffect(() => {
    loadTransactions(0);
  }, [filters.quickType, searchQuery]);

  const activeFiltersCount = filters.accountIds.length + filters.categoryIds.length + (filters.quickType !== "all" ? 1 : 0);

  const hasScrolledRef = useRef(false);

  useEffect(() => {
    if (!loading && sections.length > 0 && !hasScrolledRef.current && page === 0) {
      const todayTitle = t("transactions.today");
      const index = sections.findIndex((s) => s.title === todayTitle);
      if (index !== -1 && listRef.current) {
        setTimeout(() => {
          if (listRef.current && sections.length > index) {
            try {
              listRef.current.scrollToLocation({
                sectionIndex: index,
                itemIndex: 0,
                animated: true,
                viewPosition: 0,
              });
            } catch (e) {
              console.warn("Auto-scroll failed:", e);
            }
          }
        }, 500);
      }
      hasScrolledRef.current = true;
    }
  }, [loading, sections, t, page]);

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
        <View style={styles.filtersWrapper}>
          <IconButton icon="tune" size={20} mode={activeFiltersCount > 0 ? "contained" : "outlined"} onPress={() => setFiltersVisible(true)} style={styles.filterButton} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll} decelerationRate="fast">
            {QUICK_FILTERS.map((f) => (
              <Chip
                key={f.key}
                selected={filters.quickType === f.key}
                onPress={() => setFilters((prev) => ({ ...prev, quickType: f.key as any }))}
                style={[styles.chip, filters.quickType === f.key && { backgroundColor: theme.colors.primaryContainer }]}
                textStyle={{ fontSize: 13 }}
                showSelectedOverlay={false}
                selectedColor={theme.colors.primary}
              >
                {f.label}
              </Chip>
            ))}
          </ScrollView>
        </View>
      </View>

      <SectionList
        ref={listRef}
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionItem transaction={item} onPress={() => router.push(`/transactions/${item.id}`)} onToggleStatus={() => handleToggleStatus(item)} />}
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
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ padding: 16 }}>
              <Text style={{ textAlign: "center", opacity: 0.6 }}>Carregando mais...</Text>
            </View>
          ) : null
        }
        onScrollToIndexFailed={(info) => {
          const wait = new Promise((resolve) => setTimeout(resolve, 500));
          wait.then(() => {
            listRef.current?.scrollToLocation({
              sectionIndex: info.index,
              itemIndex: 0,
              animated: true,
            });
          });
        }}
      />

      <GlassFAB icon="plus" style={[styles.fab, { backgroundColor: theme.colors.primary, bottom: fabBottom }]} color={theme.colors.onPrimary} onPress={() => router.push("/add-transaction")} />

      <FiltersModal visible={filtersVisible} onDismiss={() => setFiltersVisible(false)} onApply={(updatedFilters) => setFilters((prev) => ({ ...prev, ...updatedFilters }))} currentFilters={filters} />

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
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  search: {
    marginBottom: 8,
    borderRadius: 12,
    elevation: 0,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  filtersWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  filterButton: {
    margin: 0,
    marginRight: 8,
    borderRadius: 8,
  },
  filtersScroll: {
    paddingRight: 32,
    alignItems: "center",
  },
  chip: {
    marginRight: 6,
    borderRadius: 20,
    height: 32,
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  list: {
    paddingTop: 8,
  },
  sectionHeader: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
  },
});
