import { getFileUrl } from '@/lib/appwrite';
import { useAdsStore } from '@/store/ads.store';
import { useAuthStore } from '@/store/auth.store';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Profile() {
  const { user, selectedCountry } = useAuthStore();
  const { ads, fetchUserAds } = useAdsStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Active');

  useEffect(() => {
    fetchUserAds();
  }, [fetchUserAds, selectedCountry]);

  const myAds = ads.filter(ad => {
      const sellerId = typeof ad.seller === 'object' ? ad.seller.$id : ad.seller;
      return sellerId === user?.$id;
  });

  const activeAds = myAds.filter(ad => ad.status === 'approved');
  const pendingAds = myAds.filter(ad => ad.status === 'pending');
  const disapprovedAds = myAds.filter(ad => ad.status === 'rejected');

  const getAdsByTab = () => {
      switch(activeTab) {
          case 'Active': return activeAds;
          case 'Pending': return pendingAds;
          case 'Disapproved': return disapprovedAds;
          default: return activeAds;
      }
  };

  const currentAds = getAdsByTab();

  return (
    <SafeAreaView className="flex-1 bg-[#FDFBF7]">
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row justify-between items-center py-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#013B28" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-[#013B28]">Profile</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/settings')}>
            <Ionicons name="settings-outline" size={24} color="#013B28" />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View className="items-center mt-2">
          <View className="w-20 h-20 rounded-full bg-[#013B28]/10 items-center justify-center">
            <Ionicons name="person" size={40} color="#013B28" />
          </View>
          <Text className="text-xl font-bold text-[#013B28] mt-3">{user?.name || 'Ahmed Ali'}</Text>
          <Text className="text-gray-500 text-sm">Member since {user?.registration ? new Date(user.registration).getFullYear() : '2024'}</Text>
        </View>

        {/* Stats */}
        <View className="flex-row justify-between mt-6 bg-white p-4 rounded-2xl shadow-sm">
          <View className="items-center flex-1 border-r border-gray-100">
            <Text className="text-xl font-bold text-[#013B28]">{activeAds.length}</Text>
            <Text className="text-gray-400 text-xs mt-1">ACTIVE</Text>
          </View>
          <View className="items-center flex-1 border-r border-gray-100">
            <Text className="text-xl font-bold text-[#013B28]">{pendingAds.length}</Text>
            <Text className="text-gray-400 text-xs mt-1">PENDING</Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-xl font-bold text-[#013B28]">{disapprovedAds.length}</Text>
            <Text className="text-gray-400 text-xs mt-1">DISAPPROVED</Text>
          </View>
        </View>

        {/* My Ads Section */}
        <View className="mt-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-[#013B28]">My Ads</Text>
            <TouchableOpacity>
              <Text className="text-gray-500">See All</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/postAd')}
            className="bg-[#013B28] flex-row items-center justify-center py-4 rounded-xl mb-6"
          >
            <View className="bg-white rounded-full p-0.5 mr-2">
              <Ionicons name="add" size={16} color="#013B28" />
            </View>
            <Text className="text-white font-bold text-base">Post New Ad</Text>
          </TouchableOpacity>

          {/* Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
            {['Active', 'Pending', 'Disapproved'].map((tab) => (
              <TouchableOpacity 
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full mr-3 ${activeTab === tab ? 'bg-[#013B28]' : 'bg-white border border-gray-200'}`}
              >
                <Text className={`font-medium ${activeTab === tab ? 'text-white' : 'text-gray-600'}`}>
                  {tab} ({
                    tab === 'Active' ? activeAds.length : 
                    tab === 'Pending' ? pendingAds.length : 
                    disapprovedAds.length
                  })
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Ad Items */}
          <View className="gap-4 mb-20">
            {currentAds.length > 0 ? (
              currentAds.map((ad) => (
                <View key={ad.$id} className="bg-white p-3 rounded-2xl flex-row shadow-sm">
                  <Image 
                    source={{ uri: (ad.images && ad.images.length > 0 ? getFileUrl(ad.images[0]) : undefined) ?? 'https://via.placeholder.com/150' }} 
                    style={{ width: 96, height: 96, borderRadius: 12 }}
                    contentFit="cover"
                    transition={200}
                  />
                  <View className="flex-1 ml-3 justify-between">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1 mr-2">
                        <Text className="font-bold text-[#013B28] text-base" numberOfLines={1}>{ad.title}</Text>
                        <Text className="text-gray-500 font-bold mt-1">${ad.price}</Text>
                      </View>
                      <TouchableOpacity>
                        <MaterialIcons name="more-vert" size={20} color="gray" />
                      </TouchableOpacity>
                    </View>
                    <View className="flex-row justify-between items-center mt-2">
                      {activeTab === 'Active' && (
                        <View className="bg-[#E6F4EA] px-2 py-1 rounded-md flex-row items-center">
                          <View className="w-1.5 h-1.5 rounded-full bg-[#34A853] mr-1.5" />
                          <Text className="text-[#34A853] text-xs font-medium">Active</Text>
                        </View>
                      )}
                      {activeTab === 'Pending' && (
                        <View className="bg-[#FFF8E1] px-2 py-1 rounded-md flex-row items-center">
                          <View className="w-1.5 h-1.5 rounded-full bg-[#FFA000] mr-1.5" />
                          <Text className="text-[#FFA000] text-xs font-medium">Pending</Text>
                        </View>
                      )}
                      {activeTab === 'Disapproved' && (
                        <View className="bg-[#FDECEA] px-2 py-1 rounded-md flex-row items-center">
                          <MaterialIcons name="error" size={12} color="#D93025" style={{ marginRight: 4 }} />
                          <Text className="text-[#D93025] text-xs font-medium">Disapproved</Text>
                        </View>
                      )}
                      <Text className="text-gray-400 text-xs">
                        {new Date(ad.$createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View className="items-center py-10">
                <Text className="text-gray-400">No ads found in {activeTab}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}