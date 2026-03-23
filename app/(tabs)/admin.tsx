import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { getFileUrl, updateAdFeatured } from '../../lib/appwrite';
import { useAdsStore } from '../../store/ads.store';
import { useAuthStore } from '../../store/auth.store';

const getTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
};

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const { adminAds, fetchAdminAds, updateAdStatus, isLoading } = useAdsStore();
  const [activeTab, setActiveTab] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAds();
  }, [activeTab]);

  const loadAds = async () => {
    // Map tab name to status value in DB
    const status = activeTab.toLowerCase(); 
    await fetchAdminAds(status);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAds();
    setRefreshing(false);
  };

  const handleStatusUpdate = async (adId: string, status: 'approved' | 'rejected') => {
    try {
        await updateAdStatus(adId, status);
    } catch (error) {
        // Error updating status
    }
  };

  const handleFeaturedToggle = async (adId: string, currentFeatured: boolean) => {
    try {
        await updateAdFeatured(adId, !currentFeatured);
        // Refresh the ads to show updated featured status
        await loadAds();
    } catch (error) {
        // Error updating featured status
    }
  };

  const filteredAds = adminAds.filter(ad => 
    ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ad.seller?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F9F7E8]">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="relative">
            {/* Admin Avatar Placeholder or from User Profile */}
            <View className="w-12 h-12 rounded-full border-2 border-white bg-[#064229] items-center justify-center">
               <Text className="text-white font-bold text-lg">
                 {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
               </Text>
            </View>
            <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#A3D139] rounded-full border-2 border-white" />
          </View>
          <View className="ml-3">
            <Text className="text-xl font-bold text-[#064229]">Admin Dashboard</Text>
            <Text className="text-[#064229]/60 text-sm">Hello, {user?.name || 'Admin'}</Text>
          </View>
        </View>
        <TouchableOpacity className="bg-white p-2.5 rounded-full shadow-sm">
          <Ionicons name="filter" size={20} color="#064229" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="px-6 mt-2">
        <View className="bg-white flex-row items-center px-4 py-3 rounded-2xl border border-gray-100 shadow-sm">
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            placeholder="Search ads..."
            placeholderTextColor="#999"
            className="flex-1 ml-3 text-base"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Tabs */}
      <View className="px-6 mt-6">
        <View className="bg-white/50 p-1 rounded-2xl flex-row shadow-sm">
          {['Pending', 'Approved', 'Rejected'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`flex-1 py-3 rounded-xl items-center ${
                  isActive ? 'bg-[#A3D139]' : ''
                }`}
              >
                <Text
                  className={`font-bold ${
                    isActive ? 'text-[#064229]' : 'text-[#064229]/40'
                  }`}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Content */}
      {isLoading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#064229" />
        </View>
      ) : (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20 }}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#064229']} />
            }
        >
            {filteredAds.length === 0 ? (
                <View className="items-center justify-center py-10">
                    <Text className="text-gray-400">No ads found in {activeTab}</Text>
                </View>
            ) : (
                filteredAds.map((ad) => (
                <View
                    key={ad.$id}
                    className={`bg-white rounded-[32px] p-5 mb-6 shadow-sm relative border-l-4 ${
                    ad.status === 'pending' ? 'border-orange-500' : ad.status === 'approved' ? 'border-[#A3D139]' : 'border-red-500'
                    }`}
                >
                    {/* User Info */}
                    <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center">
                        {/* Seller Avatar Placeholder */}
                        <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
                             <Ionicons name="person" size={20} color="#ccc" />
                        </View>
                        <View className="ml-3">
                        <Text className="font-bold text-[#064229]">@{ad.seller?.name || 'Unknown'}</Text>
                        <Text className="text-[10px] font-semibold text-[#064229]/40">
                            {ad.seller?.email || 'Seller'}
                        </Text>
                        </View>
                    </View>
                    <View className="bg-[#F9F7E8] px-2 py-1 rounded-lg">
                        <Text className="text-[10px] text-[#064229]/60 font-medium">{getTimeAgo(ad.$createdAt)}</Text>
                    </View>
                    </View>

                    {/* Ad Content */}
                    <View className="flex-row">
                    {ad.images && ad.images.length > 0 ? (
                        <Image 
                          source={{ uri: getFileUrl(ad.images[0]) || undefined }} 
                          style={{ width: 96, height: 96, borderRadius: 16 }}
                          contentFit="cover"
                          transition={200}
                        />
                    ) : (
                        <View className="w-24 h-24 rounded-2xl bg-gray-200 items-center justify-center">
                             <Ionicons name="image-outline" size={30} color="#999" />
                        </View>
                    )}
                    <View className="flex-1 ml-4">
                        <View className="flex-row justify-between items-start">
                        <Text className="text-lg font-bold text-[#064229] leading-6 flex-1 mr-2" numberOfLines={2}>
                            {ad.title}
                        </Text>
                        </View>
                        <Text className="text-[#064229]/40 text-xs font-medium">
                        {ad.city}, {ad.country}
                        </Text>
                        <Text className="text-2xl font-bold text-[#064229] mt-2">
                        ${ad.price.toFixed(2)}
                        </Text>
                    </View>
                    </View>

                    {/* Action Buttons - Only show for Pending or when changing decision */}
                    <View className="flex-row gap-3 mt-5">
                    {/* Featured Toggle Button */}
                    <TouchableOpacity 
                        onPress={() => handleFeaturedToggle(ad.$id, ad.featured || false)}
                        className={`px-4 py-3.5 rounded-2xl flex-row items-center justify-center ${
                            ad.featured ? 'bg-[#FFD700] border border-[#FFD700]/30' : 'bg-gray-100 border border-gray-200'
                        }`}
                    >
                        <Ionicons 
                            name={ad.featured ? "star" : "star-outline"} 
                            size={18} 
                            color={ad.featured ? "#064229" : "#666"} 
                        />
                        <Text className={`ml-2 font-bold text-sm ${
                            ad.featured ? 'text-[#064229]' : 'text-gray-600'
                        }`}>
                            {ad.featured ? 'Featured' : 'Feature'}
                        </Text>
                    </TouchableOpacity>
                    
                    {activeTab !== 'Rejected' && (
                        <TouchableOpacity 
                            onPress={() => handleStatusUpdate(ad.$id, 'rejected')}
                            className="flex-1 border border-[#064229]/10 py-3.5 rounded-2xl flex-row items-center justify-center"
                        >
                            <Ionicons name="close-outline" size={20} color="#064229" />
                            <Text className="ml-2 font-bold text-[#064229]">Disapprove</Text>
                        </TouchableOpacity>
                    )}
                    {activeTab !== 'Approved' && (
                        <TouchableOpacity 
                            onPress={() => handleStatusUpdate(ad.$id, 'approved')}
                            className="flex-1 bg-[#A3D139] py-3.5 rounded-2xl flex-row items-center justify-center"
                        >
                            <Ionicons name="checkmark-outline" size={20} color="#064229" />
                            <Text className="ml-2 font-bold text-[#064229]">Approve</Text>
                        </TouchableOpacity>
                    )}
                    </View>
                </View>
                ))
            )}
        </ScrollView>
      )}

      {/* Floating Filter Button */}
      <TouchableOpacity
        className="absolute bottom-8 right-6 w-16 h-16 bg-[#064229] rounded-full items-center justify-center shadow-lg"
        style={{ elevation: 5 }}
      >
        <Ionicons name="options" size={30} color="#F9F7E8" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default AdminDashboard;