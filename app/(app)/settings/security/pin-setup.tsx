import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSecurityStore } from "../../../../src/store/securityStore";

export default function PinSetupScreen() {
  const router = useRouter();
  const { setPin, toggleSecurity } = useSecurityStore();
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [pin, setPinValue] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const handlePress = async (val: string) => {
    if (val === "delete") {
      if (step === "create") setPinValue((p) => p.slice(0, -1));
      else setConfirmPin((p) => p.slice(0, -1));
      return;
    }

    const currentPin = step === "create" ? pin : confirmPin;
    const nextPin = currentPin + val;

    if (nextPin.length <= 4) {
      if (step === "create") setPinValue(nextPin);
      else setConfirmPin(nextPin);

      if (nextPin.length === 4) {
        if (step === "create") {
          setTimeout(() => setStep("confirm"), 300);
        } else {
          // Confirm step
          if (nextPin === pin) {
            await setPin(nextPin);
            await toggleSecurity(true);
            Alert.alert("Sucesso", "Senha cadastrada com sucesso!", [{ text: "OK", onPress: () => router.back() }]);
          } else {
            Alert.alert("Erro", "As senhas não coincidem. Tente novamente.");
            setConfirmPin("");
            setPinValue("");
            setStep("create");
          }
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurar Segurança</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{step === "create" ? "Crie sua senha de 4 dígitos" : "Confirme sua senha"}</Text>

        <View style={styles.pinContainer}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.dot, { backgroundColor: (step === "create" ? pin : confirmPin).length >= i ? "#10B981" : "#333" }]} />
          ))}
        </View>

        <View style={styles.keypad}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <Key key={n} val={n.toString()} onPress={handlePress} />
          ))}
          <View style={styles.keyPlaceholder} />
          <Key val="0" onPress={handlePress} />
          <TouchableOpacity style={styles.actionBtn} onPress={() => handlePress("delete")}>
            <Ionicons name="backspace-outline" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const Key = ({ val, onPress }: { val: string; onPress: (v: string) => void }) => (
  <TouchableOpacity style={styles.key} onPress={() => onPress(val)}>
    <Text style={styles.keyText}>{val}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  header: { flexDirection: "row", alignItems: "center", padding: 20, paddingTop: 60 },
  backBtn: { padding: 8 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginLeft: 16 },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  title: { color: "#fff", fontSize: 18, marginBottom: 40 },
  pinContainer: { flexDirection: "row", marginBottom: 60, gap: 20 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: "#333" },
  keypad: { flexDirection: "row", flexWrap: "wrap", width: 280, justifyContent: "space-between", rowGap: 24 },
  key: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#222", justifyContent: "center", alignItems: "center" },
  keyText: { fontSize: 28, color: "#fff", fontWeight: "500" },
  keyPlaceholder: { width: 72, height: 72 },
  actionBtn: { width: 72, height: 72, justifyContent: "center", alignItems: "center" },
});
