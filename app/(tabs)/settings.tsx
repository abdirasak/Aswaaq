import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllUserAds, updateProfile } from '../../lib/appwrite';
import { useAuthStore } from '../../store/auth.store';
import { useNotificationsStore } from '../../store/notifications.store';

const COUNTRIES = [
  {
    id: 'Egypt',
    name: 'Egypt',
    flag: 'https://flagcdn.com/w320/eg.png',
  },
  {
    id: 'Kenya',
    name: 'Kenya',
    flag: 'https://flagcdn.com/w320/ke.png',
  },
];

export default function Settings() {
  const router = useRouter();
  const { user, logout, setUser, selectedCountry, setSelectedCountry } = useAuthStore();
  const { 
    notificationCount, 
    setNotificationCount, 
    markNotificationsAsViewed, 
    isAdViewed,
    loadUserNotifications, 
    saveUserNotifications 
  } = useNotificationsStore();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleNotificationsPress = async () => {
    if (!user) return;
    
    try {
      // Get current user ads to mark them as viewed
      const userAds = await getAllUserAds();
      const currentUserAds = userAds.filter((ad: any) => {
        const adSellerId = typeof ad.seller === 'string' ? ad.seller : ad.seller?.$id;
        return adSellerId === user.$id;
      });

      // Get notification ads (approved/rejected)
      const notificationAds = currentUserAds.filter((ad: any) => 
        ad.status === 'approved' || ad.status === 'rejected'
      );

      // Mark all current notification ads as viewed
      const adIds = notificationAds.map((ad: any) => ad.$id);
      markNotificationsAsViewed(adIds);
      await saveUserNotifications(user.$id);
      
      router.push('/(tabs)/notifications');
    } catch (error) {
      console.error('Error marking notifications as viewed:', error);
      router.push('/(tabs)/notifications');
    }
  };

  useEffect(() => {
    const loadNotificationCount = async () => {
      if (!user) return;
      
      try {
        // Load user's viewed notifications first
        await loadUserNotifications(user.$id);
        
        const userAds = await getAllUserAds();
        
        const currentUserAds = userAds.filter((ad: any) => {
          const adSellerId = typeof ad.seller === 'string' ? ad.seller : ad.seller?.$id;
          return adSellerId === user.$id;
        });

        // Get all notifications (approved/rejected ads)
        const allNotifications = currentUserAds.filter((ad: any) => 
          ad.status === 'approved' || ad.status === 'rejected'
        );

        // Count only unviewed notifications
        const unviewedNotifications = allNotifications.filter((ad: any) => 
          !isAdViewed(ad.$id)
        );

        setNotificationCount(unviewedNotifications.length);
      } catch (error) {
        console.error('Error loading notification count:', error);
      }
    };

    loadNotificationCount();
  }, [user, loadUserNotifications, setNotificationCount, isAdViewed]);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          onPress: async () => {
            await logout();
            router.replace('/(auth)/sign-in');
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleUpdateProfile = async () => {
    if (!name || !email) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsUpdating(true);
    try {
      const updatedUser = await updateProfile(user?.$id!, { name, email, phone });
      setUser(updatedUser as any);
      setIsModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCountryChange = async (countryId: string) => {
    setSelectedCountry(countryId);
    if (user?.$id) {
      try {
        const updatedUser = await updateProfile(user.$id, { country: countryId });
        setUser(updatedUser as any);
      } catch (error) {
        console.error('Failed to update country in profile:', error);
        Alert.alert('Error', 'Failed to save your region preference.');
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 py-4 flex-row items-center border-b border-gray-100">
        <Text className="text-2xl font-bold text-primary">Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        {/* Country Selection Section */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-primary mb-4">Marketplace Region</Text>
          <View className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
            {COUNTRIES.map((country) => (
              <TouchableOpacity
                key={country.id}
                onPress={() => handleCountryChange(country.id)}
                className={`flex-row items-center p-3 rounded-2xl mb-2 ${
                  selectedCountry === country.id ? 'bg-primary/5 border border-primary/20' : ''
                }`}
              >
                <View className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 items-center justify-center bg-gray-50">
                  <Image
                    source={{ uri: country.flag }}
                    style={{ width: 32, height: 32 }}
                    contentFit="contain"
                  />
                </View>
                <Text className={`flex-1 ml-4 text-base font-semibold ${
                  selectedCountry === country.id ? 'text-primary' : 'text-gray-700'
                }`}>
                  {country.name}
                </Text>
                {selectedCountry === country.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#064229" />
                )}
              </TouchableOpacity>
            ))}
          </View>
          <Text className="text-gray-400 text-xs mt-3 px-2">
            Changing your region will filter the ads shown on the home screen to match your selected country.
          </Text>
        </View>

        {/* Other Settings (Placeholders) */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-primary mb-4">Account</Text>
          <View className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <TouchableOpacity 
              onPress={() => setIsModalVisible(true)}
              className="flex-row items-center p-4 border-b border-gray-50"
            >
              <Ionicons name="person-outline" size={22} color="#666" />
              <Text className="flex-1 ml-4 text-gray-700 font-medium">Edit Profile</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleNotificationsPress}
              className="flex-row items-center p-4"
            >
              <View className="relative">
                <Ionicons name="notifications-outline" size={22} color="#666" />
                {notificationCount > 0 && (
                  <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center">
                    <Text className="text-white text-xs font-bold">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text className="flex-1 ml-4 text-gray-700 font-medium">Notifications</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center justify-center bg-red-50 py-4 rounded-2xl border border-red-100"
        >
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text className="ml-2 text-red-500 font-bold text-base">Logout</Text>
        </TouchableOpacity>

        <Text className="text-center text-gray-400 text-xs mt-8 mb-4">
          Aswaaq Version 1.0.0
        </Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="w-full"
          >
            <View className="bg-white rounded-t-[40px] p-8 pb-12 shadow-xl">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold text-primary">Edit Profile</Text>
                <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View className="space-y-4">
                  <View>
                    <Text className="text-gray-500 font-semibold mb-2 ml-1">Full Name</Text>
                    <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
                      <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter full name"
                        className="text-base text-primary"
                      />
                    </View>
                  </View>

                  <View className="mt-4">
                    <Text className="text-gray-500 font-semibold mb-2 ml-1">Email Address</Text>
                    <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        className="text-base text-primary"
                      />
                    </View>
                  </View>

                  <View className="mt-4">
                    <Text className="text-gray-500 font-semibold mb-2 ml-1">Phone Number</Text>
                    <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
                      <TextInput
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Enter phone number"
                        keyboardType="phone-pad"
                        className="text-base text-primary"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleUpdateProfile}
                    disabled={isUpdating}
                    className={`bg-primary rounded-2xl py-5 mt-8 items-center justify-center ${isUpdating ? 'opacity-70' : ''}`}
                  >
                    <Text className="text-white font-bold text-lg">
                      {isUpdating ? 'Updating...' : 'Save Changes'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}