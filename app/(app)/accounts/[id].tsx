import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Appbar, Button, Dialog, Portal, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";
import { GlassAppbar } from "../../../src/components/ui/GlassAppbar";
import { usePremium } from "../../../src/hooks/usePremium";
import { FinancialService } from "../../../src/services/financial";
import { CurrencyUtils } from "../../../src/utils/currency";

const COLORS = ["#6750A4", "#B3261E", "#7D5260", "#625B71", "#5B8C5A", "#EA8C00", "#00796B", "#3E2723"];

export default function EditAccount() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const { isPro } = usePremium();

  const [loading, setLoading] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

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
    if (id) {
      loadAccount();
    }
  }, [id]);

  const loadCurrencies = async () => {
    const data = await FinancialService.getCurrencies();
    setCurrencies(data || []);
  };

  const loadAccount = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const account = await FinancialService.getAccountById(id as string);
      if (account) {
        setName(account.name);
        setType(account.account_type);
        setCurrency(account.currency_code);
        setBalance(CurrencyUtils.maskInput(account.current_balance?.toString() || "0", account.currency_code));
        setColor(account.color || COLORS[0]);
        // institution is not in the schema yet, but if it were, we'd load it here
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Erro", "Não foi possível carregar a conta.");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name) return;

    setLoading(true);

    try {
      const balanceValue = CurrencyUtils.parse(balance, currency);

      const accountData = {
        name,
        account_type: type as any,
        // current_balance: balanceValue, // Handled by setAccountCurrentBalance
        currency_code: currency,
        color,
      };

      await FinancialService.updateAccount(id as string, accountData);

      // Correctly set balance affecting initial_balance
      await FinancialService.setAccountCurrentBalance(id as string, balanceValue);

      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao atualizar conta.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteDialogVisible(false);
    setLoading(true);

    try {
      // 1. Validate if account can be deleted
      const check = await FinancialService.checkAccountCanBeDeleted(id as string);

      if (!check.allowed) {
        setLoading(false);
        Alert.alert("Não é possível excluir", check.reason || "Existem pendências vinculadas a esta conta.");
        return;
      }

      // 2. Proceed with deletion
      await FinancialService.deleteAccount(id as string);
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao excluir conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GlassAppbar elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Editar Conta" />
        <Appbar.Action icon="trash-can-outline" onPress={() => setDeleteDialogVisible(true)} color={theme.colors.error} />
      </GlassAppbar>

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
              style={{ minWidth: 500 }}
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
            Salvar Alterações
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Excluir Conta</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">Tem certeza que deseja excluir esta conta? Todas as transações associadas também podem ser afetadas.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancelar</Button>
            <Button onPress={handleDelete} textColor={theme.colors.error}>
              Excluir
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    transform: [{ scale: 1.1 }],
  },
  button: {
    borderRadius: 8,
    marginTop: 16,
  },
});
