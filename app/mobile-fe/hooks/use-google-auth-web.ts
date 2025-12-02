import { useState } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuthWeb() {
  const [isLoading, setIsLoading] = useState(false);
  
  // Cast to any to satisfy TypeScript for Expo AuthSession discovery typings in this project setup.
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com') as any;
  
  // For web, use origin-based redirect URI. Ensure this exact URI is
  // added to Google Cloud OAuth client's Authorized redirect URIs.
  const redirectUri = AuthSession.makeRedirectUri({
    path: 'redirect'
  });

  // Log the redirect URI for debugging
  console.log('Google OAuth Redirect URI:', redirectUri);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      // Use Authorization Code flow with PKCE (recommended).
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    discovery
  );

  const signIn = async () => {
    setIsLoading(true);
    try {
      const result = await promptAsync();

      if (result.type === 'success') {
        // Exchange authorization code for tokens via PKCE (no client secret needed).
        const tokens = await AuthSession.exchangeCodeAsync(
          {
            code: result.params.code as string,
            clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
            redirectUri,
          },
          discovery
        );

        const idToken = tokens.idToken as string | undefined;
        const accessToken = tokens.accessToken as string | undefined;

        let user: { email?: string; name?: string; picture?: string } = {};
        if (idToken) {
          const base64Url = idToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const userInfo = JSON.parse(atob(base64));
          user = {
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
          };
        }

        return {
          idToken,
          accessToken,
          user,
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
