import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface Category {
  $id: string;
  name: string;
  image?: string;
}

interface CategoriesProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  getCategoryImage: (categoryName: string) => any;
}

export const Categories: React.FC<CategoriesProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  getCategoryImage
}) => {
  const router = useRouter();

  const handleCategoryPress = (category: Category) => {
    router.push({
      pathname: "/(tabs)/showCategory",
      params: { categoryId: category.$id, categoryName: category.name }
    });
  };

  return (
    <View className="mt-6 px-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-primary">Categories</Text>
        <TouchableOpacity>
          <Text className="text-primary/60 font-semibold">See all</Text>
        </TouchableOpacity>
      </View>
      
      {/* Grid Layout */}
      <View className="flex-row flex-wrap justify-between">
        {/* Category Items */}
        {categories.slice(0, 9).map((category) => (
          <TouchableOpacity
            key={category.$id}
            onPress={() => handleCategoryPress(category)}
            className="items-center mb-6"
            style={{ width: (width - 48) / 3 }}
          >
            <View className="w-full aspect-square rounded-2xl overflow-hidden shadow-sm bg-gray-100">
              <Image 
                source={getCategoryImage(category.name)}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
              {selectedCategory === category.$id && (
                <View className="absolute inset-0 bg-primary/30 items-center justify-center">
                  <Ionicons name="checkmark-circle" size={32} color="#F9F7E8" />
                </View>
              )}
            </View>
            <Text 
              className={`mt-2 text-xs font-semibold text-center ${
                selectedCategory === category.$id ? 'text-primary' : 'text-gray-600'
              }`}
              numberOfLines={2}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default Categories;
