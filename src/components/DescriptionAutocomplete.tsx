import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Avatar, Surface, Text, TextInput, useTheme } from "react-native-paper";
import { FinancialService } from "../services/financial";

export interface AutocompleteSuggestion {
  id: string;
  description: string;
  category_id: string | null;
  account_id: string | null;
  credit_card_id: string | null;
  type: string;
  category: { id: string; name: string; icon: string; color: string } | null;
  account: { id: string; name: string; color: string } | null;
  card: { id: string; name: string; color: string } | null;
}

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSelectSuggestion: (suggestion: AutocompleteSuggestion) => void;
  label?: string;
  placeholder?: string;
}

export const DescriptionAutocomplete = ({ value, onChangeText, onSelectSuggestion, label, placeholder }: Props) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const results = await FinancialService.searchTransactionsByDescription(query);
      setSuggestions(results as AutocompleteSuggestion[]);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error("Autocomplete error:", error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchSuggestions(value);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, searchSuggestions]);

  const handleSelectSuggestion = (suggestion: AutocompleteSuggestion) => {
    onChangeText(suggestion.description || "");
    onSelectSuggestion(suggestion);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <View style={styles.container}>
      <TextInput
        label={label || t("transactions.description")}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        mode="outlined"
        style={[styles.input, { backgroundColor: theme.colors.surfaceVariant }]}
        placeholder={placeholder || t("transactions.descriptionPlaceholder")}
        outlineColor={theme.colors.outline}
        activeOutlineColor={theme.colors.primary}
        textColor={theme.colors.onSurface}
        right={loading ? <TextInput.Icon icon="loading" /> : undefined}
      />

      {showSuggestions && suggestions.length > 0 && (
        <Surface style={[styles.suggestionsContainer, { backgroundColor: theme.colors.surface }]} elevation={3}>
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {suggestions.map((item) => (
              <TouchableOpacity key={item.id} style={[styles.suggestionItem, { borderBottomColor: theme.colors.outlineVariant }]} onPress={() => handleSelectSuggestion(item)}>
                <View style={styles.suggestionContent}>
                  {item.category && <Avatar.Icon size={32} icon={item.category.icon || "circle"} style={{ backgroundColor: item.category.color || theme.colors.surfaceVariant }} />}
                  <View style={styles.suggestionText}>
                    <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }} numberOfLines={1}>
                      {item.description}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {item.category?.name || "Sem categoria"}
                      {item.account && ` • ${item.account.name}`}
                      {item.card && ` • ${item.card.name}`}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Surface>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 1000,
    marginBottom: 16,
  },
  input: {
    marginBottom: 0,
  },
  suggestionsContainer: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    maxHeight: 200,
    borderRadius: 8,
    overflow: "hidden",
    zIndex: 1001,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  suggestionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  suggestionText: {
    flex: 1,
  },
});
