import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from "expo-router/drawer";
import { useTheme } from "react-native-paper";

export default function DrawerLayout() {
  const theme = useTheme();

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
