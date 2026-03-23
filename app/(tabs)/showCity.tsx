import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFileUrl } from '../../lib/appwrite';
import { useAdsStore } from '../../store/ads.store';
import { useLikedAdsStore } from '../../store/likedads.store';

const { width } = Dimensions.get('window');

const ShowCity = () => {
  const router = useRouter();
  const { city } = useLocalSearchParams();
  const { ads } = useAdsStore();
  const { toggleLike, likedAdIds } = useLikedAdsStore();

  // Filter ads by city and active status
  const cityAds = ads.filter(ad => {
    // 1. Check status (active or approved)
    const isActive = !ad.status || ad.status === 'active' || ad.status === 'approved';
    if (!isActive) return false;

    // 2. Check city match
    if (!city || city === 'All') return true;
    
    return ad.city?.trim().toLowerCase() === (Array.isArray(city) ? city[0] : city).trim().toLowerCase();
  });

  const cityName = Array.isArray(city) ? city[0] : city;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 py-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#064229" />
        </TouchableOpacity>
        <View>
            <Text className="text-2xl font-bold text-primary">{cityName === 'All' ? 'All Cities' : cityName}</Text>
            <Text className="text-gray-500 text-xs">{cityAds.length} listings found</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {cityAds.length > 0 ? (
          <View className="flex-row flex-wrap justify-between">
            {cityAds.map((item) => (
              <TouchableOpacity
                key={item.$id}
                onPress={() => router.push({
                  pathname: "/(tabs)/showAds",
                  params: { id: item.$id }
                })}
                className="bg-white rounded-2xl mb-4 overflow-hidden shadow-sm"
                style={{ width: (width - 48) / 2 }}
              >
                <View className="relative">
                  {item.images && item.images.length > 0 ? (
                    <Image 
                      source={{ uri: getFileUrl(item.images[0]) ?? undefined }} 
                      style={{ width: '100%', height: 128 }}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <View className="w-full h-32 bg-gray-200 items-center justify-center">
                      <Ionicons name="image-outline" size={32} color="#666" />
                    </View>
                  )}
                  {item.isFeatured && (
                    <View className="absolute top-2 left-2 bg-primary px-2 py-0.5 rounded-md">
                      <Text className="text-white text-[10px] font-bold">Featured</Text>
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
                  <Text className="text-primary font-bold text-base">${item.price}</Text>
                  <Text className="text-gray-800 font-semibold mt-1 text-xs" numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="location-outline" size={12} color="#A3D139" />
                    <Text className="text-gray-500 text-[10px] ml-1">{item.city}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
           <View className="items-center justify-center py-20">
              <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="location-outline" size={40} color="#ccc" />
              </View>
              <Text className="text-gray-500 font-medium text-lg">No ads in this city</Text>
              <Text className="text-gray-400 text-sm mt-1 text-center px-8">
                Try searching in another city or be the first to post!
              </Text>
           </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default ShowCity;
