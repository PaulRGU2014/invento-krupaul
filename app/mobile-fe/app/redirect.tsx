import { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase-client';

/**
 * Redirect handler for OAuth flows.
 * Handles both:
 *  - Authorization Code flow (params.code) -> exchangeCodeForSession(...)
 *  - Implicit/token flow (access_token in URL fragment) -> supabase.auth.setSession(...)
 *
 * Also logs incoming params to help debug web redirect issues.
 */
export default function Redirect() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function completeOAuth() {
      try {
        // Log incoming params for debugging (visible in browser console / metro logs)
        // eslint-disable-next-line no-console
        console.log('OAuth redirect params (query):', params);

        // Parse hash fragment on web (e.g., access_token in window.location.hash)
        let hashParams: Record<string, string> = {};
        if (typeof window !== 'undefined' && window.location?.hash) {
          const hash = window.location.hash.replace(/^#/, '');
          hash.split('&').forEach(pair => {
            const [k, v] = pair.split('=');
            if (k) {
              hashParams[k] = decodeURIComponent(v || '');
            }
          });
          // eslint-disable-next-line no-console
          console.log('OAuth redirect params (hash):', hashParams);
        }

        // Merge search params and hash params (hash wins)
        const merged = { ...(params as Record<string, any>), ...hashParams };

        const code = (merged?.code as string) || undefined;
        const accessToken = (merged?.access_token as string) || undefined;
        const refreshToken = (merged?.refresh_token as string) || undefined;
        const errorParam = (merged?.error as string) || undefined;

        if (errorParam) {
          setError(errorParam);
          return;
        }

        // If access token present (implicit flow), set session client-side
        if (accessToken) {
          if (refreshToken) {
            const { error: setErrorResp } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (setErrorResp) throw setErrorResp;
          } else {
            // setSession typing may require both tokens; call as any when refresh token missing
            const { error: setErrorResp } = await (supabase.auth as any).setSession({
              access_token: accessToken,
            });
            if (setErrorResp) throw setErrorResp;
          }
          router.replace('/(tabs)');
          return;
        }

        // Authorization code flow
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (data?.session) {
            router.replace('/(tabs)');
            return;
          } else {
            setError('No session returned from code exchange');
            return;
          }
        }

        setError('Missing authorization code or access token in redirect');
      } catch (e: any) {
        setError(e?.message || 'OAuth completion failed');
      }
    }

    completeOAuth();
  }, [params, router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      {error ? (
        <Text style={{ color: '#b91c1c' }}>Login error: {error}</Text>
      ) : (
        <>
          <ActivityIndicator />
          <Text>Completing sign-in...</Text>
        </>
      )}
    </View>
  );
}
