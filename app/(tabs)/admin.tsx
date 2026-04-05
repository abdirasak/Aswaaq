import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { getFileUrl, updateAdFeatured } from '../../lib/appwrite';

import { useAdsStore } from '../../store/ads.store';
import { useAuthStore } from '../../store/auth.store';
import { useReportsStore } from '../../store/reports.store';

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
  const router = useRouter();
  const { user } = useAuthStore();
  const { adminAds, fetchAdminAds, updateAdStatus, isLoading } = useAdsStore();
  const { reportsCount, fetchReportsCount } = useReportsStore();
  const [activeTab, setActiveTab] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAd, setSelectedAd] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    loadAds();
  }, [activeTab]);

  const loadAds = async () => {
    // Map tab name to status value in DB
    const status = activeTab.toLowerCase(); 
    await Promise.all([fetchAdminAds(status), fetchReportsCount()]);
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

  const openAdDetails = (ad: any) => {
    setSelectedAd(ad);
    setIsModalVisible(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9F7E8]">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center">
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
      </View>

      {/* Reports Notifications */}
      <View className="px-6 mt-2">
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/reports')}
          activeOpacity={0.8}
          className="bg-white rounded-2xl px-4 py-3 flex-row items-center justify-between border border-red-100 shadow-sm"
        >
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center">
              <Ionicons name="notifications-outline" size={20} color="#dc2626" />
            </View>
            <View className="ml-3">
              <Text className="text-[#064229] font-bold">Reports</Text>
              <Text className="text-[#064229]/50 text-xs">Review reported ads</Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <View className="min-w-[28px] px-2 py-1 rounded-full bg-red-600 items-center justify-center">
              <Text className="text-white text-xs font-bold">{reportsCount}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#064229" />
          </View>
        </TouchableOpacity>
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
                <TouchableOpacity
                    key={ad.$id}
                    onPress={() => openAdDetails(ad)}
                    activeOpacity={0.7}
                    className={`bg-white rounded-[32px] p-5 mb-6 shadow-sm relative border-l-4 ${
                    ad.isSafe === false ? 'border-red-600 border-2' : 
                    ad.status === 'pending' ? 'border-orange-500' : 
                    ad.status === 'approved' ? 'border-[#A3D139]' : 'border-red-500'
                    }`}
                >
                    {/* Safety Badge */}
                    {ad.isSafe === false && (
                        <View className="absolute top-4 right-4 bg-red-100 px-3 py-1 rounded-full flex-row items-center border border-red-200 z-10">
                            <Ionicons name="warning" size={12} color="#dc2626" />
                            <Text className="text-red-600 text-[10px] font-bold ml-1">UNSAFE CONTENT</Text>
                        </View>
                    )}

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
                        <View className="bg-gray-50 rounded-2xl overflow-hidden">
                          <Image 
                            source={{ uri: getFileUrl(ad.images[0]) || undefined }} 
                            style={{ width: 96, height: 96 }}
                            contentFit="contain"
                            transition={200}
                          />
                        </View>
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
                    <View className="flex-row gap-2 mt-5">
                    {/* Featured Toggle Button */}
                    <TouchableOpacity 
                        onPress={() => handleFeaturedToggle(ad.$id, ad.featured || false)}
                        className={`px-3 py-3.5 rounded-2xl flex-row items-center justify-center min-w-[100px] ${
                            ad.featured ? 'bg-[#FFD700] border border-[#FFD700]/30' : 'bg-gray-100 border border-gray-200'
                        }`}
                    >
                        <Ionicons 
                            name={ad.featured ? "star" : "star-outline"} 
                            size={16} 
                            color={ad.featured ? "#064229" : "#666"} 
                        />
                        <Text className={`ml-1.5 font-bold text-xs ${
                            ad.featured ? 'text-[#064229]' : 'text-gray-600'
                        }`}>
                            {ad.featured ? 'Featured' : 'Feature'}
                        </Text>
                    </TouchableOpacity>
                    
                    {activeTab !== 'Rejected' && (
                        <TouchableOpacity 
                            onPress={() => handleStatusUpdate(ad.$id, 'rejected')}
                            className="flex-1 border border-[#064229]/10 py-3.5 rounded-2xl flex-row items-center justify-center min-w-[100px]"
                        >
                            <Ionicons name="close-outline" size={18} color="#064229" />
                            <Text className="ml-2 font-bold text-sm text-[#064229]">Disapprove</Text>
                        </TouchableOpacity>
                    )}
                    {activeTab !== 'Approved' && (
                        <TouchableOpacity 
                            onPress={() => handleStatusUpdate(ad.$id, 'approved')}
                            className="flex-1 bg-[#A3D139] py-3.5 rounded-2xl flex-row items-center justify-center min-w-[100px] mr-2"
                        >
                            <Ionicons name="checkmark-outline" size={18} color="#064229" />
                            <Text className="ml-2 font-bold text-sm text-[#064229]">Approve</Text>
                        </TouchableOpacity>
                    )}
                    </View>
                </TouchableOpacity>
                ))
            )}
        </ScrollView>
      )}

      {/* Ad Details Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
          <View className="flex-1 bg-black/50 justify-end">
            <TouchableWithoutFeedback>
              <View className="bg-white rounded-t-[40px] p-6 h-[85%]">
                <View className="w-12 h-1.5 bg-gray-200 rounded-full self-center mb-6" />
                
                <View className="flex-row justify-between items-start mb-6">
                  <View className="flex-1 mr-4">
                    <Text className="text-2xl font-bold text-[#064229] mb-1">{selectedAd?.title}</Text>
                    <Text className="text-[#064229]/60 text-sm">
                      <Ionicons name="location-outline" size={14} color="#064229" /> {selectedAd?.city}, {selectedAd?.country}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setIsModalVisible(false)}
                    className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
                  >
                    <Ionicons name="close" size={24} color="#064229" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Images */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                    {selectedAd?.images?.map((img: any, index: number) => (
                      <View key={index} className="mr-4 bg-gray-100 rounded-3xl overflow-hidden border border-gray-100">
                        <Image 
                          source={{ uri: getFileUrl(img) || undefined }} 
                          style={{ width: 280, height: 200 }}
                          contentFit="cover"
                        />
                      </View>
                    ))}
                  </ScrollView>

                  {/* Price & Status */}
                  <View className="flex-row justify-between items-center mb-6 bg-[#F9F7E8] p-5 rounded-3xl">
                    <View>
                      <Text className="text-[#064229]/60 text-xs font-bold uppercase tracking-wider mb-1">Price</Text>
                      <Text className="text-3xl font-bold text-[#064229]">${selectedAd?.price?.toFixed(2)}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-[#064229]/60 text-xs font-bold uppercase tracking-wider mb-1">Status</Text>
                      <View className={`px-4 py-1.5 rounded-full ${
                        selectedAd?.status === 'approved' ? 'bg-[#A3D139]/20' : 
                        selectedAd?.status === 'rejected' ? 'bg-red-100' : 'bg-orange-100'
                      }`}>
                        <Text className={`font-bold text-xs uppercase ${
                          selectedAd?.status === 'approved' ? 'text-[#064229]' : 
                          selectedAd?.status === 'rejected' ? 'text-red-600' : 'text-orange-600'
                        }`}>{selectedAd?.status}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Safety Warning */}
                  {selectedAd?.isSafe === false && (
                    <View className="bg-red-50 border border-red-100 p-5 rounded-3xl mb-6">
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="warning" size={20} color="#dc2626" />
                        <Text className="text-red-700 font-bold ml-2">Safety Flag Triggered</Text>
                      </View>
                      <Text className="text-red-700 font-semibold text-sm mb-1">
                        Reason: {selectedAd?.safetyReason || 'Automated filter match'}
                      </Text>
                      <Text className="text-red-600/80 text-xs leading-5">
                        This ad contains terms that triggered our automated safety filters. Please review the title and description carefully before approving.
                      </Text>
                    </View>
                  )}

                  {/* Description */}
                  <View className="mb-6">
                    <Text className="text-lg font-bold text-[#064229] mb-3">Description</Text>
                    <Text className="text-[#064229]/70 text-base leading-6">
                      {selectedAd?.description}
                    </Text>
                  </View>

                  {/* Seller Info */}
                  <View className="bg-gray-50 p-5 rounded-3xl mb-10 border border-gray-100">
                    <Text className="text-sm font-bold text-[#064229]/40 uppercase tracking-widest mb-4">Seller Information</Text>
                    <View className="flex-row items-center">
                      <View className="w-14 h-14 rounded-full bg-white items-center justify-center shadow-sm border border-gray-100">
                        <Ionicons name="person" size={28} color="#A3D139" />
                      </View>
                      <View className="ml-4">
                        <Text className="text-lg font-bold text-[#064229]">{selectedAd?.seller?.name}</Text>
                        <Text className="text-[#064229]/50">{selectedAd?.seller?.email}</Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>

                {/* Footer Actions */}
                <View className="flex-row gap-3 pt-4 border-t border-gray-100">
                  <TouchableOpacity 
                    onPress={() => {
                      handleStatusUpdate(selectedAd.$id, 'rejected');
                      setIsModalVisible(false);
                    }}
                    className="flex-1 border-2 border-red-500/20 py-4 rounded-2xl flex-row items-center justify-center"
                  >
                    <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
                    <Text className="ml-2 font-bold text-red-600">Disapprove</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => {
                      handleStatusUpdate(selectedAd.$id, 'approved');
                      setIsModalVisible(false);
                    }}
                    className="flex-1 bg-[#A3D139] py-4 rounded-2xl flex-row items-center justify-center shadow-sm"
                  >
                    <Ionicons name="checkmark-circle-outline" size={20} color="#064229" />
                    <Text className="ml-2 font-bold text-[#064229]">Approve Ad</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default AdminDashboard;