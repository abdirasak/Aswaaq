import * as Linking from 'expo-linking';
import { account } from './appwrite';

/**
 * Request password recovery email.
 * Uses expo-linking to generate a correct redirect URL for both dev build and production.
 */
export async function requestPasswordRecovery(email: string) {
  const appUrl = Linking.createURL('reset-password');
  const webBase = process.env.EXPO_PUBLIC_RECOVERY_REDIRECT_BASE;
  
  // If we have a web base, we send the user to the web redirect page
  // We pass the 'real' app URL as a 'redirect' param so the web page knows where to send them back
  const redirectUrl = webBase 
    ? `${webBase.replace(/\/$/, '')}/reset-password?appUrl=${encodeURIComponent(appUrl)}` 
    : appUrl;
  
  console.log('[AuthRecovery] App URL:', appUrl);
  console.log('[AuthRecovery] Generated redirect URL:', redirectUrl);
  console.log('[AuthRecovery] Requesting recovery for:', email);

  try {
    await account.createRecovery(email, redirectUrl);
    return true;
  } catch (error: any) {
    console.error('[AuthRecovery] Create recovery error:', error);
    throw error;
  }
}

/**
 * Complete password recovery using tokens from the deep link.
 */
export async function completePasswordRecovery(userId: string, secret: string, newPassword: string) {
  console.log('[AuthRecovery] Completing recovery for userId:', userId);
  
  try {
    // react-native-appwrite signature: updateRecovery(userId, secret, password)
    await account.updateRecovery(userId, secret, newPassword);
    return true;
  } catch (error: any) {
    console.error('[AuthRecovery] Update recovery error:', error);
    throw error;
  }
}
