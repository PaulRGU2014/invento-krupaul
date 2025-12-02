import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/components/auth-context';

/**
 * Root gate / redirect logic for mobile.
 *
 * Behavior:
 * - While loading is true: show spinner only, do NOT call router.replace.
 * - When loading becomes false:
 *    - If authenticated === true -> router.replace('/(tabs)')
 *    - Else -> router.replace('/login')
 *
 * Ensure the redirect runs only once when loading transitions to false.
 */
export default function RootGate() {
  const { loading, authenticated } = useAuth();
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    // Wait until loading is finished.
    if (loading) return;
    // Only run redirect once.
    if (redirected.current) return;
    redirected.current = true;

    if (authenticated) {
      router.replace('/(tabs)');
    } else {
      router.replace('/login');
    }
  }, [loading, authenticated, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
