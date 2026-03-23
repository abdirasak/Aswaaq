# Project Code Snapshot

## lib/appwrite.ts
**Path:** `c:\Users\abdi\Desktop\projects\iibiye\lib\appwrite.ts`

```typescript
import { Account, Client, Databases, ID, Query, Storage, ImageGravity } from "react-native-appwrite";

export const appwriteConfig = {
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
    APPWRITE_PROJECT_NAME: "com.indexdesigns.iibiye",
    databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
    profileCollectionId: process.env.EXPO_PUBLIC_APPWRITE_PROFILE_COLLECTION_ID!,
    adsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_ADS_COLLECTION_ID!,
    categoriesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CATEGORIES_COLLECTION_ID!,
    storageId: process.env.EXPO_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,
};

export const client = new Client();
client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// --- AUTH LOGIC ---

export const createUser = async (email: string, password: string, fullName: string) => {
    try {
        const newAccount = await account.create(ID.unique(), email, password, fullName);
        if (!newAccount) throw new Error("Account creation failed");

        await account.createEmailPasswordSession({ email, password });

        return await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.profileCollectionId,
            newAccount.$id,
            {
                user_id: newAccount.$id,
                name: fullName,
                email: email,
                role: 'user', 
            }
        );
    } catch (error: any) {
        console.error("Signup Error:", error.message);
        throw new Error(error.message);
    }
};

export const signIn = async (email: string, password: string) => {
    try {
        return await account.createEmailPasswordSession({ email, password });
    } catch (error: any) {
        const message = error?.message ?? '';
        if (message.includes('active')) {
            await account.deleteSessions();
            return await account.createEmailPasswordSession({ email, password });
        }
        throw new Error(error.message);
    }
}

export const getCurrentUser = async () => {
    try {
        const currentAccount = await account.get();
        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.profileCollectionId,
            [Query.equal("user_id", currentAccount.$id)]
        );
        return currentUser.documents[0];
    } catch (error) {
        return null;
    }
}

export const signOut = async () => {
    try {
        return await account.deleteSession('current');
    } catch (error: any) {
        throw new Error(error.message);
    }
}

// --- STORAGE LOGIC ---

export const uploadFile = async (fileUri: string) => {
    try {
        // 1. Extract file info
        const fileName = fileUri.split('/').pop() || `image_${Date.now()}.jpg`;
        const fileExtension = fileName.split('.').pop()?.toLowerCase();
        const mimeType = `image/${fileExtension === 'png' ? 'png' : 'jpeg'}`;

        // 2. Format the file object for React Native/Expo
        // Using 'any' to bypass strict TS checks because the Appwrite SDK 
        // for React Native expects this specific object structure
        const fileToUpload = {
            name: fileName,
            type: mimeType,
            size: 0, // Appwrite will calculate this on the server
            uri: fileUri,
        } as any;

        console.log("Attempting upload to Bucket:", appwriteConfig.storageId);

        // 3. Perform the actual upload
        const response = await storage.createFile(
            appwriteConfig.storageId,
            ID.unique(),
            fileToUpload
        );

        console.log("✅ REAL UPLOAD SUCCESS. File ID exists now:", response.$id);
        return response.$id;
    } catch (error: any) {
        console.error("❌ ACTUAL UPLOAD FAILED:", error.message);
        // If this fails, the Ad should NOT be created
        throw new Error(`Upload failed: ${error.message}`);
    }
}

export const getFileUrl = (fileId: any) => {
    if (!fileId) return null;

    try {
        // 1. If fileId is an object (Appwrite File object), get the $id string
        const actualId = typeof fileId === 'object' ? fileId.$id : fileId;

        if (!actualId || typeof actualId !== 'string') {
            console.error("getFileUrl: No valid ID found", fileId);
            return null;
        }

        // 2. Get the URL object from Appwrite
        const url = storage.getFilePreviewURL(
            appwriteConfig.storageId,
            actualId,
            800, // width
            800, // height
            ImageGravity.Top, // gravity
            100 // quality
        );

        return url.toString();
    } catch (error: any) {
        console.error("Storage URL Error:", error.message);
        return null;
    }
}

// --- ADS LOGIC ---

export const getAdsByStatus = async (status: string) => {
    try {
        const ads = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.adsCollectionId,
            [
                Query.equal("status", status),
                Query.orderDesc("$createdAt")
            ]
        );
        return ads.documents;
    } catch (error: any) {
        throw new Error(error.message);
    }
}

export const updateAdStatus = async (adId: string, status: 'approved' | 'rejected') => {
    try {
        return await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.adsCollectionId,
            adId,
            { status }
        );
    } catch (error: any) {
        throw new Error(error.message);
    }
}

export const createAd = async (adData: {
    title: string;
    description: string;
    country: string;
    city: string;
    price: number;
    images: string[];
    user_id: string; 
    categoryId: string;
}) => {
    try {
        // Step 1: Sequential Upload (More stable than Promise.all for debugging)
        const imageIds = [];
        for (const uri of adData.images) {
            const id = await uploadFile(uri);
            imageIds.push(id);
        }

        // Step 2: Create DB Document
        const result = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.adsCollectionId,
            ID.unique(),
            {
                title: adData.title,
                description: adData.description,
                country: adData.country,
                city: adData.city,
                price: adData.price,
                images: imageIds,
                seller: adData.user_id,
                categories: adData.categoryId,
                status: 'pending', 
                featured: false,
            }
        );

        console.log("🚀 AD CREATED:", result.$id);
        return result;
    } catch (error: any) {
        console.error("❌ CREATE AD ERROR:", error.message);
        throw new Error(error.message);
    }
}

export const getAdById = async (adId: string) => {
    try {
        return await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.adsCollectionId,
            adId
        );
    } catch (error: any) {
        throw new Error(error.message);
    }
}

export const getUserProfile = async (userId: string) => {
    try {
        const profiles = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.profileCollectionId,
            [Query.equal("user_id", userId)]
        );
        return profiles.documents[0];
    } catch (error) {
        return null;
    }
}

export const getAllAds = async () => {
    try {
        const ads = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.adsCollectionId,
            [
                Query.equal("status", "approved"), 
                Query.orderDesc("$createdAt")      
            ]
        );
        return ads.documents;
    } catch (error: any) {
        throw new Error(error.message);
    }
}

export const getAllCategories = async () => {
    try {
        const categories = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.categoriesCollectionId
        );
        return categories.documents;
    } catch (error: any) {
        throw new Error(error.message);
    }
};
```

