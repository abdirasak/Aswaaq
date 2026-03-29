import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-url-polyfill/auto";
import "./global.css";

function RootNavigation() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="index" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { useAuthStore } = await import("@/store/auth.store");
        const fetchAuthenticatedUser = useAuthStore.getState().fetchAuthenticatedUser;
        await fetchAuthenticatedUser();
      } catch (error) {
        console.log("RootLayout: Auth initialization error (expected if guest):", error);
      }
    };
    
    initializeAuth();
    
    if (Platform.OS === 'android') {
      NavigationBar.setButtonStyleAsync("dark");
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootNavigation />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
