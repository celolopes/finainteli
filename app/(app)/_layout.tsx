import { Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useTheme } from "react-native-paper";

import { SyncLoadingScreen } from "../../src/components/ui/SyncLoadingScreen";
import { useBudgetMonitor } from "../../src/hooks/useBudgetMonitor";
import { useSync } from "../../src/hooks/useSync";
import { useFinancialStore } from "../../src/store/financialStore";

export default function AppLayout() {
  const theme = useTheme();
  useBudgetMonitor();
  const { isSyncing } = useSync();
  const { fetchDashboardData } = useFinancialStore();

  useEffect(() => {
    if (!isSyncing) {
      fetchDashboardData();
    }
  }, [isSyncing]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SyncLoadingScreen visible={isSyncing} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Detail screens and modals will be managed by this stack */}
      </Stack>
    </GestureHandlerRootView>
  );
}
