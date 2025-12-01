import { supabase } from '../config/supabase';

async function main() {
  try {
    console.log('Checking inventory_items table exists...');
    const { data: existsRes, error: existsErr } = await supabase
      .rpc('pg_catalog.pg_get_userbyid', { usesysid: 10 });
    if (existsErr) {
      console.warn('RPC check failed (expected on limited anon key), continuing...');
    }

    const { data: sample, error } = await supabase
      .from('inventory_items')
      .select('id, name, category, quantity, unit, min_stock, price, supplier, updated_at')
      .limit(1);

    if (error) {
      throw error;
    }

    console.log('Connection OK. Table query succeeded. Example row:', sample?.[0] ?? null);
    console.log('Backend verify passed.');
    process.exit(0);
  } catch (err: any) {
    console.error('Backend verify failed:', err?.message ?? err);
    console.error('Ensure .env.local has SUPABASE_URL and SUPABASE_ANON_KEY, and RLS policies are applied.');
    process.exit(1);
  }
}

main();
