import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type LikedAdsState = {
    likedAdIds: string[];
    toggleLike: (adId: string) => void;
    isLiked: (adId: string) => boolean;
    clearLikes: () => void;
    setLikedAds: (adIds: string[]) => void;
    loadUserLikes: (userId: string) => Promise<void>;
    saveUserLikes: (userId: string) => Promise<void>;
}

// User-specific storage functions
const getUserLikedAdsKey = (userId: string) => `liked-ads-${userId}`;

const saveUserLikedAds = async (userId: string, adIds: string[]) => {
    try {
        await AsyncStorage.setItem(getUserLikedAdsKey(userId), JSON.stringify(adIds));
    } catch (error) {
        console.error('Error saving user liked ads:', error);
    }
};

const loadUserLikedAds = async (userId: string): Promise<string[]> => {
    try {
        const stored = await AsyncStorage.getItem(getUserLikedAdsKey(userId));
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading user liked ads:', error);
        return [];
    }
};

export const useLikedAdsStore = create<LikedAdsState>()(
    persist(
        (set, get) => ({
            likedAdIds: [],

            toggleLike: (adId: string) => {
                const { likedAdIds } = get();
                const newLikedAdIds = likedAdIds.includes(adId) 
                    ? likedAdIds.filter(id => id !== adId)
                    : [...likedAdIds, adId];
                set({ likedAdIds: newLikedAdIds });
            },

            isLiked: (adId: string) => {
                return get().likedAdIds.includes(adId);
            },

            clearLikes: () => set({ likedAdIds: [] }),

            setLikedAds: (adIds: string[]) => set({ likedAdIds: adIds }),

            loadUserLikes: async (userId: string) => {
                const userLikes = await loadUserLikedAds(userId);
                set({ likedAdIds: userLikes });
            },

            saveUserLikes: async (userId: string) => {
                const { likedAdIds } = get();
                await saveUserLikedAds(userId, likedAdIds);
            },
        }),
        {
            name: 'liked-ads-storage-temp', // Temporary storage for current session
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
