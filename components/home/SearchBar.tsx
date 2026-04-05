import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onFilterPress: () => void;
  isFilterActive: boolean;
}

export const SearchBar = React.memo(({
  searchQuery,
  onSearchChange,
  onFilterPress,
  isFilterActive
}: SearchBarProps) => {
  return (
    <View className="px-4">
      <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm">
        <Ionicons name="search-outline" size={20} color="#666" />
        <TextInput
          placeholder="Search ads..."
          className="ml-2 flex-1 text-base"
          value={searchQuery}
          onChangeText={onSearchChange}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')} className="mr-2">
            <Ionicons name="close-circle" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onFilterPress} className="p-2 rounded-full bg-primary">
          <Ionicons 
            name="options-outline" 
            size={20} 
            color="#F9F7E8" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default SearchBar;
