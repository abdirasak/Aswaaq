import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onFilterPress: () => void;
  isFilterActive: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onFilterPress,
  isFilterActive
}) => {
  return (
    <View className="px-4 flex-row items-center gap-3">
      <View className="flex-1 flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm">
        <Ionicons name="search-outline" size={20} color="#666" />
        <TextInput
          placeholder="Search ads..."
          className="ml-2 flex-1 text-base"
          value={searchQuery}
          onChangeText={onSearchChange}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Ionicons name="close-circle" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity 
        onPress={onFilterPress}
        className={`p-3 rounded-2xl shadow-sm ${isFilterActive ? 'bg-primary' : 'bg-white'}`}
      >
        <Ionicons 
          name="options-outline" 
          size={24} 
          color={isFilterActive ? '#F9F7E8' : '#064229'} 
        />
      </TouchableOpacity>
    </View>
  );
};

export default SearchBar;
