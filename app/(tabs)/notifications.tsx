import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllUserAds, getFileUrl } from '../../lib/appwrite';
import { useAuthStore } from '../../store/auth.store';

interface Notification {
    id: string;
    type: 'approved' | 'disapproved';
    adTitle: string;
    adPrice: number;
    adImage?: string;
    timestamp: Date;
    message: string;
    read: boolean;
}

const getTimeAgo = (date: Date) => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
};

export default function Notifications() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadNotifications = async () => {
        if (!user) {
            setIsLoading(false);
            setRefreshing(false);
            return;
        }
        
        try {
            // Only get ads for the current authenticated user
            const userAds = await getAllUserAds();
            const userNotifications: Notification[] = [];

            // Filter ads to only include those belonging to the current user
            const currentUserAds = userAds.filter((ad: any) => {
                // Check if the ad belongs to the current user
                const adSellerId = typeof ad.seller === 'string' ? ad.seller : ad.seller?.$id;
                return adSellerId === user.$id;
            });

            currentUserAds.forEach((ad: any) => {
                // Check if ad has been approved or disapproved
                if (ad.status === 'approved' || ad.status === 'rejected') {
                    const notification: Notification = {
                        id: `${ad.$id}-${ad.status}`,
                        type: ad.status === 'approved' ? 'approved' : 'disapproved',
                        adTitle: ad.title,
                        adPrice: ad.price,
                        adImage: ad.images?.[0],
                        timestamp: new Date(ad.$updatedAt),
                        message: ad.status === 'approved' 
                            ? `Your ad "${ad.title}" has been approved and is now live!`
                            : `Your ad "${ad.title}" has been disapproved. Please review our guidelines.`,
                        read: false
                    };
                    userNotifications.push(notification);
                }
            });

            // Sort by timestamp (newest first)
            userNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            setNotifications(userNotifications);
        } catch (error) {
            console.error('Error loading notifications:', error);
            // Show error message to user
            Alert.alert('Error', 'Failed to load notifications. Please try again.');
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadNotifications();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
        loadNotifications();
    };

    const handleNotificationPress = (notification: Notification) => {
        // Mark as read (you could implement this with a backend call)
        // For now, just navigate to the ad if needed
        console.log('Notification pressed:', notification);
    };

    const renderNotificationItem = (notification: Notification) => (
        <TouchableOpacity
            key={notification.id}
            onPress={() => handleNotificationPress(notification)}
            className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-50"
        >
            <View className="flex-row">
                {/* Status Icon */}
                <View className={`w-10 h-10 rounded-full items-center justify-center ${
                    notification.type === 'approved' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                    <Ionicons 
                        name={notification.type === 'approved' ? 'checkmark' : 'close'} 
                        size={20} 
                        color={notification.type === 'approved' ? '#10b981' : '#ef4444'} 
                    />
                </View>

                {/* Content */}
                <View className="flex-1 ml-3">
                    <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                            <Text className="font-semibold text-gray-800 text-base leading-5">
                                {notification.message}
                            </Text>
                            <Text className="text-gray-500 text-sm mt-1">
                                {getTimeAgo(notification.timestamp)}
                            </Text>
                        </View>
                    </View>

                    {/* Ad Preview */}
                    <View className="flex-row items-center mt-3 bg-gray-50 rounded-xl p-2">
                        {notification.adImage ? (
                            <Image
                                source={{ uri: getFileUrl(notification.adImage) || undefined }}
                                style={{ width: 40, height: 40, borderRadius: 8 }}
                                contentFit="cover"
                            />
                        ) : (
                            <View className="w-10 h-10 bg-gray-200 rounded-lg items-center justify-center">
                                <Ionicons name="image-outline" size={16} color="#999" />
                            </View>
                        )}
                        <View className="ml-2 flex-1">
                            <Text className="font-medium text-gray-800 text-sm" numberOfLines={1}>
                                {notification.adTitle}
                            </Text>
                            <Text className="text-primary font-bold text-sm">
                                ${notification.adPrice.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    // If user is not authenticated, show access denied message
    if (!user) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <View className="px-4 py-4 flex-row items-center border-b border-gray-100">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-primary">Notifications</Text>
                </View>
                <View className="flex-1 justify-center items-center px-8">
                    <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-4">
                        <Ionicons name="lock-closed" size={40} color="#ef4444" />
                    </View>
                    <Text className="text-gray-800 text-lg font-medium text-center">Access Denied</Text>
                    <Text className="text-gray-500 text-sm mt-2 text-center">
                        Please sign in to view your notifications
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* Header */}
            <View className="px-4 py-4 flex-row items-center border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-primary">Your Notifications</Text>
            </View>

            {/* Content */}
            {isLoading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#064229" />
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 16 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#064229']} />
                    }
                >
                    {notifications.length === 0 ? (
                        <View className="items-center justify-center py-20">
                            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                                <Ionicons name="notifications-off-outline" size={40} color="#999" />
                            </View>
                            <Text className="text-gray-500 text-lg font-medium">No notifications</Text>
                            <Text className="text-gray-400 text-sm mt-2 text-center">
                                You'll see updates about your ads here once you post some
                            </Text>
                        </View>
                    ) : (
                        <>
                            <Text className="text-gray-500 text-sm font-medium mb-3">
                                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                            </Text>
                            {notifications.map(renderNotificationItem)}
                        </>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}