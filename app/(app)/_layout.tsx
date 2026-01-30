import { Drawer } from "expo-router/drawer";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useTheme } from "react-native-paper";

import { SyncLoadingScreen } from "../../src/components/ui/SyncLoadingScreen";
import { useBudgetMonitor } from "../../src/hooks/useBudgetMonitor";
import { useSync } from "../../src/hooks/useSync";
import { useFinancialStore } from "../../src/store/financialStore";

export default function DrawerLayout() {
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
      <Drawer
        screenOptions={{
          headerShown: false,
          drawerStyle: { backgroundColor: theme.colors.surface },
          drawerActiveTintColor: theme.colors.primary,
          drawerInactiveTintColor: theme.colors.onSurface,
        }}
      >
        <Drawer.Screen
          name="(tabs)"
          options={{
            drawerLabel: "Dashboard",
            headerShown: false,
          }}
        />
        {/* We can add more specific drawer screens if needed that are NOT tabs */}
      </Drawer>
    </GestureHandlerRootView>
  );
}
