import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Appbar, Button, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";
import { PaywallModal } from "../../../src/components/paywall/PaywallModal";
import { usePremium } from "../../../src/hooks/usePremium";
import { FinancialService } from "../../../src/services/financial";
import { CurrencyUtils } from "../../../src/utils/currency";

const COLORS = ["#6750A4", "#B3261E", "#7D5260", "#625B71", "#5B8C5A", "#EA8C00", "#00796B", "#3E2723"];
const FREE_ACCOUNT_LIMIT = 2;

export default function AccountForm() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const isEdit = !!params.id;

  const { isPro, checkStatus } = usePremium();

  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [accountCount, setAccountCount] = useState(0);

  // Form State
  const [name, setName] = useState("");
  const [type, setType] = useState("checking");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState("BRL");
  const [color, setColor] = useState(COLORS[0]);
  const [institution, setInstitution] = useState("");

  const [currencies, setCurrencies] = useState<any[]>([]);

  useEffect(() => {
    loadCurrencies();
    loadAccountCount();
  }, []);

  const loadCurrencies = async () => {
    const data = await FinancialService.getCurrencies();
    setCurrencies(data || []);
  };

  const loadAccountCount = async () => {
    const accounts = await FinancialService.getAccounts();
    setAccountCount(accounts?.length || 0);
  };

  const handleSave = async () => {
    if (!name) return; // Add validation error handling

    // Verificar limite para usuários gratuitos (apenas na criação)
    if (!isEdit && !isPro && accountCount >= FREE_ACCOUNT_LIMIT) {
      setShowPaywall(true);
      return;
    }

    setLoading(true);

    try {
      const balanceValue = CurrencyUtils.parse(balance, currency);

      const accountData = {
        name,
        account_type: type as any,
        current_balance: balanceValue,
        initial_balance: isEdit ? 0 : balanceValue, // Ensure number type
        currency_code: currency,
        color,
        institution,
        icon: null, // TODO: Icon selector
        user_id: undefined as any, // Auth handles
        is_active: true,
        is_included_in_total: true,
      };

      if (isEdit) {
        // Update logic (FinancialService needs updateAccount)
        // await FinancialService.updateAccount(params.id, accountData);
        // TODO: Implement updateAccount in service
        console.warn("Edit not fully implemented yet");
      } else {
        // Create
        await FinancialService.createAccount(accountData);
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
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={isEdit ? "Editar Conta" : "Nova Conta"} />
      </Appbar.Header>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text variant="titleMedium" style={styles.label}>
            Tipo de Conta
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
            <SegmentedButtons
              value={type}
              onValueChange={setType}
              buttons={[
                { value: "checking", label: "Corrente", icon: "bank" },
                { value: "savings", label: "Poupança", icon: "piggy-bank" },
                { value: "investment", label: "Investimento" },
                { value: "cash", label: "Dinheiro" },
                { value: "digital_wallet", label: "Digital" },
              ]}
              style={{ minWidth: 500 }} // Hack para permitir scroll largo
            />
          </ScrollView>
          <TextInput label="Nome da Conta" value={name} onChangeText={setName} mode="outlined" style={styles.input} placeholder="Ex: Nubank Principal" />
          <TextInput label="Instituição (Opcional)" value={institution} onChangeText={setInstitution} mode="outlined" style={styles.input} />

          <View style={styles.row}>
            <TextInput
              label="Saldo Atual"
              value={balance}
              onChangeText={(text) => setBalance(CurrencyUtils.maskInput(text, currency))}
              mode="outlined"
              keyboardType="numeric"
              style={[styles.input, { flex: 2, marginRight: 12 }]}
              left={<TextInput.Affix text={CurrencyUtils.getSymbol(currency) + " "} />}
            />

            {/* Simple Currency Selector */}
            <TextInput label="Moeda" value={currency} editable={false} mode="outlined" style={[styles.input, { flex: 1 }]} />
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
            Salvar Conta
          </Button>
        </ScrollView>
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
    // borderColor: "black", -- Removed
    transform: [{ scale: 1.1 }],
  },
  button: {
    borderRadius: 8,
    marginTop: 16,
  },
});
