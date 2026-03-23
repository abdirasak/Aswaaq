import { useAuthStore } from '@/store/auth.store';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
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
import { getCurrentUser, signIn } from '../../lib/appwrite';

const SignIn = () => {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await signIn(email, password);
      
      // Appwrite createEmailPasswordSession returns the session, but not the user.
      // However, the session establishment is what matters. 
      // We can optimisticly set authenticated or fetch user. 
      // To save time, we can trust the session creation.
      const user = await getCurrentUser();
      if (user) {
        setUser(user as any);
        setIsAuthenticated(true);
      }
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = () => {
    router.push('/(auth)/forgot-password');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo & Header */}
          <View className="items-center mb-10">
            <View className="w-34 h-34 rounded-[24px] items-center justify-center mb-6 shadow-sm">
              <Image
                source={require('../../assets/images/iibiye_logo.png')}
                style={{ width: 112, height: 112 }}
                contentFit="contain"
              />
            </View>
            <Text className="text-4xl font-bold text-primary tracking-widest">IIBIYE</Text>
            <Text className="text-gray-500 mt-2 text-base">Welcome back to your marketplace</Text>
          </View>

          {/* Form */}
          <View className="space-y-6">
            <View>
              <Text className="text-primary font-semibold mb-2 ml-1">Email address</Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 py-4 shadow-sm">
                <Ionicons name="mail-outline" size={20} color="#666" />
                <TextInput
                  placeholder="name@example.com"
                  placeholderTextColor="#999"
                  className="flex-1 ml-3 text-base text-primary"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View className="mt-6">
              <Text className="text-primary font-semibold mb-2 ml-1">Password</Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 py-4 shadow-sm">
                <Ionicons name="lock-closed-outline" size={20} color="#666" />
                <TextInput
                  placeholder="••••••••"
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
              <View className="flex-row justify-start mt-2">
                <TouchableOpacity onPress={handlePasswordReset} disabled={isResetting}>
                  <Text className={`text-primary font-bold text-sm ${isResetting ? 'opacity-50' : ''}`}>
                    {isResetting ? 'Sending...' : 'Forgot password?'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              className={`bg-primary rounded-2xl py-5 mt-10 shadow-md ${isSubmitting ? 'opacity-50' : 'active:opacity-90'}`}
              onPress={handleSignIn}
              disabled={isSubmitting}
            >
              <Text className="text-white text-center font-bold text-lg">
                {isSubmitting ? 'Logging In...' : 'Log In'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Password Reset Info */}
          <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mt-8">
            <View className="flex-row items-start">
              <Ionicons name="information-circle-outline" size={20} color="#3B82F6" className="mt-0.5" />
              <View className="ml-3 flex-1">
                <Text className="text-blue-900 font-semibold text-sm">Password Help</Text>
                <Text className="text-blue-700 text-xs mt-1 leading-4">
                  Click "Forgot password?" to receive a reset link via email. The link will expire in 1 hour for security.
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View className="flex-row justify-center mt-auto pt-10">
            <Text className="text-gray-500 font-medium">New to IIBIYE? </Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-bold">Create an account</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignIn;