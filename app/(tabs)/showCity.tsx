import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShowAd } from '../../components/home/ShowAd';
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
              <ShowAd
                key={item.$id}
                item={item}
                isLiked={likedAdIds.includes(item.$id)}
                onLikePress={() => toggleLike(item.$id)}
              />
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
