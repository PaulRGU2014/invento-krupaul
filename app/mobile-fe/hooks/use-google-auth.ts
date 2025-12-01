import { useState, useEffect } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useAuth } from '@/components/auth-context';

export function useGoogleAuth() {
  const [isConfigured, setIsConfigured] = useState(false);
  const { login } = useAuth();

  useEffect(() => {
    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, // Optional, only if different
      offlineAccess: true,
    });
    setIsConfigured(true);
  }, []);

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      // Here you would typically send the Google token to your backend
      // For now, we'll just log in with a placeholder
      console.log('Google user:', userInfo);
      
      // TODO: Send Google ID token to your backend for verification
      // const idToken = userInfo.idToken;
      // await yourBackendAPI.verifyGoogleToken(idToken);
      
      return userInfo;
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  };

  return { signIn, isConfigured };
}
