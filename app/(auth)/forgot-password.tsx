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
import { requestPasswordRecovery } from '../../lib/authRecovery';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

const ForgotPassword = () => {
  const router = useRouter();

  // View A state
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendEmail = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      await requestPasswordRecovery(email.trim());
      Alert.alert(
        'Check your email',
        'We sent you a link to reset your password. Please check your inbox and click the link to continue.',
        [{ text: 'OK' }]
      );
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 30 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mb-8">
            <View className="w-20 h-20 rounded-[18px] items-center justify-center mb-4 shadow-md bg-white">
              <Image
                source={require('../../assets/images/aswaaq_logo.jpg')}
                style={{ width: 80, height: 80, borderRadius: 14 }}
                contentFit="cover"
              />
            </View>
            <Text className="text-3xl font-bold text-primary mt-2">
              Forgot Password?
            </Text>
            <Text className="text-gray-500 mt-2 text-base text-center leading-5">
              Enter your email address and we'll send you a link to reset your password.
            </Text>
          </View>

          {/* Request Recovery */}
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

            <View className={`bg-primary rounded-2xl mt-8 shadow-md ${isSubmitting ? 'opacity-50' : ''}`}>
              <TouchableOpacity
                className="py-5 active:opacity-90"
                onPress={handleSendEmail}
                disabled={isSubmitting}
              >
                <Text className="text-white text-center font-bold text-lg">
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-8">
            <View className="flex-row items-start">
              <Ionicons name="information-circle-outline" size={20} color="#F59E0B" className="mt-0.5" />
              <View className="ml-3 flex-1">
                <Text className="text-amber-900 font-semibold text-sm">Important</Text>
                <Text className="text-amber-700 text-xs mt-1 leading-4">
                  • Recovery links are valid for a limited time{"\n"}
                  • Check your spam folder if you don't receive the email{"\n"}
                  • Custom URL schemes are used for direct app redirection
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row justify-center mt-auto pt-10">
            <Text className="text-gray-500 font-medium">Remember your password? </Text>
            <TouchableOpacity onPress={handleBackToSignIn}>
              <Text className="text-primary font-bold">Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPassword;