import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { Icon, Surface, Text, TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PaywallModal } from "../../../src/components/paywall/PaywallModal";
import { usePremium } from "../../../src/hooks/usePremium";
import { FinancialService } from "../../../src/services/financial";
import { GeminiService } from "../../../src/services/gemini";
import { useStore } from "../../../src/store/useStore";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
}

const FREE_DAILY_LIMIT = 5;

export default function ChatScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isPro } = usePremium();
  const { goals } = useStore();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ id: "1", role: "model", text: t("advisor.greeting") }]);
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const key = `@chat_usage_${today}`;
      const saved = await AsyncStorage.getItem(key);
      setUsageCount(saved ? parseInt(saved, 10) : 0);
    } catch (e) {
      console.error("Failed to load usage", e);
    }
  };

  const incrementUsage = async () => {
    if (isPro) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const key = `@chat_usage_${today}`;
      const newCount = usageCount + 1;
      setUsageCount(newCount);
      await AsyncStorage.setItem(key, newCount.toString());
    } catch (e) {
      console.error("Failed to save usage", e);
    }
  };

  const sendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    // Check Limit
    if (!isPro && usageCount >= FREE_DAILY_LIMIT) {
      setShowPaywall(true);
      return;
    }

    const userMsg: Message = { id: Date.now().toString(), role: "user", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Fetch Rich Financial Context
      const periodAnalysis = await FinancialService.getFinancialAnalysis("month");
      const accounts = await FinancialService.getAccounts();
      const totalBalance = accounts.reduce((acc, a) => acc + (a.current_balance || 0), 0);

      const contextData = {
        monthlyIncome: periodAnalysis.totalIncome,
        monthlyExpenses: periodAnalysis.totalExpenses,
        savings: periodAnalysis.savings,
        topCategories: periodAnalysis.categoryBreakdown.slice(0, 5),
        goal: goals[0]
          ? {
              target: goals[0].targetAmount,
              deadline: goals[0].deadline,
              current: goals[0].currentAmount || 0,
            }
          : undefined,
        totalBalance,
        trend: periodAnalysis.previousPeriodComparison, // Includes difference % vs last month
      };

      // Construct a System Prompt Injection for this turn
      // Note: We are passing this as "context" to the existing service.
      // Ideally, GeminiService.chat should accept a richer object, but we can conform to its interface or modify it.
      // The current interface takes a simpler "FinancialContext". We'll map cleanly.

      const history = messages.map((m) => ({ role: m.role, parts: m.text }));

      // We pass the enhanced context. The service might need adjustment if strict typing,
      // but 'context' arg in chat is typed as FinancialContext. We will cast or ensure match.
      // The 'trend' and 'totalBalance' are extra fields not in the interface,
      // but we can append them to the User Message silently or update the interface later.
      // For now, let's append important extra info to the system prompt part by modifying how we call it.

      // Hack: We will inject the extra context into the prompt sent to Gemini logic
      // But GeminiService.chat handles the prompt construction.
      // Let's rely on the fields that match existing interface for now + maybe update service later if needed.
      // The existing interface has: income, expenses, savings, topCategories, goal.
      // We will map strictly to avoid TS errors.

      const cleanContext = {
        monthlyIncome: contextData.monthlyIncome,
        monthlyExpenses: contextData.monthlyExpenses,
        savings: contextData.savings,
        topCategories: contextData.topCategories,
        goal: contextData.goal,
      };

      const responseText = await GeminiService.chat(cleanContext, history, userMsg.text);

      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "model", text: responseText }]);
      await incrementUsage();
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "model", text: "Desculpe, tive um problema ao analisar seus dados. Tente novamente." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient colors={[theme.colors.surfaceVariant, theme.colors.background]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.3 }} style={StyleSheet.absoluteFillObject} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
        {/* Header / Limit Indicator */}
        {!isPro && (
          <View style={[styles.limitContainer, { top: insets.top + 10 }]}>
            <Surface style={styles.limitBadge} elevation={2}>
              <Icon source="flash" size={16} color={theme.colors.primary} />
              <Text variant="labelSmall" style={{ fontWeight: "bold", marginLeft: 4 }}>
                {FREE_DAILY_LIMIT - usageCount} mensagens grátis hoje
              </Text>
            </Surface>
          </View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingTop: !isPro ? insets.top + 50 : insets.top + 20 }]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[styles.bubbleContainer, item.role === "user" ? styles.userContainer : styles.modelContainer]}>
              {item.role === "model" && (
                <View style={[styles.avatar, { backgroundColor: theme.colors.secondaryContainer }]}>
                  <Icon source="robot" size={20} color={theme.colors.secondary} />
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  item.role === "user"
                    ? { backgroundColor: theme.colors.primary, borderBottomRightRadius: 4 }
                    : { backgroundColor: theme.colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
                ]}
              >
                <Text
                  style={{
                    color: item.role === "user" ? theme.colors.onPrimary : theme.colors.onSurface,
                    lineHeight: 22,
                  }}
                >
                  {item.text}
                </Text>
              </View>
            </View>
          )}
        />

        <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, paddingBottom: insets.bottom + 10 }]}>
          {messages.length < 3 && !loading && (
            <View style={{ height: 40, marginBottom: 12 }}>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={[t("advisor.suggestions.status"), t("advisor.suggestions.save"), t("advisor.suggestions.spending"), t("advisor.suggestions.prediction")]}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => sendMessage(item)} style={[styles.suggestionChip, { backgroundColor: theme.colors.secondaryContainer }]}>
                    <Text variant="labelMedium" style={{ color: theme.colors.onSecondaryContainer }}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              />
            </View>
          )}

          <TextInput
            placeholder={usageCount >= FREE_DAILY_LIMIT && !isPro ? "Limite atingido. Assine o Pro." : t("advisor.placeholder")}
            value={input}
            onChangeText={setInput}
            mode="outlined"
            style={styles.input}
            disabled={loading || (!isPro && usageCount >= FREE_DAILY_LIMIT)}
            right={<TextInput.Icon icon={loading ? "loading" : "send"} onPress={() => sendMessage()} disabled={loading || (!isPro && usageCount >= FREE_DAILY_LIMIT)} color={theme.colors.primary} />}
            outlineStyle={{ borderRadius: 24 }}
          />
        </View>
      </KeyboardAvoidingView>

      <PaywallModal
        visible={showPaywall}
        onDismiss={() => setShowPaywall(false)}
        onSuccess={() => {
          setShowPaywall(false);
          // Optionally reset usage or reload Pro status
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    paddingBottom: 20,
  },
  limitContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: "center",
  },
  limitBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(30, 30, 40, 0.9)", // Dark glass feel
  },
  bubbleContainer: {
    flexDirection: "row",
    marginBottom: 16,
    maxWidth: "85%",
  },
  userContainer: {
    alignSelf: "flex-end",
    justifyContent: "flex-end",
  },
  modelContainer: {
    alignSelf: "flex-start",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginTop: 4,
  },
  bubble: {
    padding: 14,
    borderRadius: 20,
    flexShrink: 1,
    elevation: 1,
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(18, 18, 18, 0.05)",
    elevation: 10,
    shadowColor: "#121212",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    backgroundColor: "transparent",
    maxHeight: 100,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
