import { create } from 'zustand';
import { createAd, deleteAd, getAdsByStatus, getAllAds, getAllCategories, getAllUserAds, updateAd, updateAdStatus } from '../lib/appwrite';
import { Ad, Category } from '../types';
import { useAuthStore } from './auth.store';

interface AdsState {
    ads: Ad[];
    categories: Category[];
    isLoading: boolean;
    error: string | null;
    
    // Admin State
    adminAds: Ad[];
    currentAdminStatus: string;

    // Actions
    fetchAds: () => Promise<void>;
    fetchUserAds: () => Promise<void>;
    fetchCategories: () => Promise<void>;
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
    updateAd: (adId: string, adData: {
        title: string;
        description: string;
        country: string;
        city: string;
        price: number;
        images: string[];
        categoryId: string;
    }) => Promise<any>;
    deleteAd: (adId: string) => Promise<void>;
    refreshAdminAds: () => Promise<void>;
}

export const useAdsStore = create<AdsState>((set, get) => ({
    ads: [],
    categories: [],
    isLoading: false,
    error: null,
    adminAds: [],
    currentAdminStatus: 'pending',


    fetchAds: async () => {
        set({ isLoading: true, error: null });
        try {
            const ads = await getAllAds();
            let filteredAds = ads as unknown as Ad[];
            
            // Get selected country from auth store
            const authStore = useAuthStore.getState();
            const selectedCountry = authStore.selectedCountry;
            
            if (selectedCountry) {
                filteredAds = filteredAds.filter(ad => 
                    ad.country?.toLowerCase() === selectedCountry.toLowerCase()
                );
            }
            
            set({ ads: filteredAds, isLoading: false });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchUserAds: async () => {
        set({ isLoading: true, error: null });
        try {
            const ads = await getAllUserAds();
            let filteredAds = ads as unknown as Ad[];
            
            // Get selected country from auth store
            const authStore = useAuthStore.getState();
            const selectedCountry = authStore.selectedCountry;
            
            if (selectedCountry) {
                filteredAds = filteredAds.filter(ad => 
                    ad.country?.toLowerCase() === selectedCountry.toLowerCase()
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

    updateAd: async (adId, adData) => {
        set({ isLoading: true, error: null });
        try {
            const updatedAd = await updateAd(adId, adData);
            await get().fetchUserAds(); // Refresh user ads
            set({ isLoading: false });
            return updatedAd;
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
            throw error;
        }
    },

    deleteAd: async (adId) => {
        set({ isLoading: true, error: null });
        try {
            await deleteAd(adId);
            await get().fetchUserAds(); // Refresh user ads
            set({ isLoading: false });
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
