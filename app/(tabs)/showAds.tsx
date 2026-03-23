import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Linking,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAdById, getFileUrl, getUserProfile } from '../../lib/appwrite';
import { useAdsStore } from '../../store/ads.store';
import { useLikedAdsStore } from '../../store/likedads.store';
import { Ad } from '../../types';

const { width } = Dimensions.get('window');

export default function ShowAds() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { ads } = useAdsStore();
  const { likedAdIds, toggleLike } = useLikedAdsStore();
  const [ad, setAd] = useState<Ad | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [similarAds, setSimilarAds] = useState<Ad[]>([]);

  const isLiked = ad ? likedAdIds.includes(ad.$id) : false;

  useEffect(() => {
    const fetchAdDetails = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const data = await getAdById(id as string);
        let adData = { ...data } as unknown as Ad;
        
        if (typeof adData.seller === 'string') {
            const sellerProfile = await getUserProfile(adData.seller);
            if (sellerProfile) adData.seller = sellerProfile;
        }

        setAd(adData);
      } catch (error) {
        // Error fetching ad
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdDetails();
  }, [id]);

  useEffect(() => {
    if (ad && ads.length > 0) {
      const similar = ads
        .filter(item => 
          item.categoryId === ad.categoryId && 
          item.$id !== ad.$id &&
          (item.status === 'active' || item.status === 'approved' || !item.status)
        )
        .sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
        .slice(0, 3);
      
      setSimilarAds(similar);
    }
  }, [ad, ads]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    if (slide !== activeImage) setActiveImage(slide);
  };

  const handleCallSeller = () => {
    if (ad?.seller?.phone) {
      Linking.openURL(`tel:${ad.seller.phone}`);
    } else {
      Alert.alert('Info', 'No phone number available for this seller.');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#FDFBF7] items-center justify-center">
        <ActivityIndicator size="large" color="#064229" />
      </SafeAreaView>
    );
  }

  if (!ad) {
    return (
      <SafeAreaView className="flex-1 bg-[#FDFBF7] items-center justify-center">
        <Text>Ad not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-bold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FDFBF7]">
      {/* Custom Header */}
      <View className="px-4 py-2 flex-row items-center justify-between z-20">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/90 items-center justify-center shadow-md"
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View className="flex-row gap-3">
          <TouchableOpacity className="w-10 h-10 rounded-full bg-white/90 items-center justify-center shadow-md">
            <Ionicons name="share-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => ad && toggleLike(ad.$id)}
            className="w-10 h-10 rounded-full bg-white/90 items-center justify-center shadow-md"
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={24}
              color={isLiked ? "#ff4d4d" : "#000"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Image Slider */}
        <View className="relative">
          {ad.images && ad.images.length > 0 ? (
            <>
              <ScrollView 
                horizontal 
                pagingEnabled 
                onScroll={handleScroll}
                scrollEventThrottle={16}
                showsHorizontalScrollIndicator={false}
              >
{ad.images.map((img, index) => {
  const uri = getFileUrl(img);

  return (
    <View key={`${ad.$id}-${index}`} style={{ width, height: 400, backgroundColor: '#eee' }}>
      <Image
        source={typeof uri === 'string' ? uri : (uri as any)?.toString()} 
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        transition={300}
      />
    </View>
  );
})}
              </ScrollView>
              
              {/* Image Dots */}
              <View className="absolute bottom-6 w-full flex-row justify-center gap-2">
                {ad.images.map((_, index) => (
                  <View 
                    key={index} 
                    className={`h-2 rounded-full ${index === activeImage ? 'w-6 bg-[#064229]' : 'w-2 bg-white/60'}`} 
                  />
                ))}
              </View>
            </>
          ) : (
            <View className="h-80 bg-gray-200 items-center justify-center">
              <Ionicons name="image-outline" size={64} color="#666" />
              <Text className="text-gray-500 mt-2">No images available</Text>
            </View>
          )}
        </View>

        <View className="px-4 py-6">
          {/* Title & Price */}
          <View className="flex-row justify-between items-start">
            <View className="flex-1 mr-4">
              <Text className="text-3xl font-bold text-[#064229] leading-tight">
                {ad.title}
              </Text>
            </View>
            <Text className="text-2xl font-bold text-[#064229]">${ad.price}</Text>
          </View>

          {/* Metadata */}
          <View className="flex-row items-center mt-3">
            <Ionicons name="location" size={18} color="#064229" />
            <Text className="ml-1 text-gray-500 font-medium">
              {ad.city}, {ad.country} • {new Date(ad.$createdAt).toLocaleDateString()}
            </Text>
          </View>

          {/* Seller Card */}
          <View className="bg-white rounded-3xl p-5 mt-8 shadow-sm border border-gray-100">
            <View className="flex-row items-center">
              <View className="w-14 h-14 rounded-full bg-[#064229]/10 items-center justify-center">
                <Ionicons name="person" size={28} color="#064229" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-lg font-bold text-[#064229]">
                  {ad.seller?.name || 'Verified Seller'}
                </Text>
                <Text className="text-gray-500 text-sm">{ad.seller?.email || 'Contact for email'}</Text>
              </View>
            </View>

            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity 
                onPress={handleCallSeller}
                className="flex-1 bg-[#064229] flex-row items-center justify-center py-4 rounded-2xl"
              >
                <Ionicons name="call" size={20} color="#fff" />
                <Text className="ml-2 text-white font-bold">Call</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-[#C1D94C] flex-row items-center justify-center py-4 rounded-2xl">
                <Ionicons name="chatbubble-ellipses" size={20} color="#064229" />
                <Text className="ml-2 text-[#064229] font-bold">Message</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View className="mt-8">
            <Text className="text-xl font-bold text-[#064229] mb-3">Description</Text>
            <Text className="text-gray-600 leading-6 text-base">
              {ad.description}
            </Text>
          </View>

          {/* Similar Ads */}
          {similarAds.length > 0 && (
            <View className="mt-8">
              <Text className="text-xl font-bold text-[#064229] mb-4">Similar Ads</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
              >
                {similarAds.map((item) => (
                  <TouchableOpacity
                    key={item.$id}
                    onPress={() => router.push({
                      pathname: "/(tabs)/showAds",
                      params: { id: item.$id }
                    })}
                    className="bg-white rounded-2xl mr-3 shadow-sm overflow-hidden"
                    style={{ width: 200 }}
                  >
                    <View className="relative">
                      {item.images && item.images.length > 0 ? (
                        <Image
                          source={{ uri: getFileUrl(item.images[0]) || undefined }}
                          style={{ width: '100%', height: 140 }}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                          transition={200}
                        />
                      ) : (
                        <View className="w-full h-35 bg-gray-200 items-center justify-center">
                          <Ionicons name="image-outline" size={32} color="#666" />
                        </View>
                      )}
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleLike(item.$id);
                        }}
                        className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full"
                      >
                        <Ionicons
                          name={likedAdIds.includes(item.$id) ? "heart" : "heart-outline"}
                          size={16}
                          color={likedAdIds.includes(item.$id) ? "#ff4d4d" : "#064229"}
                        />
                      </TouchableOpacity>
                    </View>
                    <View className="p-3">
                      <Text className="text-primary font-bold text-lg">${item.price}</Text>
                      <Text className="text-gray-800 font-semibold mt-1 text-sm" numberOfLines={2}>
                        {item.title}
                      </Text>
                      <View className="flex-row items-center mt-2">
                        <Ionicons name="location-outline" size={12} color="#A3D139" />
                        <Text className="text-gray-500 text-xs ml-1">{item.city}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}