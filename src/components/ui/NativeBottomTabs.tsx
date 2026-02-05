import { createNativeBottomTabNavigator, NativeBottomTabNavigationEventMap, NativeBottomTabNavigationOptions } from "@bottom-tabs/react-navigation";
import { ParamListBase, TabNavigationState } from "@react-navigation/native";
import { withLayoutContext } from "expo-router";

const BottomTabNavigator = createNativeBottomTabNavigator().Navigator;

/**
 * Native Bottom Tabs wrapper for Expo Router
 * Uses native SwiftUI TabView on iOS and BottomNavigationView on Android
 */
export const NativeTabs = withLayoutContext<NativeBottomTabNavigationOptions, typeof BottomTabNavigator, TabNavigationState<ParamListBase>, NativeBottomTabNavigationEventMap>(BottomTabNavigator);

export type { NativeBottomTabNavigationOptions };
