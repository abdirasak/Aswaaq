import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type LikedAdsState = {
    likedAdIds: string[];
    toggleLike: (adId: string) => void;
    isLiked: (adId: string) => boolean;
    clearLikes: () => void;
}

export const useLikedAdsStore = create<LikedAdsState>()(
    persist(
        (set, get) => ({
            likedAdIds: [],

            toggleLike: (adId: string) => {
                const { likedAdIds } = get();
                if (likedAdIds.includes(adId)) {
                    set({ likedAdIds: likedAdIds.filter(id => id !== adId) });
                } else {
                    set({ likedAdIds: [...likedAdIds, adId] });
                }
            },

            isLiked: (adId: string) => {
                return get().likedAdIds.includes(adId);
            },

            clearLikes: () => set({ likedAdIds: [] }),
        }),
        {
            name: 'liked-ads-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
