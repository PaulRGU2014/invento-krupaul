import { NextRequest } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getSupabaseClient(token?: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  if (!url || !anon) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return createClient(
    url,
    anon,
    token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : undefined
  );
}

async function requireUserId(token?: string) {
  if (!token) {
    throw new Error('Missing Bearer token');
  }
  const supabase = getSupabaseClient(token);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('Unauthorized');
  }
  return data.user.id;
}

const UPC_API_BASE = process.env.UPC_DATABASE_API_BASE || 'https://api.upcdatabase.org/product';

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.UPC_DATABASE_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'UPC_DATABASE_API_KEY is not set on the server.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { searchParams } = new URL(req.url);
    const upc = searchParams.get('upc');
    if (!upc) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing upc query parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length)
      : undefined;

    // Validate caller has a Supabase session; we only use the user id for gating access.
    await requireUserId(token).catch(() => {
      throw new Error('Unauthorized');
    });

    const upstreamUrl = `${UPC_API_BASE.replace(/\/$/, '')}/${encodeURIComponent(upc)}/${apiKey}`;
    const upstreamRes = await fetch(upstreamUrl, {
      headers: { Accept: 'application/json' },
      // Avoid caching barcode lookups; we want fresh upstream data.
      cache: 'no-store',
    });

    if (!upstreamRes.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `UPC lookup failed with status ${upstreamRes.status}` }),
        { status: upstreamRes.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const payload = await upstreamRes.json();
    const statusField = String(payload?.status || payload?.code || '').toLowerCase();
    const failedStatus = statusField.includes('invalid') || statusField.includes('error');
    if (payload?.success === false || payload?.valid === false || failedStatus) {
      return new Response(
        JSON.stringify({ success: false, error: 'UPC not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const mapped = {
      upc,
      name: payload?.title || payload?.itemname || payload?.description || payload?.product || undefined,
      category: payload?.category || payload?.department || payload?.description || undefined,
      brand: payload?.brand || payload?.manufacturer || payload?.company || undefined,
      image: payload?.imageurl || payload?.image || undefined,
    };

    return new Response(
      JSON.stringify({ success: true, data: mapped }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    console.error('UPC lookup failed', err);
    const message = err instanceof Error && err.message === 'Unauthorized' ? 'Unauthorized' : 'Unexpected server error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
