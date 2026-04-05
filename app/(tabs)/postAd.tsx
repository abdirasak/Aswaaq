import { useAuthStore } from '@/store/auth.store';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { createAd, getAllCategories } from '../../lib/appwrite'; // Import getAllCategories

export default function PostAd() {
  const router = useRouter();
  const { user, selectedCountry } = useAuthStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category State
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Auto-populated fields
  const userEmail = user?.email || '';
  const userPhone = user?.phone || 'No phone provided';

  // Fetch Categories on Mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getAllCategories();
        setCategories(data);
        if (data.length > 0) {
          // Don't auto-select, keep placeholder
        }
      } catch (error) {
        // Error fetching categories
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 3,
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImages = result.assets.map(asset => asset.uri);
      setImages([...images, ...selectedImages].slice(0, 3));
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handlePostAd = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to post an ad');
      return;
    }

    if (!title || !description || !country || !city || !price || !selectedCategory || images.length === 0) {
      Alert.alert('Error', 'Please fill in all fields including category and images');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createAd({
        title,
        description,
        country,
        city,
        price: parseFloat(price),
        images,
        user_id: user.$id,
        categoryId: selectedCategory // Pass the relationship ID
      });
      
      Alert.alert('Ad Submitted!', 'Your ad has been submitted and is pending approval. It will be visible to others once an admin approves it.', [
        { 
          text: 'OK', 
          onPress: () => {
            // Clear all fields
            setTitle('');
            setDescription('');
            setCity('');
            setPrice('');
            setImages([]);
            // Reset category to first available category instead of empty string
            if (categories.length > 0) {
              setSelectedCategory(categories[0].$id);
            }
            router.replace('/(tabs)');
          }
        }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to post ad');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FDFBF7]">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-4 border-b border-gray-100 bg-white">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#013B28" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-[#013B28]">Post Ad</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          
          {/* Images Section */}
          <View className="px-4 mt-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-[#013B28]">Images</Text>
              <Text className="text-gray-400">{images.length}/3</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-3">
              <TouchableOpacity onPress={pickImage} className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-2xl items-center justify-center bg-gray-50">
                <Ionicons name="camera" size={24} color="#013B28" />
                <Text className="text-[10px] font-bold text-[#013B28] mt-1">Add Photo</Text>
              </TouchableOpacity>

              {images.map((uri, index) => (
                <View key={index} className="w-24 h-24 rounded-2xl relative bg-gray-50 overflow-hidden border border-gray-100">
                  <Image 
                    source={{ uri }} 
                    style={{ width: '100%', height: '100%' }}
                    contentFit="contain"
                  />
                  <TouchableOpacity onPress={() => removeImage(index)} className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 shadow-sm z-10">
                    <Ionicons name="close" size={12} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Form Fields */}
          <View className="px-4 mt-8 space-y-6">
            
            {/* Seller Info (Read-only) */}
            <View className="flex-row gap-x-4 mb-2">
              <View className="flex-1">
                <Text className="text-gray-500 text-xs mb-1 ml-1">Your Email</Text>
                <TextInput value={userEmail} editable={false} className="bg-gray-100 p-3 rounded-xl text-gray-400 border border-gray-200" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-xs mb-1 ml-1">Your Phone</Text>
                <TextInput value={userPhone} editable={false} className="bg-gray-100 p-3 rounded-xl text-gray-400 border border-gray-200" />
              </View>
            </View>

            {/* Category Picker */}
            <View>
              <Text className="text-[#013B28] font-bold mb-2 ml-1">Category</Text>
              <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {isLoadingCategories ? (
                  <ActivityIndicator size="small" color="#013B28" className="py-4" />
                ) : (
                  <Picker
                    selectedValue={selectedCategory}
                    onValueChange={(itemValue) => setSelectedCategory(itemValue)}
                    style={{ height: 55 }}
                  >
                    <Picker.Item label="Please select category" value="" enabled={false} />
                    {categories.map((cat) => (
                      <Picker.Item key={cat.$id} label={cat.name} value={cat.$id} />
                    ))}
                  </Picker>
                )}
              </View>
            </View>

            {/* Title */}
            <View>
              <Text className="text-[#013B28] font-bold mb-2 ml-1">Title</Text>
              <View className="bg-white rounded-2xl border border-gray-100 px-4 shadow-sm">
                <TextInput placeholder="Enter ad title (e.g., iPhone 15 Pro Max)" value={title} onChangeText={setTitle} className="py-4 text-[#013B28]" />
              </View>
            </View>

            {/* Location Group */}
            <View className="flex-row gap-x-4">
              <View className="flex-1">
                <Text className="text-[#013B28] font-bold mb-2 ml-1">Country</Text>
                <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <Picker selectedValue={country} onValueChange={(v) => setCountry(v)} style={{ height: 55 }}>
                    <Picker.Item label="Please select country" value="" enabled={false} />
                    <Picker.Item label="Kenya" value="kenya" />
                    <Picker.Item label="Egypt" value="egypt" />
                  </Picker>
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-[#013B28] font-bold mb-2 ml-1">City</Text>
                <View className="bg-white rounded-2xl border border-gray-100 px-4 shadow-sm">
                  <TextInput placeholder="Enter city name (e.g., Nairobi)" value={city} onChangeText={setCity} className="py-4 text-[#013B28]" />
                </View>
              </View>
            </View>

            {/* Description */}
            <View>
              <Text className="text-[#013B28] font-bold mb-2 ml-1">Description</Text>
              <View className="bg-white rounded-2xl border border-gray-100 px-4 shadow-sm">
                <TextInput placeholder="Provide detailed description of your item including condition, features, and any other relevant information..." value={description} onChangeText={setDescription} multiline className="py-4 text-[#013B28] h-32" textAlignVertical="top" />
              </View>
            </View>

            {/* Price */}
            <View>
              <Text className="text-[#013B28] font-bold mb-2 ml-1">Price ($)</Text>
              <View className="bg-white rounded-2xl border border-gray-100 px-4 shadow-sm flex-row items-center">
                <Text className="text-gray-400 mr-2 font-bold">$</Text>
                <TextInput placeholder="Enter price (e.g., 299.99)" value={price} onChangeText={setPrice} keyboardType="numeric" className="flex-1 py-4 text-[#013B28]" />
              </View>
            </View>

             {/* Post Button */}
            <View className="p-4 bg-[#FDFBF7] border-t border-gray-100">
              <TouchableOpacity 
                onPress={handlePostAd} 
                disabled={isSubmitting || isLoadingCategories}
                className={`bg-[#013B28] py-4 rounded-2xl flex-row justify-center items-center ${isSubmitting ? 'opacity-70' : ''}`}
              >
                {isSubmitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Post Ad Now</Text>}
              </TouchableOpacity>
        </View>
          </View>
        </ScrollView>

       
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}