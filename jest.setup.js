import "react-native-gesture-handler/jestSetup";

jest.mock("@react-native-async-storage/async-storage", () => require("@react-native-async-storage/async-storage/jest/async-storage-mock"));

// Mock fonts
jest.mock("expo-font", () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn().mockReturnValue(true),
}));

// Mock expo-status-bar
jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

// Mock Env
process.env.EXPO_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = "mock-key";
process.env.EXPO_PUBLIC_GEMINI_API_KEY = "mock-gemini-key";
