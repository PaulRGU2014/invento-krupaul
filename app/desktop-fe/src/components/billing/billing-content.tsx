"use client";

import { useMemo, useState } from 'react';
import { getSessionToken } from '@/lib/inventory-api';

type Plan = {
  code: string;
  name: string;
  description: string;
  priceText: string;
  priceId: string;
  features: string[];
};

const envPrices = {
  starter: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || '',
  pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || '',
};

const bundlePlans: Plan[] = [
  {
    code: 'starter',
    name: 'Starter',
    description: 'Core inventory features.',
    priceText: '$19/mo',
    priceId: envPrices.starter,
    features: ['Inventory management'],
  },
  {
    code: 'pro',
    name: 'Pro',
    description: 'Everything plus analytics and feedback.',
    priceText: '$49/mo',
    priceId: envPrices.pro,
    features: ['Inventory', 'Analytics', 'Feedback'],
  },
];

export function BillingContent() {
  const [selectedPlan, setSelectedPlan] = useState<string>('starter');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const base = useMemo(() => bundlePlans.find((p) => p.code === selectedPlan), [selectedPlan]);

  const startCheckout = async () => {
    setError(null);
    setStatus(null);
    if (!base?.priceId) {
      setError('Base plan price ID is not configured. Set NEXT_PUBLIC_STRIPE_PRICE_* values.');
      return;
    }
    setLoading(true);
    try {
      const token = await getSessionToken();
      if (!token) throw new Error('Not authenticated');
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ priceId: base.priceId, addonPriceIds: [] }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.error || 'Checkout failed');
      }
      setStatus('redirecting');
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ marginBottom: 8 }}>Plans</h1>
      <p style={{ marginBottom: 24 }}>Select a base plan and optional addons.</p>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: 24 }}>
        {bundlePlans.map((plan) => (
          <button
            key={plan.code}
            onClick={() => setSelectedPlan(plan.code)}
            style={{
              textAlign: 'left',
              padding: 16,
              border: plan.code === selectedPlan ? '2px solid #2563eb' : '1px solid #d1d5db',
              borderRadius: 8,
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong>{plan.name}</strong>
              <span>{plan.priceText}</span>
            </div>
            <div style={{ color: '#4b5563', marginBottom: 8 }}>{plan.description}</div>
            <ul style={{ paddingLeft: 18, color: '#374151', margin: 0 }}>
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {error && (
        <div style={{ marginBottom: 12, color: '#b91c1c' }}>{error}</div>
      )}
      {status === 'redirecting' && (
        <div style={{ marginBottom: 12, color: '#2563eb' }}>Redirecting to Stripe…</div>
      )}

      <button
        onClick={startCheckout}
        disabled={loading}
        style={{
          padding: '12px 18px',
          background: '#2563eb',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: loading ? 'not-allowed' : 'pointer',
          minWidth: 180,
        }}
      >
        {loading ? 'Starting…' : 'Start checkout'}
      </button>
    </main>
  );
}
