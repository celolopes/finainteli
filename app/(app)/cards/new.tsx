import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Appbar, Button, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";
import { PaywallModal } from "../../../src/components/paywall/PaywallModal";
import { GlassAppbar } from "../../../src/components/ui/GlassAppbar";
import { usePremium } from "../../../src/hooks/usePremium";
import { FinancialService } from "../../../src/services/financial";
import { CurrencyUtils } from "../../../src/utils/currency";

const COLORS = ["#6750A4", "#B3261E", "#7D5260", "#625B71", "#5B8C5A", "#EA8C00", "#00796B", "#3E2723"];
const FREE_CARD_LIMIT = 1;

export default function CardForm() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isEdit = !!params.id;

  const { isPro, checkStatus } = usePremium();

  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [cardCount, setCardCount] = useState(0);

  // Form State
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [currentInvoice, setCurrentInvoice] = useState("");
  const [closingDay, setClosingDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [brand, setBrand] = useState("mastercard");
  const [color, setColor] = useState(COLORS[0]);
  const [currency, setCurrency] = useState("BRL");

  const [currencies, setCurrencies] = useState<any[]>([]);

  useEffect(() => {
    loadCurrencies();
    if (isEdit) {
      loadCardDetails();
    }
    loadCardCount();
  }, []);

  const loadCurrencies = async () => {
    const data = await FinancialService.getCurrencies();
    setCurrencies(data || []);
  };

  const loadCardDetails = async () => {
    if (!params.id) return;
    setLoading(true);
    try {
      const card = await FinancialService.getCardById(params.id as string);
      if (card) {
        setName(card.name);
        setLimit(CurrencyUtils.format(card.credit_limit, card.currency_code).replace(/[^\d,]/g, ""));
        // For current invoice, we show the current balance
        setCurrentInvoice(CurrencyUtils.format(card.current_balance || 0, card.currency_code).replace(/[^\d,]/g, ""));
        setClosingDay(String(card.closing_day || ""));
        setDueDay(String(card.due_day || ""));
        setBrand(card.brand || "mastercard");
        setColor(card.color || COLORS[0]);
        setCurrency(card.currency_code);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadCardCount = async () => {
    const cards = await FinancialService.getCreditCards();
    setCardCount(cards?.length || 0);
  };

  const handleSave = async () => {
    if (!name || !limit || !closingDay || !dueDay) return; // Basic validation

    // Verificar limite para usuários gratuitos (apenas na criação)
    if (!isEdit && !isPro && cardCount >= FREE_CARD_LIMIT) {
      setShowPaywall(true);
      return;
    }

    setLoading(true);

    try {
      const limitValue = CurrencyUtils.parse(limit, currency);
      const invoiceValue = CurrencyUtils.parse(currentInvoice, currency);
      const closing = parseInt(closingDay);
      const due = parseInt(dueDay);

      const cardData = {
        name,
        credit_limit: limitValue,
        current_balance: invoiceValue, // Fatura atual
        closing_day: closing,
        due_day: due,
        brand,
        color,
        currency_code: currency,
        icon: null,
        user_id: undefined as any,
        is_active: true,
      };

      if (isEdit) {
        await FinancialService.updateCreditCard(params.id as string, cardData);
      } else {
        await FinancialService.createCreditCard(cardData);
      }

      router.back();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaywallSuccess = () => {
    checkStatus(); // Refresh pro status
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GlassAppbar elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={isEdit ? "Editar Cartão" : "Novo Cartão"} />
      </GlassAppbar>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        {loading && isEdit ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <TextInput label="Nome do Cartão" value={name} onChangeText={setName} mode="outlined" style={styles.input} placeholder="Ex: Nubank Platinum" />

            <Text variant="titleMedium" style={styles.label}>
              Bandeira
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              <SegmentedButtons
                value={brand}
                onValueChange={setBrand}
                buttons={[
                  { value: "mastercard", label: "Mastercard" },
                  { value: "visa", label: "Visa" },
                  { value: "amex", label: "Amex" },
                  { value: "elo", label: "Elo" },
                  { value: "other", label: "Outro" },
                ]}
                style={{ minWidth: 400 }}
              />
            </ScrollView>

            <View style={styles.row}>
              <TextInput
                label="Limite Total"
                value={limit}
                onChangeText={(text) => setLimit(CurrencyUtils.maskInput(text, currency))}
                mode="outlined"
                keyboardType="numeric"
                style={[styles.input, { flex: 1, marginRight: 12 }]}
                left={<TextInput.Affix text={CurrencyUtils.getSymbol(currency) + " "} />}
              />
              <TextInput
                label="Fatura Atual"
                value={currentInvoice}
                onChangeText={(text) => setCurrentInvoice(CurrencyUtils.maskInput(text, currency))}
                mode="outlined"
                keyboardType="numeric"
                style={[styles.input, { flex: 1 }]}
                left={<TextInput.Affix text={CurrencyUtils.getSymbol(currency) + " "} />}
              />
            </View>

            <View style={styles.row}>
              <TextInput
                label="Dia Fechamento"
                value={closingDay}
                onChangeText={setClosingDay}
                mode="outlined"
                keyboardType="numeric"
                placeholder="1-31"
                maxLength={2}
                style={[styles.input, { flex: 1, marginRight: 12 }]}
              />
              <TextInput label="Dia Vencimento" value={dueDay} onChangeText={setDueDay} mode="outlined" keyboardType="numeric" placeholder="1-31" maxLength={2} style={[styles.input, { flex: 1 }]} />
            </View>

            <Text variant="titleMedium" style={styles.label}>
              Cor de Identificação
            </Text>
            <View style={styles.colorGrid}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  style={[styles.colorItem, { backgroundColor: c }, color === c && [styles.selectedColor, { borderColor: theme.colors.onSurface }]]}
                />
              ))}
            </View>

            <Button mode="contained" onPress={handleSave} loading={loading} style={styles.button} contentStyle={{ height: 50 }}>
              Salvar Cartão
            </Button>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      <PaywallModal visible={showPaywall} onDismiss={() => setShowPaywall(false)} onSuccess={handlePaywallSuccess} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  label: {
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    marginBottom: 16,
    // backgroundColor: "white", -- REMOVED
  },
  typeScroll: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 32,
  },
  colorItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  selectedColor: {
    borderWidth: 3,
    // borderColor: "black", -- Removed, handled in render
    transform: [{ scale: 1.1 }],
  },
  button: {
    borderRadius: 8,
    marginTop: 16,
  },
});
