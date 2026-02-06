import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

interface PendingData {
  count: number;
  total: number;
}

interface PendingAlertsCarouselProps {
  pendingBills: PendingData;
  pendingIncome: PendingData;
}

const CARD_MARGIN = 16;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 2;

export const PendingAlertsCarousel = ({ pendingBills, pendingIncome }: PendingAlertsCarouselProps) => {
  const theme = useTheme();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const hasBills = pendingBills.count > 0;
  const hasIncome = pendingIncome.count > 0;
  const hasMultiple = hasBills && hasIncome;

  // If neither exists, render nothing
  if (!hasBills && !hasIncome) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(i18n.language || "pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CARD_WIDTH);
    setActiveIndex(index);
  };

  const navigateToTransactions = () => {
    router.push("/(app)/(tabs)/transactions");
  };

  const billsLabel = pendingBills.count === 1 ? t("dashboard.pendingBills.singular") : t("dashboard.pendingBills.plural", { count: pendingBills.count });

  const incomeLabel = pendingIncome.count === 1 ? t("dashboard.pendingIncome.singular") : t("dashboard.pendingIncome.plural", { count: pendingIncome.count });

  // Build cards array based on what exists
  const cards: React.ReactNode[] = [];

  if (hasBills) {
    cards.push(
      <TouchableOpacity
        key="bills"
        onPress={navigateToTransactions}
        activeOpacity={0.7}
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.elevation.level2,
            borderColor: theme.colors.error + "40",
            width: hasMultiple ? CARD_WIDTH - 20 : CARD_WIDTH,
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.error + "20" }]}>
          <MaterialCommunityIcons name="cash-clock" size={24} color={theme.colors.error} />
        </View>

        <View style={styles.content}>
          <Text variant="titleSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
            {t("dashboard.pendingBills.title")}
          </Text>
          <Text variant="bodySmall" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            {billsLabel} {t("dashboard.pendingBills.totalLabel")} {formatCurrency(pendingBills.total)}
          </Text>
        </View>

        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.primary} />
      </TouchableOpacity>,
    );
  }

  if (hasIncome) {
    cards.push(
      <TouchableOpacity
        key="income"
        onPress={navigateToTransactions}
        activeOpacity={0.7}
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.elevation.level2,
            borderColor: "#4ADE80" + "40",
            width: hasMultiple ? CARD_WIDTH - 20 : CARD_WIDTH,
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: "#4ADE8020" }]}>
          <MaterialCommunityIcons name="cash-plus" size={24} color="#4ADE80" />
        </View>

        <View style={styles.content}>
          <Text variant="titleSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
            {t("dashboard.pendingIncome.title")}
          </Text>
          <Text variant="bodySmall" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            {incomeLabel} {t("dashboard.pendingIncome.totalLabel")} {formatCurrency(pendingIncome.total)}
          </Text>
        </View>

        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.primary} />
      </TouchableOpacity>,
    );
  }

  // If only one card, render it directly without scroll
  if (!hasMultiple) {
    return <View style={styles.container}>{cards[0]}</View>;
  }

  // Multiple cards - render carousel
  return (
    <View style={styles.carouselContainer}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH - 10}
        decelerationRate="fast"
      >
        {cards}
      </ScrollView>

      {/* Pagination Indicators */}
      <View style={styles.pagination}>
        {cards.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === activeIndex ? theme.colors.primary : theme.colors.outlineVariant,
                width: index === activeIndex ? 20 : 8,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: CARD_MARGIN,
    marginBottom: 12,
  },
  carouselContainer: {
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: CARD_MARGIN,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: "600",
    marginBottom: 2,
  },
  subtitle: {
    opacity: 0.9,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
