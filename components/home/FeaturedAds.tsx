import React from 'react';
import { GestureResponderEvent, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ShowAd } from './ShowAd';

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
          <View key={item.$id} className="mr-3">
            <ShowAd
              item={item}
              onLikePress={(e: GestureResponderEvent) => onLikePress(item.$id, e)}
              isLiked={likedAdIds.includes(item.$id)}
              width={192}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default FeaturedAds;
