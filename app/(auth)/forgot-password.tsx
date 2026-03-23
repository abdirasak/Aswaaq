import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { resetPassword } from '../../lib/appwrite';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff', // Replace with your background color
  },
});

const ForgotPassword = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(email);
      setEmailSent(true);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToSignIn = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navigation */}
      <View className="flex-row items-center px-4 py-2 border-b border-gray-100">
        <TouchableOpacity onPress={handleBackToSignIn} className="p-2">
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-gray-800 mr-10">
          Reset Password
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
            <View className="w-20 h-20 rounded-[20px] items-center justify-center mb-4 shadow-sm">
              <Image
                source={require('../../assets/images/iibiye_logo.png')}
                style={{ width: 80, height: 80 }}
                contentFit="contain"
              />
            </View>
            <Text className="text-3xl font-bold text-primary mt-2">Forgot Password?</Text>
            <Text className="text-gray-500 mt-2 text-base text-center leading-5">
              No worries! Enter your email address below and we'll send you a link to reset your password.
            </Text>
          </View>

          {!emailSent ? (
            <>
              {/* Email Input */}
              <View className="space-y-6">
                <View>
                  <Text className="text-primary font-semibold mb-2 ml-1">Email Address</Text>
                  <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 py-4 shadow-sm">
                    <Ionicons name="mail-outline" size={20} color="#666" />
                    <TextInput
                      placeholder="Enter your email"
                      placeholderTextColor="#999"
                      className="flex-1 ml-3 text-base text-primary"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                </View>

                {/* Reset Button */}
                <View className={`bg-primary rounded-2xl mt-8 shadow-md ${isSubmitting ? 'opacity-50' : ''}`}>
                  <TouchableOpacity
                    className="py-5 active:opacity-90"
                    onPress={handleResetPassword}
                    disabled={isSubmitting}
                  >
                    <Text className="text-white text-center font-bold text-lg">
                      {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Instructions */}
              <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-8">
                <View className="flex-row items-start">
                  <Ionicons name="information-circle-outline" size={20} color="#F59E0B" className="mt-0.5" />
                  <View className="ml-3 flex-1">
                    <Text className="text-amber-900 font-semibold text-sm">Important</Text>
                    <Text className="text-amber-700 text-xs mt-1 leading-4">
                      • The reset link will expire in 1 hour for security{'\n'}
                      • Check your spam folder if you don't receive the email{'\n'}
                      • Make sure to use the email associated with your account
                    </Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            /* Success State */
            <View className="flex-1 justify-center items-center px-6">
              <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
                <Ionicons name="mail-outline" size={40} color="#10B981" />
              </View>
              <Text className="text-2xl font-bold text-primary text-center mb-3">
                Email Sent!
              </Text>
              <Text className="text-gray-600 text-center leading-6 mb-8">
                We've sent a password reset link to{'\n'}
                <Text className="font-semibold text-primary">{email}</Text>
                {'\n\n'}
                Check your inbox and follow the instructions to reset your password.
              </Text>

              <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4 w-full">
                <View className="flex-row items-start">
                  <Ionicons name="time-outline" size={20} color="#3B82F6" className="mt-0.5" />
                  <View className="ml-3 flex-1">
                    <Text className="text-blue-900 font-semibold text-sm">Next Steps</Text>
                    <Text className="text-blue-700 text-xs mt-1 leading-4">
                      1. Open your email app{'\n'}
                      2. Find the reset email from IIBIYE{'\n'}
                      3. Click the reset link{'\n'}
                      4. Create your new password
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                className="bg-gray-100 rounded-2xl py-4 mt-8 w-full"
                onPress={handleBackToSignIn}
              >
                <Text className="text-primary text-center font-bold text-base">
                  Back to Sign In
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Footer */}
          {!emailSent && (
            <View className="flex-row justify-center mt-auto pt-10">
              <Text className="text-gray-500 font-medium">Remember your password? </Text>
              <TouchableOpacity onPress={handleBackToSignIn}>
                <Text className="text-primary font-bold">Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPassword;