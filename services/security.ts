import * as SecureStore from "expo-secure-store";

const KEY_PIN = "user_pin";
const KEY_BIOMETRICS_ENABLED = "biometrics_enabled";
const KEY_SECURITY_ENABLED = "security_enabled"; // Toggle master switch

export const savePin = async (pin: string) => {
  await SecureStore.setItemAsync(KEY_PIN, pin);
};

export const validatePin = async (pin: string) => {
  const savedPin = await SecureStore.getItemAsync(KEY_PIN);
  return savedPin === pin;
};

export const hasPin = async () => {
  const savedPin = await SecureStore.getItemAsync(KEY_PIN);
  return !!savedPin;
};

export const setBiometricsEnabled = async (enabled: boolean) => {
  await SecureStore.setItemAsync(KEY_BIOMETRICS_ENABLED, JSON.stringify(enabled));
};

export const getBiometricsEnabled = async () => {
  const enabled = await SecureStore.getItemAsync(KEY_BIOMETRICS_ENABLED);
  return enabled === "true";
};

export const setSecurityEnabled = async (enabled: boolean) => {
  await SecureStore.setItemAsync(KEY_SECURITY_ENABLED, JSON.stringify(enabled));
};

export const getSecurityEnabled = async () => {
  const enabled = await SecureStore.getItemAsync(KEY_SECURITY_ENABLED);
  // Default to false initially, user must enable it
  return enabled === "true";
};

export const clearSecuritySettings = async () => {
  await SecureStore.deleteItemAsync(KEY_PIN);
  await SecureStore.deleteItemAsync(KEY_BIOMETRICS_ENABLED);
  await SecureStore.deleteItemAsync(KEY_SECURITY_ENABLED);
};
