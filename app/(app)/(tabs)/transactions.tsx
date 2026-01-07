import React, { useState } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Searchbar, FAB, useTheme, Chip, Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { useStore } from "../../../src/store/useStore";
import { TransactionItem } from "../../../src/components/TransactionItem";

const FILTERS = ["All", "Income", "Expense"];

export default function TransactionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { transactions } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const filteredData = transactions.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "All" ? true : t.type === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Searchbar placeholder="Search transactions" onChangeText={setSearchQuery} value={searchQuery} style={styles.search} />
        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <Chip key={f} selected={filter === f} onPress={() => setFilter(f)} style={styles.chip} showSelectedOverlay>
              {f}
            </Chip>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 32, opacity: 0.5 }}>No transactions found</Text>}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => router.push("/add-transaction")} // We need to create this route
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
