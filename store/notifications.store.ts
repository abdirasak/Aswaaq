import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type NotificationState = {
    notificationCount: number;
    viewedAdIds: string[]; // Track viewed ad IDs instead of generic notification IDs
    setNotificationCount: (count: number) => void;
    markNotificationsAsViewed: (adIds: string[]) => void;
    markAdAsViewed: (adId: string) => void;
    isAdViewed: (adId: string) => boolean;
    resetNotifications: () => void;
    loadUserNotifications: (userId: string) => Promise<void>;
    saveUserNotifications: (userId: string) => Promise<void>;
}

// User-specific storage functions
const getUserNotificationsKey = (userId: string) => `notifications-${userId}`;

const saveUserNotifications = async (userId: string, viewedAdIds: string[]) => {
    try {
        await AsyncStorage.setItem(getUserNotificationsKey(userId), JSON.stringify(viewedAdIds));
    } catch (error) {
        console.error('Error saving user notifications:', error);
    }
};

const loadUserNotifications = async (userId: string): Promise<string[]> => {
    try {
        const stored = await AsyncStorage.getItem(getUserNotificationsKey(userId));
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading user notifications:', error);
        return [];
    }
};

export const useNotificationsStore = create<NotificationState>()(
    persist(
        (set, get) => ({
            notificationCount: 0,
            viewedAdIds: [],

            setNotificationCount: (count: number) => {
                set({ notificationCount: count });
            },

            markNotificationsAsViewed: (adIds: string[]) => {
                set({ 
                    viewedAdIds: [...get().viewedAdIds, ...adIds],
                    notificationCount: 0 
                });
            },

            markAdAsViewed: (adId: string) => {
                const { viewedAdIds, notificationCount } = get();
                if (!viewedAdIds.includes(adId)) {
                    const newViewedAdIds = [...viewedAdIds, adId];
                    set({ 
                        viewedAdIds: newViewedAdIds,
                        notificationCount: Math.max(0, notificationCount - 1)
                    });
                }
            },

            isAdViewed: (adId: string) => {
                return get().viewedAdIds.includes(adId);
            },

            resetNotifications: () => {
                set({ 
                    notificationCount: 0,
                    viewedAdIds: []
                });
            },

            loadUserNotifications: async (userId: string) => {
                const userViewedAdIds = await loadUserNotifications(userId);
                set({ viewedAdIds: userViewedAdIds });
            },

            saveUserNotifications: async (userId: string) => {
                const { viewedAdIds } = get();
                await saveUserNotifications(userId, viewedAdIds);
            },
        }),
        {
            name: 'notifications-storage-temp',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
