import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import React, { useEffect, useRef, useState } from "react";
import { AppState, Dimensions, Keyboard, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSecurityStore } from "../../store/securityStore";

const { width } = Dimensions.get("window");

export const LockScreen = () => {
  const { isLocked, unlockApp, validatePin, isBiosEnabled, lockApp } = useSecurityStore();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [biometryType, setBiometryType] = useState<LocalAuthentication.AuthenticationType | null>(null);
  const autoAttemptRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    LocalAuthentication.supportedAuthenticationTypesAsync().then((types) => {
      if (types.length > 0) {
        setBiometryType(types[0]);
      }
    });
  }, []);

  useEffect(() => {
    if (isLocked) {
      Keyboard.dismiss();
      setPin("");
      setError(false);
      autoAttemptRef.current = false;
      // Auto-trigger bio when the app is active
      if (isBiosEnabled && appStateRef.current === "active") {
        autoAttemptRef.current = true;
        authenticate();
      }
    }
  }, [isLocked, isBiosEnabled]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      appStateRef.current = nextState;
      if (nextState === "active" && isLocked && isBiosEnabled && !autoAttemptRef.current) {
        autoAttemptRef.current = true;
        authenticate();
      }
    });

    return () => subscription.remove();
  }, [isLocked, isBiosEnabled]);

  const authenticate = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Desbloquear Finainteli",
        fallbackLabel: "Usar PIN",
        disableDeviceFallback: true, // We have our own PIN fallback
        cancelLabel: "Cancelar",
      });
      if (result.success) {
        unlockApp();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      console.log("Biometric error", e);
    }
  };

  if (!isLocked) return null;

  const handlePress = async (val: string) => {
    Keyboard.dismiss();
    if (val === "delete") {
      setPin((prev) => prev.slice(0, -1));
      setError(false);
      return;
    }

    if (val === "bio") {
      authenticate();
      return;
    }

    const newPin = pin + val;
    if (pin.length < 4) {
      setPin(newPin);
      if (newPin.length === 4) {
        const valid = await validatePin(newPin);
        if (valid) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          unlockApp();
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError(true);
          setPin("");
        }
      } else {
        Haptics.selectionAsync();
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: "#111" }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed-outline" size={40} color="#fff" />
        </View>
        <Text style={styles.title}>Finainteli Bloqueado</Text>
        <Text style={styles.subtitle}>Digite seu PIN para acessar</Text>

        <View style={styles.pinContainer}>
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: pin.length >= i ? "#10B981" : "#333",
                  borderColor: error ? "red" : "#333",
                  borderWidth: 1,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.keypad}>
          {[1, 2, 3].map((n) => (
            <Key key={n} val={n.toString()} onPress={handlePress} />
          ))}
          {[4, 5, 6].map((n) => (
            <Key key={n} val={n.toString()} onPress={handlePress} />
          ))}
          {[7, 8, 9].map((n) => (
            <Key key={n} val={n.toString()} onPress={handlePress} />
          ))}

          <View style={styles.keyActions}>
            {isBiosEnabled && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => handlePress("bio")}>
                <Ionicons name="finger-print" size={32} color="#10B981" />
              </TouchableOpacity>
            )}
            {!isBiosEnabled && <View style={styles.keyPlaceholder} />}
          </View>

          <Key val="0" onPress={handlePress} />

          <View style={styles.keyActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => handlePress("delete")}>
              <Ionicons name="backspace-outline" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const Key = ({ val, onPress }: { val: string; onPress: (v: string) => void }) => (
  <TouchableOpacity style={styles.key} onPress={() => onPress(val)}>
    <Text style={styles.keyText}>{val}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 20,
    backgroundColor: "#333",
    padding: 16,
    borderRadius: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#aaa",
    marginBottom: 40,
  },
  pinContainer: {
    flexDirection: "row",
    marginBottom: 60,
    gap: 20,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 280,
    justifyContent: "space-between",
    rowGap: 24,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
  keyText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "500",
  },
  keyActions: {
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
  },
  keyPlaceholder: {
    width: 72,
    height: 72,
  },
  actionBtn: {
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
  },
});
