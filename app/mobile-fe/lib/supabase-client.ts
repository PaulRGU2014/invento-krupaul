import { createClient } from '@supabase/supabase-js';

// Expect these to be defined in app/mobile-fe/.env
// EXPO_PUBLIC_SUPABASE_URL
// EXPO_PUBLIC_SUPABASE_ANON_KEY

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase env vars missing: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(SUPABASE_URL ?? '', SUPABASE_ANON_KEY ?? '');

// Example helpers
export async function signInWithGoogle() {
  // For native/web, consider using `auth.signInWithOAuth` with appropriate redirect URL.
  // This is a placeholder; you may integrate it with your existing Google flow.
  const res = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/redirect` : undefined,
    },
  });
  return res;
}

export async function fetchInventoryDirect() {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}
