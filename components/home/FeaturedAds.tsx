import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { GestureResponderEvent, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface Ad {
  $id: string;
  $createdAt: string;
  title: string;
  price: number;
  city: string;
  images: any[];
  featured?: boolean;
}

interface FeaturedAdsProps {
  featuredProducts: Ad[];
  likedAdIds: string[];
  onAdPress: (adId: string) => void;
  onLikePress: (adId: string, e: GestureResponderEvent) => void;
  getFileUrl: (fileId: any) => string | null;
}

const FeaturedAdCard = React.memo(({ item, onPress, onLikePress, isLiked, getFileUrl }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    className="bg-white rounded-xl mr-3 shadow-sm w-48 overflow-hidden"
  >
    <View className="relative">
      {item.images && item.images.length > 0 ? (
        <Image 
          source={{ uri: getFileUrl(item.images[0]) || undefined }} 
          style={{ width: '100%', height: 120 }}
          contentFit="cover"
          cachePolicy="memory-disk"
          placeholder="blur"
          transition={200}
        />
      ) : (
        <View className="w-full h-30 bg-gray-200 items-center justify-center">
          <Ionicons name="image-outline" size={32} color="#666" />
        </View>
      )}
      <TouchableOpacity 
        onPress={onLikePress}
        className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full"
      >
        <Ionicons 
          name={isLiked ? "heart" : "heart-outline"} 
          size={16} 
          color={isLiked ? "#ff4d4d" : "#064229"} 
        />
      </TouchableOpacity>
    </View>
    <View className="p-3">
      <Text className="text-primary font-bold text-base">${item.price}</Text>
      <Text className="text-gray-800 font-semibold mt-1 text-sm" numberOfLines={1}>
        {item.title}
      </Text>
      <View className="flex-row items-center mt-1">
        <Ionicons name="location-outline" size={12} color="#A3D139" />
        <Text className="text-gray-500 text-xs ml-1">{item.city}</Text>
      </View>
    </View>
  </TouchableOpacity>
));

export const FeaturedAds: React.FC<FeaturedAdsProps> = ({
  featuredProducts,
  likedAdIds,
  onAdPress,
  onLikePress,
  getFileUrl
}) => {
  return (
    <View className="mt-8">
      <View className="px-4 flex-row justify-between items-center">
        <Text className="text-xl font-bold text-primary">Fresh Recommendations</Text>
        <TouchableOpacity>
          <Text className="text-primary/60 font-semibold">See all</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-4 px-4"
        contentContainerStyle={{ paddingRight: 32 }}
        decelerationRate="normal"
        directionalLockEnabled={true}
        removeClippedSubviews={true}
        scrollEventThrottle={16}
        disableIntervalMomentum={true}
      >
        {featuredProducts.map((item) => (
          <FeaturedAdCard
            key={item.$id}
            item={item}
            onPress={() => onAdPress(item.$id)}
            onLikePress={(e: GestureResponderEvent) => onLikePress(item.$id, e)}
            isLiked={likedAdIds.includes(item.$id)}
            getFileUrl={getFileUrl}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default FeaturedAds;
