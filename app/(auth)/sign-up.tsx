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
import { createUser } from '../../lib/appwrite';

const SignUp = () => {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async () => {
    if (!fullName || !email || !password || !confirmPassword || !phone) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!agreed) {
      Alert.alert('Error', 'Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setIsSubmitting(true);

    try {
      const newUser = await createUser(email, password, fullName);
      if (newUser) {
        // Since createUser in appwrite.ts already creates a session, 
        // we just need to update the store and redirect
        setUser(newUser as any);
        setIsAuthenticated(true);
      }
      router.replace('/(auth)/country');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Top Navigation */}
      <View className="flex-row items-center px-4 py-2 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-gray-800 mr-10">
          Create Account
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 30 }}
        >
          {/* Logo & Header */}
          <View className="items-center mb-8">
            <View className="w-34 h-34 rounded-[24px] items-center justify-center mb-4 shadow-sm">
              <Image
                source={require('../../assets/images/iibiye_logo.png')}
                style={{ width: 112, height: 112 }}
                contentFit="contain"
              />
            </View>
            <Text className="text-4xl font-bold text-primary mt-2">Join IIBIYE</Text>
            <Text className="text-gray-500 mt-2 text-base text-center">
              Sign up to start buying and selling in the marketplace.
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-5">
            <View>
              <Text className="text-primary font-semibold mb-2 ml-1">Full Name</Text>
              <View className="bg-white border border-gray-200 rounded-2xl px-4 py-4 shadow-sm">
                <TextInput
                  placeholder="John Doe"
                  placeholderTextColor="#999"
                  className="text-base text-primary"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            <View className="mt-5">
              <Text className="text-primary font-semibold mb-2 ml-1">Email Address</Text>
              <View className="bg-white border border-gray-200 rounded-2xl px-4 py-4 shadow-sm">
                <TextInput
                  placeholder="example@email.com"
                  placeholderTextColor="#999"
                  className="text-base text-primary"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View className="mt-5">
              <Text className="text-primary font-semibold mb-2 ml-1">Phone Number</Text>
              <View className="bg-white border border-gray-200 rounded-2xl px-4 py-4 shadow-sm">
                <TextInput
                  placeholder="+252 ..."
                  placeholderTextColor="#999"
                  className="text-base text-primary"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            <View className="mt-5">
              <Text className="text-primary font-semibold mb-2 ml-1">Password</Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 py-4 shadow-sm">
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#999"
                  className="flex-1 text-base text-primary"
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

            <View className="mt-5">
              <Text className="text-primary font-semibold mb-2 ml-1">Confirm Password</Text>
              <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 py-4 shadow-sm">
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#999"
                  className="flex-1 text-base text-primary"
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

            {/* Terms and Privacy */}
            <View className="flex-row items-center mt-6 px-1">
              <TouchableOpacity
                onPress={() => setAgreed(!agreed)}
                className={`w-6 h-6 rounded-md border items-center justify-center ${
                  agreed ? 'bg-primary border-primary' : 'bg-white border-gray-300'
                }`}
              >
                {agreed && <Ionicons name="checkmark" size={16} color="white" />}
              </TouchableOpacity>
              <Text className="flex-1 ml-3 text-sm text-gray-600 leading-5">
                I agree to the <Text className="text-primary font-bold">Terms of Service</Text> and{' '}
                <Text className="text-primary font-bold">Privacy Policy</Text>
              </Text>
            </View>

            <TouchableOpacity
              className={`bg-primary rounded-2xl py-5 mt-8 shadow-md ${isSubmitting ? 'opacity-50' : 'active:opacity-90'}`}
              onPress={handleSignUp}
              disabled={isSubmitting}
            >
              <Text className="text-white text-center font-bold text-lg">
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Account Benefits */}
          <View className="bg-green-50 border border-green-200 rounded-2xl p-4 mt-8">
            <View className="flex-row items-start">
              <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" className="mt-0.5" />
              <View className="ml-3 flex-1">
                <Text className="text-green-900 font-semibold text-sm">Why Join IIBIYE?</Text>
                <Text className="text-green-700 text-xs mt-1 leading-4">
                  • Buy and sell items safely{'\n'}
                  • Connect with local sellers{'\n'}
                  • Post unlimited ads for free{'\n'}
                  • Join a trusted community
                </Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View className="flex-row justify-center mt-10 mb-6">
            <Text className="text-gray-500 font-medium">Already a member? </Text>
            <Link href="./sign-in" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-bold">Log In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;