import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!stripeSecret) {
  console.warn('STRIPE_SECRET_KEY is not set; webhook route will fail until configured.');
}
if (!webhookSecret) {
  console.warn('STRIPE_WEBHOOK_SECRET is not set; webhook route will fail until configured.');
}
if (!serviceRoleKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set; webhook route cannot upsert subscriptions.');
}

const stripe = stripeSecret
  ? new Stripe(stripeSecret, { apiVersion: '2024-06-20' })
  : null;

function getAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role client not configured');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type StripeSubscription = Stripe.Subscription & { items: { data: Stripe.SubscriptionItem[] } };

type PlanLookup = {
  planId: string;
  isBundle: boolean;
};

function mapStripeStatus(status: string): 'active' | 'past_due' | 'canceled' {
  if (status === 'active' || status === 'trialing') return 'active';
  if (status === 'past_due' || status === 'unpaid' || status === 'incomplete') return 'past_due';
  return 'canceled';
}

async function resolvePlansByPrice(admin: ReturnType<typeof getAdminClient>, priceIds: string[]): Promise<Record<string, PlanLookup>> {
  if (!priceIds.length) return {};
  const { data, error } = await admin
    .from('plans')
    .select('id, is_bundle, stripe_price_id')
    .in('stripe_price_id', priceIds);
  if (error) throw error;
  const map: Record<string, PlanLookup> = {};
  for (const row of data || []) {
    map[row.stripe_price_id as string] = { planId: row.id as string, isBundle: !!row.is_bundle };
  }
  return map;
}

async function upsertSubscription(admin: ReturnType<typeof getAdminClient>, userId: string, planId: string, status: 'active' | 'past_due' | 'canceled', currentPeriodEnd: number) {
  const { data: existing } = await admin
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('plan_id', planId)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await admin
      .from('subscriptions')
      .update({ status, current_period_end: new Date(currentPeriodEnd * 1000).toISOString() })
      .eq('id', existing.id);
    if (error) throw error;
    return existing.id as string;
  }

  const { data, error } = await admin
    .from('subscriptions')
    .insert({ user_id: userId, plan_id: planId, status, current_period_end: new Date(currentPeriodEnd * 1000).toISOString() })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

async function replaceAddons(admin: ReturnType<typeof getAdminClient>, subscriptionId: string, addonPlanIds: string[]) {
  const { error: delError } = await admin
    .from('subscription_addons')
    .delete()
    .eq('subscription_id', subscriptionId);
  if (delError) throw delError;

  if (!addonPlanIds.length) return;

  const rows = addonPlanIds.map((id) => ({
    subscription_id: subscriptionId,
    addon_plan_id: id,
    status: 'active',
  }));
  const { error } = await admin.from('subscription_addons').insert(rows);
  if (error) throw error;
}

async function handleStripeSubscription(userId: string, subscriptionId: string) {
  if (!stripe) throw new Error('Stripe not configured');
  const admin = getAdminClient();

  const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items.data.price'] }) as StripeSubscription;
  const status = mapStripeStatus(sub.status);
  const currentPeriodEnd = sub.current_period_end;
  const priceIds = sub.items.data.map((item) => item.price?.id).filter((p): p is string => !!p);
  const plansByPrice = await resolvePlansByPrice(admin, priceIds);

  const bundlePlanIds: string[] = [];
  const addonPlanIds: string[] = [];
  for (const item of sub.items.data) {
    const pid = item.price?.id;
    if (!pid) continue;
    const match = plansByPrice[pid];
    if (!match) continue;
    if (match.isBundle) bundlePlanIds.push(match.planId);
    else addonPlanIds.push(match.planId);
  }

  const bundlePlanId = bundlePlanIds[0];
  if (!bundlePlanId) {
    throw new Error('No bundle plan found for subscription');
  }

  const subscriptionRowId = await upsertSubscription(admin, userId, bundlePlanId, status, currentPeriodEnd);
  await replaceAddons(admin, subscriptionRowId, addonPlanIds);
}

export async function POST(req: NextRequest) {
  try {
    if (!stripe || !webhookSecret) {
      return new Response('Stripe not configured', { status: 500 });
    }

    const hdrs = await headers();
    const sig = hdrs.get('stripe-signature');
    if (!sig) return new Response('Missing signature', { status: 400 });

    const body = await req.text();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid signature';
      return new Response(message, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const subId = session.subscription as string | undefined;
      if (userId && subId) {
        await handleStripeSubscription(userId, subId);
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      type SubDetails = { metadata?: Record<string, string> } | null | undefined;
      const subDetails = invoice.subscription_details as SubDetails;
      const userId = invoice.metadata?.['user_id'] ?? subDetails?.metadata?.['user_id'];
      const subId = invoice.subscription as string | undefined;
      if (userId && subId) {
        await handleStripeSubscription(userId, subId);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      if (userId) {
        const admin = getAdminClient();
        const priceIds = subscription.items.data.map((it) => it.price?.id).filter((p): p is string => !!p);
        const plansByPrice = await resolvePlansByPrice(admin, priceIds);
        const bundle = subscription.items.data.find((it) => {
          const pid = it.price?.id;
          return pid && plansByPrice[pid]?.isBundle;
        });
        const bundlePlanId = bundle && bundle.price?.id ? plansByPrice[bundle.price.id].planId : undefined;
        if (bundlePlanId) {
          const { data: existing } = await admin
            .from('subscriptions')
            .select('id')
            .eq('user_id', userId)
            .eq('plan_id', bundlePlanId)
            .maybeSingle();
          if (existing?.id) {
            await admin
              .from('subscriptions')
              .update({ status: 'canceled' })
              .eq('id', existing.id);
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return new Response(message, { status: 500 });
  }
}
