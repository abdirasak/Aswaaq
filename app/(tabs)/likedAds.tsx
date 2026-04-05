import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo } from 'react';
import { Dimensions, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShowAd } from '../../components/home/ShowAd';
import { useAdsStore } from '../../store/ads.store';
import { useAuthStore } from '../../store/auth.store';
import { useLikedAdsStore } from '../../store/likedads.store';

const { width } = Dimensions.get('window');

export default function LikedAds() {
  const router = useRouter();
  const { ads, fetchAds } = useAdsStore();
  const { user, selectedCountry } = useAuthStore();
  const { likedAdIds, toggleLike, loadUserLikes, saveUserLikes } = useLikedAdsStore();

  // Load user's liked ads when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadUserLikes(user.$id);
    }
    fetchAds();
  }, [user, loadUserLikes, fetchAds, selectedCountry]);

  // Save liked ads when they change
  useEffect(() => {
    if (user && likedAdIds.length > 0) {
      saveUserLikes(user.$id);
    }
  }, [likedAdIds, user, saveUserLikes]);

  const likedProducts = useMemo(() => {
    return ads.filter(ad => likedAdIds.includes(ad.$id));
  }, [ads, likedAdIds]);

  const handleLikePress = useCallback((id: string) => {
    toggleLike(id);
  }, [toggleLike]);

  const renderItem = ({ item }: { item: any }) => (
    <ShowAd
      item={item}
      isLiked={true}
      onLikePress={handleLikePress}
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 py-4 flex-row items-center justify-between border-b border-gray-100/50">
        <View className="flex-row items-center bg-black/5 rounded-full pl-2 pr-4 py-1.5">
          <View className="shadow-sm bg-white rounded-lg overflow-hidden">
            <Image
              source={require('../../assets/images/aswaaq_logo.jpg')}
              style={{ width: 32, height: 32 }}
              contentFit="cover"
            />
          </View>
          <Text className="ml-2 text-lg font-bold text-primary">Liked Ads</Text>
        </View>
        
        <Link href="/(tabs)/profile" asChild>
          <TouchableOpacity className="w-10 h-10 rounded-full bg-accent-orange/20 items-center justify-center">
            <Ionicons name="person-outline" size={24} color="#FF7D33" />
          </TouchableOpacity>
        </Link>
      </View>

      <FlatList
        data={likedProducts}
        renderItem={renderItem}
        keyExtractor={(item) => item.$id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-20">
            <Ionicons name="heart-dislike-outline" size={48} color="#ccc" />
            <Text className="text-gray-400 mt-4 text-center">No liked ads yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}