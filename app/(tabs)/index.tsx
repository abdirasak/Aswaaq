import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  GestureResponderEvent,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Categories } from '../../components/home/Categories';
import { Cities } from '../../components/home/Cities';
import { FeaturedAds } from '../../components/home/FeaturedAds';
import { SearchBar } from '../../components/home/SearchBar';
import { ShowAd } from '../../components/home/ShowAd';
import { getFileUrl } from '../../lib/appwrite';
import { useAdsStore } from '../../store/ads.store';
import { useAuthStore } from '../../store/auth.store';
import { useLikedAdsStore } from '../../store/likedads.store';

// Memoized Recent Ad Card Component  

const { width } = Dimensions.get('window');

const categoryImages: { [key: string]: any } = {
  'Electronics': require('../../assets/images/Electronics.jpg'),
  'Home Appliances': require('../../assets/images/Home Aplainces.jpg'),
  'House Appliances': require('../../assets/images/Home Aplainces.jpg'), // User reported missing
  'House Apliances': require('../../assets/images/Home Aplainces.jpg'), // User spelling
  'House Aplainces': require('../../assets/images/Home Aplainces.jpg'), // Typo match
  'Household Appliances': require('../../assets/images/Home Aplainces.jpg'),
  'Household Appliance': require('../../assets/images/Home Aplainces.jpg'),
  'Appliances': require('../../assets/images/Home Aplainces.jpg'),
  'Appliance': require('../../assets/images/Home Aplainces.jpg'),
  'Home Appliance': require('../../assets/images/Home Aplainces.jpg'), // Singular
  'Home Aplainces': require('../../assets/images/Home Aplainces.jpg'), // Typo match
  'Home Aplience': require('../../assets/images/Home Aplainces.jpg'), // Another potential typo
  'House For Sale': require('../../assets/images/House For Sale.jpg'),
  'Property for Sale': require('../../assets/images/House For Sale.jpg'), // User requested
  'House for rent': require('../../assets/images/House for rent.jpg'),
  'Property for Rent': require('../../assets/images/House for rent.jpg'), // User requested
  'Real Estate': require('../../assets/images/House For Sale.jpg'),
  'Fashion': require('../../assets/images/clothes.jpg'),
  'Clothes': require('../../assets/images/clothes.jpg'),
  'Furniture': require('../../assets/images/furniture.jpg'),
  'Jobs': require('../../assets/images/jobs.png'),
  'Services': require('../../assets/images/services.jpg'),
  'Vehicles': require('../../assets/images/vehicles.jpg'),
  'Vehicle': require('../../assets/images/vehicles.jpg'), // Singular
  'Cars': require('../../assets/images/vehicles.jpg'),
};

const getCategoryImage = (name: string) => {
  if (!name) return { uri: 'https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=400' };
  const cleanName = name.trim();

  // Try exact match
  if (categoryImages[cleanName]) return categoryImages[cleanName];
  
  // Try case-insensitive match
  const key = Object.keys(categoryImages).find(k => k.toLowerCase() === cleanName.toLowerCase());
  if (key) return categoryImages[key];
  
  // Default fallback
  return { uri: 'https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=400' };
};

