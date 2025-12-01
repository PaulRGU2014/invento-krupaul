import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

// Get this from your Facebook App dashboard
const FACEBOOK_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '';

const discovery = {
  authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
  tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
};

export function useFacebookAuth() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: FACEBOOK_APP_ID,
      scopes: ['public_profile', 'email'],
      redirectUri: makeRedirectUri({
        scheme: 'mobilefe',
        path: 'auth/callback',
      }),
      responseType: 'token',
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { access_token } = response.params;
      // Handle the access token - you can fetch user data from Facebook Graph API
      // then either create an account or link with your backend
      console.log('Facebook access token:', access_token);
    }
  }, [response]);

  return {
    request,
    promptAsync,
    response,
  };
}
