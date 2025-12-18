import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const successUrl = process.env.STRIPE_SUCCESS_URL || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/billing?status=success`;
const cancelUrl = process.env.STRIPE_CANCEL_URL || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/billing?status=cancel`;

if (!stripeSecret) {
  console.warn('STRIPE_SECRET_KEY is not set; checkout route will fail until configured.');
}

const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: '2024-06-20' })
  : null;

function getSupabaseClient(token?: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  if (!url || !anon) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return createClient(url, anon, token
    ? { global: { headers: { Authorization: `Bearer ${token}` } } }
    : undefined);
}

async function getUserIdFromToken(token: string): Promise<string> {
  const supabase = getSupabaseClient(token);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Unauthorized');
  return data.user.id;
}

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return new Response(
        JSON.stringify({ success: false, error: 'Stripe not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length)
      : undefined;

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing Bearer token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = await getUserIdFromToken(token);
    const body = await req.json().catch(() => null) as Partial<{ priceId: string; addonPriceIds: string[]; quantity: number }>;
    const priceId = body?.priceId;
    const addonPriceIds = Array.isArray(body?.addonPriceIds) ? body?.addonPriceIds : [];
    const quantity = body?.quantity && body.quantity > 0 ? body.quantity : 1;

    if (!priceId) {
      return new Response(
        JSON.stringify({ success: false, error: 'priceId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: priceId, quantity },
      ...addonPriceIds.map((p) => ({ price: p, quantity: 1 })),
    ];

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: lineItems,
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId,
      },
    });

    if (!session.url) {
      throw new Error('Stripe did not return a session URL');
    }

    return new Response(
      JSON.stringify({ success: true, url: session.url }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Unexpected error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
