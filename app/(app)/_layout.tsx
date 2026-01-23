import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useTheme } from "react-native-paper";

import { useBudgetMonitor } from "../../src/hooks/useBudgetMonitor";
import { useSync } from "../../src/hooks/useSync";

export default function DrawerLayout() {
  const theme = useTheme();
  useBudgetMonitor();
  useSync();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
