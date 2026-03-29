import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { completePasswordRecovery } from '../../lib/authRecovery';

const ResetPassword = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    // Normalize tokens (handle string or string[])
    const userId = Array.isArray(params.userId) ? params.userId[0] : params.userId;
    const secret = Array.isArray(params.secret) ? params.secret[0] : params.secret;
    
    console.log('[ResetPassword] Received params:', params);
    console.log('[ResetPassword] Normalized userId:', userId);
    console.log('[ResetPassword] Normalized secret:', secret);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleResetPassword = async () => {
        // Validation
        if (!password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters long');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        if (!userId || !secret) {
            console.log('[ResetPassword] Validation failed: userId or secret is missing', { userId, secret });
            Alert.alert('Error', 'Invalid reset link. Please request a new password reset.');
            return;
        }

        setIsSubmitting(true);

        try {
            console.log('[ResetPassword] Attempting to complete recovery', { userId, secret });
            await completePasswordRecovery(userId as string, secret as string, password);
            Alert.alert(
                'Success',
                'Your password has been reset successfully. Please sign in with your new password.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/(auth)/sign-in')
                    }
                ]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to reset password. Please try again or request a new reset link.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // If missing required parameters, show error
    if (!userId || !secret) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <View className="flex-1 justify-center items-center px-8">
                    <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-4">
                        <Ionicons name="warning-outline" size={40} color="#ef4444" />
                    </View>
                    <Text className="text-gray-800 text-lg font-medium text-center">Invalid Reset Link</Text>
                    <Text className="text-gray-500 text-sm mt-2 text-center">
                        This password reset link is invalid or has expired. Please request a new one.
                    </Text>
                    <TouchableOpacity
                        className="bg-primary rounded-2xl py-4 mt-6 px-8"
                        onPress={() => router.replace('/(auth)/forgot-password')}
                    >
                        <Text className="text-white font-bold text-base">Request New Link</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Logo & Header */}
                    <View className="items-center mb-8">
                        <View className="w-20 h-20 rounded-[20px] items-center justify-center mb-4 shadow-sm">
                            <Image
                                source={require('../../assets/images/iibiye_logo.png')}
                                style={{ width: 80, height: 80 }}
                                contentFit="contain"
                            />
                        </View>
                        <Text className="text-3xl font-bold text-primary mt-2">Reset Password</Text>
                        <Text className="text-gray-500 mt-2 text-base text-center leading-5">
                            Create your new password below
                        </Text>
                    </View>

                    {/* Form */}
                    <View className="space-y-6">
                        {/* New Password */}
                        <View>
                            <Text className="text-primary font-semibold mb-2 ml-1">New Password</Text>
                            <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 py-4 shadow-sm">
                                <Ionicons name="lock-closed-outline" size={20} color="#666" />
                                <TextInput
                                    placeholder="Enter new password"
                                    placeholderTextColor="#999"
                                    className="flex-1 ml-3 text-base text-primary"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Confirm Password */}
                        <View className="mt-6">
                            <Text className="text-primary font-semibold mb-2 ml-1">Confirm Password</Text>
                            <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 py-4 shadow-sm">
                                <Ionicons name="lock-closed-outline" size={20} color="#666" />
                                <TextInput
                                    placeholder="Confirm new password"
                                    placeholderTextColor="#999"
                                    className="flex-1 ml-3 text-base text-primary"
                                    secureTextEntry={!showConfirmPassword}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <Ionicons
                                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color="#666"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Password Requirements */}
                        <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mt-4">
                            <View className="flex-row items-start">
                                <Ionicons name="information-circle-outline" size={20} color="#3B82F6" className="mt-0.5" />
                                <View className="ml-3 flex-1">
                                    <Text className="text-blue-900 font-semibold text-sm">Password Requirements</Text>
                                    <Text className="text-blue-700 text-xs mt-1 leading-4">
                                        • At least 8 characters long{'\n'}
                                        • Include both letters and numbers{'\n'}
                                        • Make it strong and unique
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Reset Button */}
                        <TouchableOpacity
                            className={`bg-primary rounded-2xl py-5 mt-8 shadow-md ${isSubmitting ? 'opacity-50' : 'active:opacity-90'}`}
                            onPress={handleResetPassword}
                            disabled={isSubmitting}
                        >
                            <Text className="text-white text-center font-bold text-lg">
                                {isSubmitting ? 'Resetting...' : 'Reset Password'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View className="flex-row justify-center mt-auto pt-10">
                        <Text className="text-gray-500 font-medium">Remember your password? </Text>
                        <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')}>
                            <Text className="text-primary font-bold">Sign In</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ResetPassword;
