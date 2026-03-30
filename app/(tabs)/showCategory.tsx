import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar } from '../../components/home/SearchBar';
import { ShowAd } from '../../components/home/ShowAd';
import { useAdsStore } from '../../store/ads.store';
import { useLikedAdsStore } from '../../store/likedads.store';

const { width } = Dimensions.get('window');

const ShowCategory = () => {
  const router = useRouter();
  const { categoryId, categoryName } = useLocalSearchParams();
  const { ads } = useAdsStore();
  const { toggleLike, likedAdIds } = useLikedAdsStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter ads by category, active status and search query
  const categoryAds = ads.filter(ad => {
    // 1. Check status (active or approved)
    const isActive = !ad.status || ad.status === 'active' || ad.status === 'approved';
    if (!isActive) return false;

    // 2. Check search query
    const matchesSearch = searchQuery === '' || 
                         ad.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         ad.description?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    // 3. Check category match
    const targetId = Array.isArray(categoryId) ? categoryId[0] : categoryId;
    
    // Check direct mapped ID
    if (ad.categoryId === targetId) return true;
    
    // Check Appwrite relationship field 'categories'
    const cats = ad.categories;
    if (!cats) return false;

    // Handle different shapes of relationship data
    if (typeof cats === 'string') return cats === targetId;
    if (Array.isArray(cats)) {
        return cats.some((c: any) => (typeof c === 'string' ? c === targetId : c.$id === targetId));
    }
    if (typeof cats === 'object') {
        return cats.$id === targetId;
    }
    
    return false;
  });

  // Sort featured ads first
  const sortedAds = [...categoryAds].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime();
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 py-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#064229" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-primary">{categoryName}</Text>
      </View>

      {/* Search Bar */}
      <View className="mb-4">
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onFilterPress={() => {}} // Not implemented for now
          isFilterActive={false}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        {sortedAds.length > 0 ? (
          <View className="flex-row flex-wrap justify-between">
            {sortedAds.map((item) => (
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
                <Ionicons name="grid-outline" size={40} color="#ccc" />
              </View>
              <Text className="text-gray-500 font-medium text-lg">No ads in this category</Text>
              <Text className="text-gray-400 text-sm mt-1 text-center px-8">
                Be the first to post an ad in {categoryName}!
              </Text>
           </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default ShowCategory;