import { getCurrentUser, signOut } from "@/lib/appwrite";
import { User } from "@/types";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type AuthState = {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
    selectedCountry: string | null;

    setIsAuthenticated: (value: boolean) => void;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    setSelectedCountry: (country: string | null) => void;

    fetchAuthenticatedUser: () => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            isAuthenticated: false,
            user: null,
            isLoading: true,
            selectedCountry: null,

            setIsAuthenticated: (value: boolean) => set({ isAuthenticated: value }),
            setUser: (user: User | null) => set({ 
                user: user, 
                isAuthenticated: !!user,
                selectedCountry: (user as any)?.country || get().selectedCountry 
            }),
            setLoading: (loading: boolean) => set({ isLoading: loading }),
            setSelectedCountry: (country: string | null) => set({ selectedCountry: country }),

            fetchAuthenticatedUser: async () => {
                set({ isLoading: true });
                try {
                    const user = await getCurrentUser();
                    if (user) {
                        set({ 
                            user: user as unknown as User, 
                            isAuthenticated: true,
                            selectedCountry: (user as any).country || null 
                        });
                    } else {
                        set({ user: null, isAuthenticated: false, selectedCountry: null });
                    }
                } catch (error) {
                    set({ user: null, isAuthenticated: false, selectedCountry: null });
                } finally {
                    set({ isLoading: false });
                }
            },

            logout: async () => {
                set({ isLoading: true });
                try {
                    await signOut();
                    set({ user: null, isAuthenticated: false, selectedCountry: null });
                } catch (error) {
                    // Logout error
                } finally {
                    set({ isLoading: false });
                }
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ 
                isAuthenticated: state.isAuthenticated, 
                user: state.user,
                selectedCountry: state.selectedCountry 
            }),
        }
    )
)