## store/ads.store.ts
**Path:** `c:\Users\abdi\Desktop\projects\iibiye\store\ads.store.ts`

```typescript
import { create } from 'zustand';
import { createAd, getAdsByStatus, getAllAds, getAllCategories, updateAdStatus } from '../lib/appwrite';
import { Ad, Category } from '../types';

interface AdsState {
    ads: Ad[];
    categories: Category[];
    isLoading: boolean;
    error: string | null;
    selectedCountry: string | null;
    
    // Admin State
    adminAds: Ad[];
    currentAdminStatus: string;

    // Actions
    fetchAds: (country?: string) => Promise<void>;
    fetchCategories: () => Promise<void>;
    setSelectedCountry: (country: string | null) => void;
    addAd: (adData: {
        title: string;
        description: string;
        country: string;
        city: string;
        price: number;
        images: string[];
        user_id: string;
        categoryId: string;
    }) => Promise<any>;
    
    // Admin Actions
    fetchAdminAds: (status: string) => Promise<void>;
    updateAdStatus: (adId: string, status: 'approved' | 'rejected') => Promise<void>;
    refreshAdminAds: () => Promise<void>;
}

export const useAdsStore = create<AdsState>((set, get) => ({
    ads: [],
    categories: [],
    isLoading: false,
    error: null,
    selectedCountry: null,
    adminAds: [],
    currentAdminStatus: 'pending',

    setSelectedCountry: (country: string | null) => {
        set({ selectedCountry: country });
        get().fetchAds(country || undefined);
    },

    fetchAds: async (country?: string) => {
        set({ isLoading: true, error: null });
        try {
            const ads = await getAllAds();
            let filteredAds = ads as unknown as Ad[];
            
            if (country) {
                filteredAds = filteredAds.filter(ad => 
                    ad.country?.toLowerCase() === country.toLowerCase()
                );
            }
            
            set({ ads: filteredAds, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchCategories: async () => {
        set({ isLoading: true, error: null });
        try {
            const categories = await getAllCategories();
            set({ categories: categories as unknown as Category[], isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    addAd: async (adData) => {
        set({ isLoading: true, error: null });
        try {
            const newAd = await createAd(adData);
            // Optionally refresh ads after adding
            await get().fetchAds();
            set({ isLoading: false });
            return newAd;
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    fetchAdminAds: async (status: string) => {
        set({ isLoading: true, error: null, currentAdminStatus: status });
        try {
            const ads = await getAdsByStatus(status.toLowerCase());
            set({ adminAds: ads as unknown as Ad[], isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    refreshAdminAds: async () => {
        const status = get().currentAdminStatus;
        await get().fetchAdminAds(status);
    },

    updateAdStatus: async (adId: string, status: 'approved' | 'rejected') => {
        set({ isLoading: true, error: null });
        try {
            await updateAdStatus(adId, status);
            
            // Immediately update local state for better UX
            const currentAds = get().adminAds;
            set({ 
                adminAds: currentAds.filter(ad => ad.$id !== adId),
                isLoading: false 
            });
            
            // Also refresh the main ads list so approved ads show up immediately on other screens
            if (status === 'approved') {
                await get().fetchAds();
            }
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    }
}));
```

