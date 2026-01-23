import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Avatar, Surface, Text, TextInput, useTheme } from "react-native-paper";
import { GeminiService } from "../../../src/services/gemini";
import { useStore } from "../../../src/store/useStore";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
}

export default function ChatScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { transactions, goals } = useStore();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ id: "1", role: "model", text: t("advisor.greeting") }]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Context preparation
    let inc = 0,
      exp = 0;
    const cats: Record<string, number> = {};
    transactions.forEach((t) => {
      if (t.type === "income") inc += t.amount;
      else {
        exp += t.amount;
        cats[t.category] = (cats[t.category] || 0) + t.amount;
      }
    });

    const context = {
      monthlyIncome: inc,
      monthlyExpenses: exp,
      savings: inc - exp,
      topCategories: Object.entries(cats)
        .map(([k, v]) => ({ category: k, amount: v }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3),
      goal: goals[0]
        ? {
            target: goals[0].targetAmount,
            deadline: goals[0].deadline,
            current: goals[0].currentAmount || inc - exp,
          }
        : undefined,
    };

    const history = messages.map((m) => ({ role: m.role, parts: m.text }));
    const responseText = await GeminiService.chat(context, history, userMsg.text);

    setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "model", text: responseText }]);
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.container, { backgroundColor: theme.colors.background }]} keyboardVerticalOffset={100}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.bubbleContainer, item.role === "user" ? styles.userContainer : styles.modelContainer]}>
            {item.role === "model" && <Avatar.Icon size={32} icon="robot" style={{ backgroundColor: theme.colors.secondary, marginRight: 8 }} />}
            <Surface style={[styles.bubble, { backgroundColor: item.role === "user" ? theme.colors.primary : theme.colors.surfaceVariant }]}>
              <Text style={{ color: item.role === "user" ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}>{item.text}</Text>
            </Surface>
          </View>
        )}
      />

      <View style={[styles.inputContainer, { backgroundColor: theme.colors.elevation.level1 }]}>
        <TextInput
          placeholder={t("advisor.placeholder")}
          value={input}
          onChangeText={setInput}
          mode="outlined"
          style={styles.input}
          disabled={loading}
          right={<TextInput.Icon icon="send" onPress={sendMessage} disabled={loading} />}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
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
  bubble: {
    padding: 12,
    borderRadius: 16,
    flexShrink: 1,
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  input: {
    backgroundColor: "transparent",
  },
});