const HomeScreen = () => {
  const router = useRouter();
  const { ads, categories, isLoading, fetchAds, fetchCategories } = useAdsStore();
  const { selectedCountry, user } = useAuthStore();
  const { likedAdIds, toggleLike, setLikedAds, loadUserLikes, saveUserLikes } = useLikedAdsStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('All');
  
  // Advanced Search State
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const isFilterActive = sortBy !== 'newest' || minPrice !== '' || maxPrice !== '';

  // Load user-specific liked ads when user logs in
  useEffect(() => {
    if (user) {
      loadUserLikes(user.$id);
    } else {
      // Clear current likes when user logs out, but don't delete from storage
      setLikedAds([]);
    }
  }, [user, loadUserLikes, setLikedAds]);

  // Save liked ads when they change (only if user is logged in)
  useEffect(() => {
    if (user && likedAdIds.length > 0) {
      saveUserLikes(user.$id);
    }
  }, [likedAdIds, user, saveUserLikes]);

  // Debounce search query to reduce re-renders
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Calculate city stats dynamically - optimized with better memoization
  const cityStats = useMemo(() => {
    const activeAds = ads.filter(ad => !ad.status || ad.status === 'active' || ad.status === 'approved');
    const stats: { [key: string]: number } = {};
    
    activeAds.forEach(ad => {
       if (ad.city) {
         const city = ad.city.trim();
         stats[city] = (stats[city] || 0) + 1;
       }
    });

    // Expanded color palette for "breadcrumb" feel
    const accentColors = [
        'bg-[#FF7D33]', // Orange
        'bg-[#1FB6FF]', // Blue
        'bg-[#9D50BB]', // Purple
        'bg-[#FF4081]', // Pink
        'bg-[#009688]', // Teal
        'bg-[#673AB7]', // Deep Purple
        'bg-[#FF5722]', // Deep Orange
        'bg-[#4CAF50]', // Green
        'bg-[#E91E63]', // Rose
        'bg-[#3F51B5]', // Indigo
    ];

    return {
      stats: Object.entries(stats).map(([name, count], index) => ({
        name,
        count,
        color: accentColors[index % accentColors.length]
      })).sort((a, b) => b.count - a.count),
      totalCount: activeAds.length
    };
  }, [ads]);

  // Filter ads based on search, category, city, and price - optimized with useMemo
  const filteredAds = useMemo(() => {
    const filtered = ads.filter(ad => {
      // Only show active/approved ads for performance
      const isStatusActive = !ad.status || ad.status === 'active' || ad.status === 'approved';
      const matchesSearch = debouncedSearchQuery === '' || 
                            ad.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || 
                            ad.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || ad.categoryId === selectedCategory;
      const matchesCity = selectedCity === 'All' || ad.city?.trim().toLowerCase() === selectedCity.toLowerCase();
      
      // Price Filter - optimized parsing
      const price = ad.price || 0;
      const minPriceNum = minPrice ? parseFloat(minPrice) : 0;
      const maxPriceNum = maxPrice ? parseFloat(maxPrice) : Infinity;
      const matchesPrice = price >= minPriceNum && price <= maxPriceNum;
      
      return isStatusActive && matchesSearch && matchesCategory && matchesCity && matchesPrice;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        default: return new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime(); // newest
      }
    });
    
    return filtered;
  }, [ads, debouncedSearchQuery, selectedCategory, selectedCity, sortBy, minPrice, maxPrice]);

  // Use filtered data - optimized with useMemo
  const featuredProducts = useMemo(() => {
    const featured = filteredAds.filter(p => p.featured);
    
    // Sort by newest first and return only featured ads
    const sortedFeatured = featured.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());
    
    return sortedFeatured;
  }, [filteredAds]);
  
  const recentProducts = useMemo(() => {
    const recent = filteredAds.slice(0, 20);
    return recent;
  }, [filteredAds]);

  // Optimized callback functions
  const handleAdPress = useCallback((adId: string) => {
    router.push({
      pathname: "/(tabs)/showAds",
      params: { id: adId }
    });
  }, [router]);

  const handleLikePress = useCallback((adId: string, e?: GestureResponderEvent) => {
    e?.stopPropagation();
    // Only allow liking if user is authenticated
    if (user) {
      toggleLike(adId);
    } else {
      // Optionally, you could navigate to login or show a message
      console.log('Please login to like ads');
    }
  }, [toggleLike, user]);

  useEffect(() => {
    fetchAds();
    fetchCategories();
  }, [selectedCountry, fetchAds, fetchCategories]);

  if (isLoading && ads.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#064229" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 140 }}
        removeClippedSubviews={true}
        scrollEventThrottle={16}
        decelerationRate="normal"
        directionalLockEnabled={true}
      >
        {/* Header & Search */}
        <View className="px-4 py-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="shadow-sm bg-white rounded-xl overflow-hidden">
              <Image
                source={require('../../assets/images/aswaaq_logo.jpg')}
                style={{ width: 56, height: 56 }}
                contentFit="cover"
              />
            </View>
            <Text className="ml-2 text-3xl font-bold text-primary tracking-tight">Aswaaq</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/profile')}
            className="w-10 h-10 rounded-full bg-accent-orange/20 items-center justify-center"
          >
             <Ionicons name="person-outline" size={24} color="#FF7D33" />
          </TouchableOpacity>
        </View>

        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onFilterPress={() => setFilterModalVisible(true)}
          isFilterActive={isFilterActive}
        />

        {/* Cities */}
        <Cities
          cityStats={cityStats}
          selectedCity={selectedCity}
          onCitySelect={setSelectedCity}
        />

        {/* Categories */}
        <Categories
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          getCategoryImage={getCategoryImage}
        />

        {/* Featured Ads */}
        <FeaturedAds
          featuredProducts={featuredProducts}
          likedAdIds={likedAdIds}
          onAdPress={handleAdPress}
          onLikePress={handleLikePress}
          getFileUrl={getFileUrl}
        />

        {/* Recently Added */}
        <View className="mt-8 px-4 flex-row justify-between items-center">
          <Text className="text-xl font-bold text-primary">Recently Added</Text>
          <TouchableOpacity>
            <Text className="text-primary/60 font-semibold">See all</Text>
          </TouchableOpacity>
        </View>
        
        {/* Two-Column Grid for Recently Added */}
        <View className="px-4 mt-4 flex-row flex-wrap justify-between">
          {recentProducts.length > 0 ? (
            recentProducts.map((item) => (
              <ShowAd
                key={item.$id}
                item={item}
                onLikePress={(e: GestureResponderEvent) => handleLikePress(item.$id, e)}
                isLiked={likedAdIds.includes(item.$id)}
              />
            ))
          ) : (
            <View className="w-full items-center py-10">
              <Ionicons name="search-outline" size={48} color="#ccc" />
              <Text className="text-gray-400 mt-2">No ads found in {selectedCountry || 'this region'}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isFilterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
          <View className="flex-1 bg-black/50 justify-end">
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="w-full"
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="bg-white rounded-t-3xl p-6 h-[500px]">
                  <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-2xl font-bold text-primary">Filter & Sort</Text>
                    <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                      <Ionicons name="close" size={24} color="#000" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {/* Sort Options */}
                    <View className="mb-6">
                      <Text className="text-lg font-bold text-primary mb-3">Sort By</Text>
                      <View className="flex-row flex-wrap gap-3">
                        <TouchableOpacity 
                          onPress={() => setSortBy('newest')}
                          className={`px-4 py-2 rounded-full border ${sortBy === 'newest' ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                        >
                          <Text className={sortBy === 'newest' ? 'text-white font-semibold' : 'text-gray-600 font-semibold'}>Newest</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => setSortBy('price_asc')}
                          className={`px-4 py-2 rounded-full border ${sortBy === 'price_asc' ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                        >
                          <Text className={sortBy === 'price_asc' ? 'text-white font-semibold' : 'text-gray-600 font-semibold'}>Price: Low to High</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => setSortBy('price_desc')}
                          className={`px-4 py-2 rounded-full border ${sortBy === 'price_desc' ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                        >
                          <Text className={sortBy === 'price_desc' ? 'text-white font-semibold' : 'text-gray-600 font-semibold'}>Price: High to Low</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Price Range */}
                    <View className="mb-8">
                      <Text className="text-lg font-bold text-primary mb-3">Price Range</Text>
                      <View className="flex-row gap-4">
                        <View className="flex-1">
                          <Text className="text-gray-500 mb-1 ml-1 text-xs">Min Price</Text>
                          <View className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 flex-row items-center">
                            <Text className="text-gray-400 mr-1">$</Text>
                            <TextInput 
                              placeholder="0" 
                              value={minPrice} 
                              onChangeText={setMinPrice}
                              keyboardType="numeric"
                              className="flex-1 font-semibold text-primary"
                            />
                          </View>
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-500 mb-1 ml-1 text-xs">Max Price</Text>
                          <View className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 flex-row items-center">
                            <Text className="text-gray-400 mr-1">$</Text>
                            <TextInput 
                              placeholder="Any" 
                              value={maxPrice} 
                              onChangeText={setMaxPrice}
                              keyboardType="numeric"
                              className="flex-1 font-semibold text-primary"
                            />
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Reset Filters */}
                    <TouchableOpacity 
                      onPress={() => {
                        setSortBy('newest');
                        setMinPrice('');
                        setMaxPrice('');
                      }}
                      className="flex-row justify-center items-center mb-4"
                    >
                      <Ionicons name="refresh-outline" size={18} color="#666" />
                      <Text className="text-gray-500 font-semibold ml-2">Reset Filters</Text>
                    </TouchableOpacity>

                    {/* Apply Button */}
                    <TouchableOpacity 
                      onPress={() => setFilterModalVisible(false)}
                      className="bg-primary py-4 rounded-2xl items-center shadow-lg shadow-primary/30 mb-6"
                    >
                      <Text className="text-white font-bold text-lg">Show {filteredAds.length} Results</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({});