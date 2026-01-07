import { MD3Colors } from "react-native-paper/lib/typescript/types";

declare global {
  namespace ReactNativePaper {
    interface ThemeColors {
      success: string;
      error: string;
      // add other custom colors if needed
    }
  }
}
