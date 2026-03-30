import { getFileUrl } from '@/lib/appwrite';
import { useAdsStore } from '@/store/ads.store';
import { useAuthStore } from '@/store/auth.store';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Profile() {
  const { user, selectedCountry } = useAuthStore();
  const { ads, fetchUserAds, updateAd, deleteAd, categories, fetchCategories } = useAdsStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Active');

  // Edit Modal State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchUserAds();
    fetchCategories();
  }, [fetchUserAds, fetchCategories, selectedCountry]);

  const handleEditPress = (ad: any) => {
    setEditingAd(ad);
    setEditTitle(ad.title);
    setEditDescription(ad.description);
    setEditPrice(ad.price.toString());
    setEditCity(ad.city);
    setEditCountry(ad.country || 'kenya');
    
    // Handle category relation
    const categoryId = typeof ad.categories === 'object' ? ad.categories?.$id : ad.categories;
    setEditCategory(categoryId || (categories.length > 0 ? categories[0].$id : ''));
    
    // Handle images: they might be objects or IDs
    const currentImages = ad.images.map((img: any) => typeof img === 'object' ? img.$id : img);
    setEditImages(currentImages);
    
    setIsEditModalVisible(true);
  };

  const pickEditImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 3 - editImages.length,
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImages = result.assets.map(asset => asset.uri);
      setEditImages([...editImages, ...selectedImages].slice(0, 3));
    }
  };

  const removeEditImage = (index: number) => {
    setEditImages(editImages.filter((_, i) => i !== index));
  };

  const handleUpdateAd = async () => {
    if (!editTitle || !editDescription || !editPrice || !editCity || editImages.length === 0) {
      Alert.alert('Error', 'Please fill in all fields and add at least one image');
      return;
    }

    setIsUpdating(true);
    try {
      await updateAd(editingAd.$id, {
        title: editTitle,
        description: editDescription,
        price: parseFloat(editPrice),
        city: editCity,
        country: editCountry,
        categoryId: editCategory,
        images: editImages,
      });
      
      Alert.alert('Success', 'Ad updated successfully and is now pending approval.');
      setIsEditModalVisible(false);
      fetchUserAds();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update ad');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAd = (adId: string) => {
    Alert.alert(
      'Delete Ad',
      'Are you sure you want to delete this ad? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAd(adId);
              fetchUserAds();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete ad');
            }
          }
        }
      ]
    );
  };

  const myAds = ads.filter(ad => {
      const sellerId = typeof ad.seller === 'object' ? ad.seller.$id : ad.seller;
      return sellerId === user?.$id;
  });

  const activeAds = myAds.filter(ad => ad.status === 'approved');
  const pendingAds = myAds.filter(ad => ad.status === 'pending');
  const disapprovedAds = myAds.filter(ad => ad.status === 'rejected');

  const getAdsByTab = () => {
      switch(activeTab) {
          case 'Active': return activeAds;
          case 'Pending': return pendingAds;
          case 'Disapproved': return disapprovedAds;
          default: return activeAds;
      }
  };

  const currentAds = getAdsByTab();

  return (
    <SafeAreaView className="flex-1 bg-[#FDFBF7]">
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row justify-between items-center py-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#013B28" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-[#013B28]">Profile</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/settings')}>
            <Ionicons name="settings-outline" size={24} color="#013B28" />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View className="items-center mt-2">
          <View className="w-20 h-20 rounded-full bg-[#013B28]/10 items-center justify-center">
            <Ionicons name="person" size={40} color="#013B28" />
          </View>
          <Text className="text-xl font-bold text-[#013B28] mt-3">{user?.name || 'Ahmed Ali'}</Text>
          <Text className="text-gray-500 text-sm">Member since {user?.registration ? new Date(user.registration).getFullYear() : '2024'}</Text>
        </View>

        {/* Stats */}
        <View className="flex-row justify-between mt-6 bg-white p-4 rounded-2xl shadow-sm">
          <View className="items-center flex-1 border-r border-gray-100">
            <Text className="text-xl font-bold text-[#013B28]">{activeAds.length}</Text>
            <Text className="text-gray-400 text-xs mt-1">ACTIVE</Text>
          </View>
          <View className="items-center flex-1 border-r border-gray-100">
            <Text className="text-xl font-bold text-[#013B28]">{pendingAds.length}</Text>
            <Text className="text-gray-400 text-xs mt-1">PENDING</Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-xl font-bold text-[#013B28]">{disapprovedAds.length}</Text>
            <Text className="text-gray-400 text-xs mt-1">DISAPPROVED</Text>
          </View>
        </View>

        {/* My Ads Section */}
        <View className="mt-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-[#013B28]">My Ads</Text>
            <TouchableOpacity>
              <Text className="text-gray-500">See All</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/postAd')}
            className="bg-[#013B28] flex-row items-center justify-center py-4 rounded-xl mb-6"
          >
            <View className="bg-white rounded-full p-0.5 mr-2">
              <Ionicons name="add" size={16} color="#013B28" />
            </View>
            <Text className="text-white font-bold text-base">Post New Ad</Text>
          </TouchableOpacity>

          {/* Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
            {['Active', 'Pending', 'Disapproved'].map((tab) => (
              <TouchableOpacity 
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full mr-3 ${activeTab === tab ? 'bg-[#013B28]' : 'bg-white border border-gray-200'}`}
              >
                <Text className={`font-medium ${activeTab === tab ? 'text-white' : 'text-gray-600'}`}>
                  {tab} ({
                    tab === 'Active' ? activeAds.length : 
                    tab === 'Pending' ? pendingAds.length : 
                    disapprovedAds.length
                  })
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Ad Items */}
          <View className="gap-4 mb-20">
            {currentAds.length > 0 ? (
              currentAds.map((ad) => (
                <View key={ad.$id} className="bg-white p-3 rounded-2xl flex-row shadow-sm">
                  <View className="bg-gray-50 rounded-xl overflow-hidden">
                    <Image 
                      source={{ uri: (ad.images && ad.images.length > 0 ? getFileUrl(ad.images[0]) : undefined) ?? 'https://via.placeholder.com/150' }} 
                      style={{ width: 96, height: 96 }}
                      contentFit="contain"
                      transition={200}
                    />
                  </View>
                  <View className="flex-1 ml-3 justify-between">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1 mr-2">
                        <Text className="font-bold text-[#013B28] text-base" numberOfLines={1}>{ad.title}</Text>
                        <Text className="text-gray-500 font-bold mt-1">${ad.price}</Text>
                      </View>
                      <TouchableOpacity onPress={() => {
                        Alert.alert(
                          'Manage Ad',
                          'What would you like to do?',
                          [
                            { text: 'Edit', onPress: () => handleEditPress(ad) },
                            { text: 'Delete', onPress: () => handleDeleteAd(ad.$id), style: 'destructive' },
                            { text: 'Cancel', style: 'cancel' }
                          ]
                        );
                      }}>
                        <MaterialIcons name="more-vert" size={24} color="#013B28" />
                      </TouchableOpacity>
                    </View>
                    <View className="flex-row justify-between items-center mt-2">
                      {activeTab === 'Active' && (
                        <View className="bg-[#E6F4EA] px-2 py-1 rounded-md flex-row items-center">
                          <View className="w-1.5 h-1.5 rounded-full bg-[#34A853] mr-1.5" />
                          <Text className="text-[#34A853] text-xs font-medium">Active</Text>
                        </View>
                      )}
                      {activeTab === 'Pending' && (
                        <View className="bg-[#FFF8E1] px-2 py-1 rounded-md flex-row items-center">
                          <View className="w-1.5 h-1.5 rounded-full bg-[#FFA000] mr-1.5" />
                          <Text className="text-[#FFA000] text-xs font-medium">Pending</Text>
                        </View>
                      )}
                      {activeTab === 'Disapproved' && (
                        <View className="bg-[#FDECEA] px-2 py-1 rounded-md flex-row items-center">
                          <MaterialIcons name="error" size={12} color="#D93025" style={{ marginRight: 4 }} />
                          <Text className="text-[#D93025] text-xs font-medium">Disapproved</Text>
                        </View>
                      )}
                      <Text className="text-gray-400 text-xs">
                        {new Date(ad.$createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View className="items-center py-10">
                <Text className="text-gray-400">No ads found in {activeTab}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Edit Ad Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-[#FDFBF7]">
          <View className="flex-row justify-between items-center px-4 py-4 border-b border-gray-100 bg-white">
            <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
              <Ionicons name="close" size={24} color="#013B28" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-[#013B28]">Edit Ad</Text>
            <TouchableOpacity onPress={handleUpdateAd} disabled={isUpdating}>
              {isUpdating ? (
                <ActivityIndicator size="small" color="#013B28" />
              ) : (
                <Text className="text-[#013B28] font-bold">Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
              {/* Images Section */}
              <View className="mb-6">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-lg font-bold text-[#013B28]">Images</Text>
                  <Text className="text-gray-400">{editImages.length}/3</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-x-3">
                  {editImages.length < 3 && (
                    <TouchableOpacity 
                      onPress={pickEditImage} 
                      className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-2xl items-center justify-center bg-gray-50"
                    >
                      <Ionicons name="camera" size={24} color="#013B28" />
                      <Text className="text-[10px] font-bold text-[#013B28] mt-1">Add Photo</Text>
                    </TouchableOpacity>
                  )}

                  {editImages.map((img, index) => (
                    <View key={index} className="w-24 h-24 rounded-2xl relative">
                      <Image 
                        source={{ uri: img.startsWith('http') ? img : (img.includes('/') ? img : (getFileUrl(img) ?? undefined)) }} 
                        style={{ width: '100%', height: '100%', borderRadius: 16 }}
                        contentFit="cover"
                      />
                      <TouchableOpacity 
                        onPress={() => removeEditImage(index)} 
                        className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 shadow-sm"
                      >
                        <Ionicons name="close" size={12} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Form Fields */}
              <View className="space-y-4 pb-10">
                <View>
                  <Text className="text-[#013B28] font-bold mb-2 ml-1">Title</Text>
                  <View className="bg-white rounded-2xl border border-gray-100 px-4 shadow-sm">
                    <TextInput 
                      placeholder="Title" 
                      value={editTitle} 
                      onChangeText={setEditTitle} 
                      className="py-4 text-[#013B28]" 
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-[#013B28] font-bold mb-2 ml-1">Category</Text>
                  <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <Picker
                      selectedValue={editCategory}
                      onValueChange={(v) => setEditCategory(v)}
                      style={{ height: 55 }}
                    >
                      {categories.map((cat) => (
                        <Picker.Item key={cat.$id} label={cat.name} value={cat.$id} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View className="flex-row gap-x-4">
                  <View className="flex-1">
                    <Text className="text-[#013B28] font-bold mb-2 ml-1">Country</Text>
                    <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <Picker selectedValue={editCountry} onValueChange={(v) => setEditCountry(v)} style={{ height: 55 }}>
                        <Picker.Item label="Kenya" value="kenya" />
                        <Picker.Item label="Egypt" value="egypt" />
                      </Picker>
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[#013B28] font-bold mb-2 ml-1">City</Text>
                    <View className="bg-white rounded-2xl border border-gray-100 px-4 shadow-sm">
                      <TextInput 
                        placeholder="City" 
                        value={editCity} 
                        onChangeText={setEditCity} 
                        className="py-4 text-[#013B28]" 
                      />
                    </View>
                  </View>
                </View>

                <View>
                  <Text className="text-[#013B28] font-bold mb-2 ml-1">Price ($)</Text>
                  <View className="bg-white rounded-2xl border border-gray-100 px-4 shadow-sm">
                    <TextInput 
                      placeholder="Price" 
                      value={editPrice} 
                      onChangeText={setEditPrice} 
                      keyboardType="numeric" 
                      className="py-4 text-[#013B28]" 
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-[#013B28] font-bold mb-2 ml-1">Description</Text>
                  <View className="bg-white rounded-2xl border border-gray-100 px-4 shadow-sm">
                    <TextInput 
                      placeholder="Description" 
                      value={editDescription} 
                      onChangeText={setEditDescription} 
                      multiline 
                      className="py-4 text-[#013B28] h-32" 
                      textAlignVertical="top" 
                    />
                  </View>
                </View>
                
                <TouchableOpacity 
                  onPress={handleUpdateAd}
                  disabled={isUpdating}
                  className={`bg-[#013B28] py-4 rounded-2xl flex-row justify-center items-center mt-4 ${isUpdating ? 'opacity-70' : ''}`}
                >
                  {isUpdating ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Update Ad</Text>}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}