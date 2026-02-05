import { Redirect } from "expo-router";
import { View } from "react-native";
import { useAuthStore } from "../src/store/authStore";

export default function Index() {
  const { session, initialized } = useAuthStore();

  // Show loading spinner while auth is initializing
  if (!initialized) {
    return <View style={{ flex: 1, backgroundColor: "#121212" }} />;
  }

  if (session) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
