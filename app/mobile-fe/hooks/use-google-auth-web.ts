import { useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuthWeb() {
  const [isLoading, setIsLoading] = useState(false);
  
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');
  
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'mobilefe',
    path: 'redirect'
  });

  // Log the redirect URI for debugging
  console.log('Google OAuth Redirect URI:', redirectUri);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.IdToken,
    },
    discovery
  );

  const signIn = async () => {
    setIsLoading(true);
    try {
      const result = await promptAsync();
      
      if (result.type === 'success') {
        // Extract ID token from the response
        const idToken = result.params.id_token;
        console.log('Google sign-in successful:', result.params);
        
        // Decode the ID token to get user info
        const base64Url = idToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const userInfo = JSON.parse(atob(base64));
        
        return {
          idToken,
          user: {
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
          }
        };
      } else if (result.type === 'error') {
        throw new Error(result.error?.message || 'Authentication failed');
      }
      
      return null;
    } catch (error) {
      console.error('Google Auth Error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { signIn, isLoading, isReady: !!request };
}
