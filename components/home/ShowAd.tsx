import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, GestureResponderEvent, Text, TouchableOpacity, View } from 'react-native';
import { getFileUrl } from '../../lib/appwrite';

const { width: screenWidth } = Dimensions.get('window');

interface Ad {
  $id: string;
  $createdAt: string;
  title: string;
  price: number;
  city: string;
  images: any[];
  featured?: boolean;
  status?: string;
}

interface ShowAdProps {
  item: Ad;
  isLiked?: boolean;
  onLikePress?: (e: GestureResponderEvent) => void;
  width?: number;
  height?: number;
  showLocation?: boolean;
}

export const ShowAd: React.FC<ShowAdProps> = ({ 
  item, 
  isLiked = false, 
  onLikePress, 
  width = (screenWidth - 48) / 2,
  height = 150,
  showLocation = true
}) => {
  const router = useRouter();
  const uri = item.images && item.images.length > 0 ? getFileUrl(item.images[0]) : null;

  const handlePress = () => {
    router.push({
      pathname: "/(tabs)/showAds",
      params: { id: item.$id }
    });
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="bg-white rounded-2xl mb-4 overflow-hidden shadow-sm"
      style={{ width }}
    >
      <View className="relative bg-gray-50">
        {item.images && item.images.length > 0 ? (
          <Image 
            source={{ uri: uri || undefined }} 
            style={{ width: '100%', height }}
            contentFit="contain"
            transition={200}
            cachePolicy="memory-disk"
            placeholder="blur"
          />
        ) : (
          <View className="w-full bg-gray-200 items-center justify-center" style={{ height }}>
            <Ionicons name="image-outline" size={32} color="#666" />
          </View>
        )}
        
        {item.featured && (
          <View className="absolute top-2 left-2 bg-primary px-2 py-0.5 rounded-md">
            <Text className="text-white text-[10px] font-bold">Featured</Text>
          </View>
        )}

        {onLikePress && (
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              onLikePress(e);
            }}
            className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full"
          >
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={16} 
              color={isLiked ? "#ff4d4d" : "#064229"} 
            />
          </TouchableOpacity>
        )}
      </View>

      <View className="p-3">
        <Text className="text-primary font-bold text-base">${item.price}</Text>
        <Text className="text-gray-800 font-semibold mt-1 text-xs" numberOfLines={1}>
          {item.title}
        </Text>
        
        {showLocation && (
          <View className="flex-row items-center mt-2">
            <Ionicons name="location-outline" size={12} color="#A3D139" />
            <Text className="text-gray-500 text-[10px] ml-1">{item.city}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ShowAd;