## app/(tabs)/postAd.tsx
**Path:** `c:\Users\abdi\Desktop\projects\iibiye\app\(tabs)\postAd.tsx`

```tsx
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
  const { user } = useAuthStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState('kenya');
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
        if (data.length > 0) setSelectedCategory(data[0].$id);
      } catch (error) {
        console.error("Failed to fetch categories", error);
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
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
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
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          
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
                <View key={index} className="w-24 h-24 rounded-2xl relative">
                  <Image 
                    source={{ uri }} 
                    style={{ width: '100%', height: '100%', borderRadius: 16 }}
                    contentFit="cover"
                  />
                  <TouchableOpacity onPress={() => removeImage(index)} className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1">
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
                <TextInput placeholder="Ex: iPhone 15 Pro Max" value={title} onChangeText={setTitle} className="py-4 text-[#013B28]" />
              </View>
            </View>

            {/* Location Group */}
            <View className="flex-row gap-x-4">
              <View className="flex-1">
                <Text className="text-[#013B28] font-bold mb-2 ml-1">Country</Text>
                <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <Picker selectedValue={country} onValueChange={(v) => setCountry(v)} style={{ height: 55 }}>
                    <Picker.Item label="Kenya" value="kenya" />
                    <Picker.Item label="Egypt" value="egypt" />
                  </Picker>
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-[#013B28] font-bold mb-2 ml-1">City</Text>
                <View className="bg-white rounded-2xl border border-gray-100 px-4 shadow-sm">
                  <TextInput placeholder="Ex: Nairobi" value={city} onChangeText={setCity} className="py-4 text-[#013B28]" />
                </View>
              </View>
            </View>

            {/* Description */}
            <View>
              <Text className="text-[#013B28] font-bold mb-2 ml-1">Description</Text>
              <View className="bg-white rounded-2xl border border-gray-100 px-4 shadow-sm">
                <TextInput placeholder="Describe your item..." value={description} onChangeText={setDescription} multiline className="py-4 text-[#013B28] h-32" textAlignVertical="top" />
              </View>
            </View>

            {/* Price */}
            <View>
              <Text className="text-[#013B28] font-bold mb-2 ml-1">Price ($)</Text>
              <View className="bg-white rounded-2xl border border-gray-100 px-4 shadow-sm flex-row items-center">
                <Text className="text-gray-400 mr-2 font-bold">$</Text>
                <TextInput placeholder="0.00" value={price} onChangeText={setPrice} keyboardType="numeric" className="flex-1 py-4 text-[#013B28]" />
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
```

## app/(tabs)/_layout.tsx
**Path:** `c:\Users\abdi\Desktop\projects\iibiye\app\(tabs)\_layout.tsx`

