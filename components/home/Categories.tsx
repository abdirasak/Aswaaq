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

export const Categories = React.memo(({
  categories,
  selectedCategory,
  onCategorySelect,
  getCategoryImage
}: CategoriesProps) => {
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
      
      {/* Grid Layout wrapped in a shadow box */}
      <View className="bg-white rounded-3xl p-4 shadow-md shadow-gray-200 border border-gray-100">
        <View className="flex-row flex-wrap justify-between">
          {/* Category Items */}
          {categories.slice(0, 9).map((category) => (
            <TouchableOpacity
              key={category.$id}
              onPress={() => handleCategoryPress(category)}
              className="items-center mb-6"
              style={{ width: (width - 80) / 3 }}
            >
              <View className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-50">
                <Image 
                  source={getCategoryImage(category.name)}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  placeholder="#f0f0f0"
                  transition={200}
                  cachePolicy="memory-disk"
                  recyclingKey={category.$id}
                />
                {selectedCategory === category.$id && (
                  <View className="absolute inset-0 bg-primary/30 items-center justify-center">
                    <Ionicons name="checkmark-circle" size={32} color="#F9F7E8" />
                  </View>
                )}
              </View>
              <Text 
                className={`mt-2 text-[10px] font-bold text-center ${
                  selectedCategory === category.$id ? 'text-primary' : 'text-gray-700'
                }`}
                numberOfLines={2}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
});

export default Categories;
