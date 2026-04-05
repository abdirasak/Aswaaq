import { useAuthStore } from '@/store/auth.store';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TabLayout = () => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  
  // We wrap this in a try/catch or a fallback to prevent the 
  // "Navigation context" error if your Root Layout isn't ready.
  let insets;
  try {
    insets = useSafeAreaInsets();
  } catch (e) {
    insets = { bottom: 0, top: 0, left: 0, right: 0 };
  }

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#FDFBF7]">
        <ActivityIndicator size="large" color="#064229" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  /**
   * FIX LOGIC:
   * We want 20px space. On modern Androids with gesture bars, 
   * insets.bottom provides the bar height. 
   * Adding 20px to that ensures the menu never "drops" or overlaps.
   */
  const bottomMargin = Platform.OS === 'android' 
    ? (insets.bottom > 0 ? insets.bottom + 10 : 20) 
    : 35; // Standard iOS spacing

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true, // Prevents menu from jumping up when typing
        tabBarStyle: {
          position: 'absolute',
          bottom: bottomMargin,
          left: 16,
          right: 16,
          height: 64,
          backgroundColor: '#064229',
          borderRadius: 32,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.25,
          shadowRadius: 3.5,
          paddingBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 10,
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="likedAds"
        options={{
          title: 'Liked',
          tabBarIcon: ({ color }) => (
            <Ionicons name="heart-outline" size={22} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="postAd"
        options={{
          title: '',
          tabBarIcon: () => (
            <View
              style={{
                width: 58,
                height: 58,
                backgroundColor: '#064229',
                borderRadius: 29,
                justifyContent: 'center',
                alignItems: 'center',
                top: -15, 
                borderWidth: 5,
                borderColor: '#FDFBF7', 
                elevation: 12, 
              }}
            >
              <Ionicons name="add" size={32} color="#fff" />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings-outline" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          // Use href: null to hide the tab if user is an admin
          href: isAdmin ? null : undefined,
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          // Only show tab if user is admin
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color }) => (
            <Ionicons name="shield-checkmark-outline" size={22} color={color} />
          ),
        }}
      />

      {/* Hidden Screens */}
      <Tabs.Screen name="country" options={{ href: null }} />
      <Tabs.Screen name="showAds" options={{ href: null }} />
      <Tabs.Screen name="showCategory" options={{ href: null }} />
      <Tabs.Screen name="showCity" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
};

export default TabLayout;