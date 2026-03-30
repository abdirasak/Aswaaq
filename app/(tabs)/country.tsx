import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updateProfile } from '../../lib/appwrite';
import { useAuthStore } from '../../store/auth.store';

const COUNTRIES = [
  {
    id: 'Egypt',
    name: 'Egypt',
    flag: 'https://flagcdn.com/w320/eg.png',
    subText: 'Local Listings',
  },
  {
    id: 'Kenya',
    name: 'Kenya',
    flag: 'https://flagcdn.com/w320/ke.png',
    subText: 'Local Listings',
  },
];

const CountrySelection = () => {
  const router = useRouter();
  const { user, setUser, setSelectedCountry: setStoreCountry } = useAuthStore();
  const [localCountry, setLocalCountry] = useState('Egypt');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!user?.$id) {
      setStoreCountry(localCountry);
      router.replace('/(tabs)');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedUser = await updateProfile(user.$id, { country: localCountry });
      setUser(updatedUser as any);
      setStoreCountry(localCountry);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to save country preference. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9F7E8]">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40 }}>
        {/* Logo and Brand */}
        <View className="items-center mb-12">
          <View className="shadow-md bg-white rounded-2xl overflow-hidden mb-4">
            <Image
              source={require('../../assets/images/aswaaq_logo.jpg')}
              style={{ width: 80, height: 80 }}
              contentFit="cover"
            />
          </View>
          <Text className="text-[#064229] font-bold tracking-[4px] text-2xl uppercase">Aswaaq</Text>
        </View>

        {/* Title and Description */}
        <View className="items-center mb-10">
          <Text className="text-[#064229] text-4xl font-bold text-center mb-4">
            Choose your country
          </Text>
          <Text className="text-[#555] text-center text-lg leading-6 px-4">
            Select a region to see local listings and offers relevant to you.
          </Text>
        </View>

        {/* Country List */}
        <View className="gap-6 mb-12">
          {COUNTRIES.map((country) => (
            <TouchableOpacity
              key={country.id}
              onPress={() => setLocalCountry(country.id)}
              activeOpacity={0.7}
              className={`bg-white rounded-[32px] p-6 items-center relative shadow-sm border-2 ${
                localCountry === country.id ? 'border-[#A3D139]' : 'border-transparent'
              }`}
            >
              {localCountry === country.id && (
                <View className="absolute top-4 right-4 bg-[#A3D139] rounded-full w-6 h-6 items-center justify-center">
                  <Ionicons name="checkmark" size={16} color="white" />
                </View>
              )}
              
              <View className="w-24 h-24 rounded-full overflow-hidden mb-4 border border-gray-100 items-center justify-center bg-gray-50">
                 <Image 
                    source={{ uri: country.flag }} 
                    style={{ width: 64, height: 64 }}
                    contentFit="contain"
                 />
              </View>

              <Text className="text-[#064229] text-2xl font-bold mb-1">{country.name}</Text>
              <Text className="text-[#888] font-medium">{country.subText}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          onPress={handleContinue}
          activeOpacity={0.8}
          disabled={isSubmitting}
          className={`bg-[#064229] rounded-2xl py-5 flex-row items-center justify-center shadow-lg ${isSubmitting ? 'opacity-70' : ''}`}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="text-white text-xl font-bold mr-2">Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CountrySelection;