"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSessionToken } from './inventory-api';

type Entitlements = Record<string, number | null>;

type EntitlementsState = {
  entitlements: Entitlements;
  isLoading: boolean;
  error?: string;
  can: (productCode: string) => boolean;
  quotaFor: (productCode: string) => number | null | undefined;
  reload: () => void;
};

export function useEntitlements(): EntitlementsState {
  const [entitlements, setEntitlements] = useState<Entitlements>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        setIsLoading(true);
        const token = await getSessionToken();
        if (!token) {
          throw new Error('Not authenticated');
        }

        const res = await fetch('/api/billing/entitlements', {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` },
        });

        const json = await res.json().catch(() => ({ success: false, error: 'Invalid JSON' }));
        if (!res.ok || json.success === false) {
          throw new Error(json.error || 'Failed to load entitlements');
        }
        setEntitlements(json.entitlements || {});
        setError(undefined);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setEntitlements({});
        setError(err instanceof Error ? err.message : 'Unexpected error');
      } finally {
        setIsLoading(false);
      }
    };

    void load();

    return () => controller.abort();
  }, [refreshKey]);

  const can = useCallback((productCode: string) => {
    const quota = entitlements[productCode];
    if (quota === null || quota === undefined) return true;
    return quota > 0;
  }, [entitlements]);

  const quotaFor = useCallback((productCode: string) => entitlements[productCode], [entitlements]);

  const reload = useCallback(() => setRefreshKey((key) => key + 1), []);

  return useMemo(() => ({ entitlements, isLoading, error, can, quotaFor, reload }), [entitlements, isLoading, error, can, quotaFor, reload]);
}