```tsx
import { useAuthStore } from '@/store/auth.store';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TabLayout = () => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  
  // We wrap this in a try/catch or a fallback to prevent the 
  // "Navigation context" error if your Root Layout isn't ready.
  let insets;
  try {
    insets = useSafeAreaInsets();
  } catch (e) {
    insets = { bottom: 0, top: 0, left: 0, right: 0 };
  }

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#FDFBF7]">
        <ActivityIndicator size="large" color="#064229" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  /**
   * FIX LOGIC:
   * We want 20px space. On modern Androids with gesture bars, 
   * insets.bottom provides the bar height. 
   * Adding 20px to that ensures the menu never "drops" or overlaps.
   */
  const bottomMargin = Platform.OS === 'android' 
    ? (insets.bottom > 0 ? insets.bottom + 10 : 20) 
    : 35; // Standard iOS spacing

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true, // Prevents menu from jumping up when typing
        tabBarStyle: {
          position: 'absolute',
          bottom: bottomMargin,
          left: 16,
          right: 16,
          height: 64,
          backgroundColor: '#064229',
          borderRadius: 32,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.25,
          shadowRadius: 3.5,
          paddingBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 10,
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="likedAds"
        options={{
          title: 'Liked',
          tabBarIcon: ({ color }) => (
            <Ionicons name="heart-outline" size={22} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="postAd"
        options={{
          title: '',
          tabBarIcon: () => (
            <View
              style={{
                width: 58,
                height: 58,
                backgroundColor: '#064229',
                borderRadius: 29,
                justifyContent: 'center',
                alignItems: 'center',
                top: -15, 
                borderWidth: 5,
                borderColor: '#FDFBF7', 
                elevation: 12, 
              }}
            >
              <Ionicons name="add" size={32} color="#fff" />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings-outline" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          // Use href: null to hide the tab if user is an admin
          href: isAdmin ? null : undefined,
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          // Only show tab if user is admin
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color }) => (
            <Ionicons name="shield-checkmark-outline" size={22} color={color} />
          ),
        }}
      />

      {/* Hidden Screens */}
      <Tabs.Screen name="country" options={{ href: null }} />
      <Tabs.Screen name="showAds" options={{ href: null }} />
      <Tabs.Screen name="showCategory" options={{ href: null }} />
      <Tabs.Screen name="showCity" options={{ href: null }} />
    </Tabs>
  );
};

export default TabLayout;
```

## types/index.ts
**Path:** `c:\Users\abdi\Desktop\projects\iibiye\types\index.ts`

```typescript
export type User = {
    $id: string;
    email: string;
    name: string;
    registration: string;
    status: boolean;
    labels: string[];
    passwordUpdate: string;
    emailVerification: boolean;
    phone: string;
    phoneVerification: boolean;
    prefs: Record<string, any>;
    accessedAt: string;
    role?: string;
};

export type Ad = {
    $id: string;
    $createdAt: string;
    $updatedAt: string;
    title: string;
    description: string;
    country: string;
    city: string;
    price: number;
    images: any[]; // Changed from string[] to any[] to handle both IDs and objects
    seller: any; 
    categoryId?: string;
    categories?: any; 
    isFeatured?: boolean;
    status?: 'active' | 'pending' | 'disapproved' | 'approved' | 'rejected';
};

export type Category = {
    $id: string;
    name: string;
    image?: string;
};
```

## store/auth.store.ts
**Path:** `c:\Users\abdi\Desktop\projects\iibiye\store\auth.store.ts`

```typescript
import { getCurrentUser, signOut } from "@/lib/appwrite";
import { User } from "@/types";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type AuthState = {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;

    setIsAuthenticated: (value: boolean) => void;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;

    fetchAuthenticatedUser: () => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            isAuthenticated: false,
            user: null,
            isLoading: true,

            setIsAuthenticated: (value: boolean) => set({ isAuthenticated: value }),
            setUser: (user: User | null) => set({ user: user, isAuthenticated: !!user }),
            setLoading: (loading: boolean) => set({ isLoading: loading }),

            fetchAuthenticatedUser: async () => {
                set({ isLoading: true });
                try {
                    const user = await getCurrentUser();
                    if (user) {
                        set({ user: user as unknown as User, isAuthenticated: true });
                    } else {
                        set({ user: null, isAuthenticated: false });
                    }
                } catch (error) {
                    set({ user: null, isAuthenticated: false });
                } finally {
                    set({ isLoading: false });
                }
            },

            logout: async () => {
                set({ isLoading: true });
                try {
                    await signOut();
                    set({ user: null, isAuthenticated: false });
                } catch (error) {
                    console.error("Logout error:", error);
                } finally {
                    set({ isLoading: false });
                }
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ isAuthenticated: state.isAuthenticated, user: state.user }),
        }
    )
)
```
