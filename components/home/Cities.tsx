import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface CityStats {
  name: string;
  count: number;
  color: string;
}

interface CitiesProps {
  cityStats: {
    stats: CityStats[];
    totalCount: number;
  };
  selectedCity: string;
  onCitySelect: (city: string) => void;
}

export const Cities: React.FC<CitiesProps> = ({
  cityStats,
  selectedCity,
  onCitySelect
}) => {
  return (
    <View className="mt-6">
      <View className="px-4 flex-row items-center justify-between mb-3">
        <Text className="text-lg font-bold text-primary">Browse by City</Text>
        <View className="bg-primary/10 px-3 py-1 rounded-full">
          <Text className="text-primary text-xs font-bold">{cityStats.totalCount} ads</Text>
        </View>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        className="px-4"
        contentContainerStyle={{ paddingRight: 32 }}
      >
        <TouchableOpacity
          onPress={() => onCitySelect('All')}
          className={`mr-3 px-5 py-3 rounded-2xl flex-row items-center shadow-sm ${
            selectedCity === 'All' ? 'bg-primary' : 'bg-white'
          }`}
        >
          <Ionicons 
            name="globe-outline" 
            size={18} 
            color={selectedCity === 'All' ? '#F9F7E8' : '#064229'} 
          />
          <Text className={`ml-2 font-bold ${
            selectedCity === 'All' ? 'text-background' : 'text-primary'
          }`}>
            All Cities
          </Text>
        </TouchableOpacity>

        {cityStats.stats.map((city) => (
          <TouchableOpacity
            key={city.name}
            onPress={() => onCitySelect(city.name)}
            className={`mr-3 px-5 py-3 rounded-2xl shadow-sm ${
              selectedCity === city.name ? city.color : 'bg-white'
            }`}
          >
            <Text className={`font-bold ${
              selectedCity === city.name ? 'text-white' : 'text-primary'
            }`}>
              {city.name}
            </Text>
            <Text className={`text-xs mt-0.5 ${
              selectedCity === city.name ? 'text-white/80' : 'text-primary/60'
            }`}>
              {city.count} {city.count === 1 ? 'ad' : 'ads'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default Cities;
