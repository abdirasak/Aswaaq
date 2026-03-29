import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { checkVerificationCode, resetPasswordWithCode } from '../../lib/appwrite';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

const VerifyUser = () => {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    if (verificationCode.length !== 6) {
      Alert.alert('Error', 'Verification code must be 6 digits');
      return;
    }

    setIsVerifying(true);

    try {
      const isValid = await checkVerificationCode(email as string, verificationCode);
      
      if (isValid) {
        setShowPasswordModal(true);
      } else {
        Alert.alert('Error', 'Invalid verification code');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetPassword = async () => {
    // Validation
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsResetting(true);

    try {
      await resetPasswordWithCode(email as string, verificationCode, newPassword);
      
      Alert.alert(
        'Success',
        'Your password has been reset successfully. Please sign in with your new password.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(auth)/sign-in');
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleResendCode = () => {
    // Go back to forgot password to resend code
    router.back();
  };

  const handleCloseModal = () => {
    setShowPasswordModal(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navigation */}
      <View className="flex-row items-center px-4 py-2 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-gray-800 mr-10">
          Verify Email
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
          {/* Logo & Header */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 rounded-[20px] items-center justify-center mb-4 shadow-sm">
              <Image
                source={require('../../assets/images/iibiye_logo.png')}
                style={{ width: 80, height: 80 }}
                contentFit="contain"
              />
            </View>
            <Text className="text-3xl font-bold text-primary mt-2">Verify Your Email</Text>
            <Text className="text-gray-500 mt-2 text-base text-center leading-5">
              We've sent a 6-digit verification code to{'\n'}
              <Text className="font-semibold text-primary">{email}</Text>
            </Text>
          </View>

          {/* Verification Code Input */}
          <View className="space-y-6">
            <View>
              <Text className="text-primary font-semibold mb-2 ml-1">Verification Code</Text>
              <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-6">
                <TextInput
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="Enter 6-digit code"
                  keyboardType="number-pad"
                  maxLength={6}
                  className="text-base text-primary text-center text-2xl font-bold tracking-widest"
                />
              </View>
              <Text className="text-gray-400 text-xs mt-2 text-center">
                Code expires in {formatTime(timeLeft)}
              </Text>
            </View>

            {/* Verify Button */}
            <View className={`bg-primary rounded-2xl mt-8 shadow-md ${isVerifying ? 'opacity-50' : ''}`}>
              <TouchableOpacity
                className="py-5 active:opacity-90"
                onPress={handleVerifyCode}
                disabled={isVerifying}
              >
                <Text className="text-white text-center font-bold text-lg">
                  {isVerifying ? 'Verifying...' : 'Verify Code'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Resend Code */}
            <TouchableOpacity
              className="items-center mt-4"
              onPress={handleResendCode}
              disabled={timeLeft > 0}
            >
              <Text className={`${timeLeft > 0 ? 'text-gray-300' : 'text-primary'} font-medium`}>
                Didn't receive the code? {timeLeft > 0 ? `Resend in ${formatTime(timeLeft)}` : 'Resend Code'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mt-8">
            <View className="flex-row items-start">
              <Ionicons name="information-circle-outline" size={20} color="#3B82F6" className="mt-0.5" />
              <View className="ml-3 flex-1">
                <Text className="text-blue-900 font-semibold text-sm">Check Your Email</Text>
                <Text className="text-blue-700 text-xs mt-1 leading-4">
                  • The verification code has been sent to your email{'\n'}
                  • Check your spam folder if you don't see it{'\n'}
                  • The code will expire in 10 minutes for security
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Password Reset Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[40px] p-8 pb-12 shadow-xl">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-primary">Reset Password</Text>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <View className="space-y-4">
              {/* New Password */}
              <View>
                <Text className="text-gray-500 font-semibold mb-2 ml-1">New Password</Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
                    secureTextEntry={!showPassword}
                    className="flex-1 text-base text-primary"
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
              <View className="mt-4">
                <Text className="text-gray-500 font-semibold mb-2 ml-1">Confirm Password</Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4">
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    secureTextEntry={!showConfirmPassword}
                    className="flex-1 text-base text-primary"
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
              <View className="bg-blue-50 border border-blue-200 rounded-2xl p-3 mt-2">
                <View className="flex-row items-start">
                  <Ionicons name="information-circle-outline" size={16} color="#3B82F6" className="mt-0.5" />
                  <View className="ml-2 flex-1">
                    <Text className="text-blue-900 font-semibold text-xs">Password Requirements</Text>
                    <Text className="text-blue-700 text-xs mt-1 leading-3">
                      • At least 8 characters long{'\n'}
                      • Include both letters and numbers
                    </Text>
                  </View>
                </View>
              </View>

              {/* Reset Button */}
              <TouchableOpacity
                onPress={handleResetPassword}
                disabled={isResetting}
                className={`bg-primary rounded-2xl py-5 mt-6 items-center justify-center ${isResetting ? 'opacity-70' : ''}`}
              >
                <Text className="text-white font-bold text-lg">
                  {isResetting ? 'Resetting...' : 'Change Password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default VerifyUser;
