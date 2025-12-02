/**
 * Mobile inventory API wrappers
 *
 * This file exposes top-level async functions that match the desktop signatures:
 *  - fetchInventory(page?, pageSize?)
 *  - createInventoryItem(payload)
 *  - updateInventoryItem(id, payload)
 *  - deleteInventoryItem(id)
 *
 * Preferred implementation: Option A — HTTP wrappers that call the backend routes
 * used by the desktop app. Authorization header is added using the access token
 * from supabase.auth.getSession().
 *
 * Minimal inline JSDoc is provided. Errors are caught and returned as:
 * { success: false, error: string }
 */

import { InventoryItem } from '../types/inventory';
import { supabase } from './supabase-client';
import { useAuth } from '@/components/auth-context';

/**
 * Get API base from EXPO_PUBLIC_API_BASE_URL. Prefer a global/expo var if provided,
 * otherwise fallback to process.env.
 */
const API_BASE =
  // @ts-ignore - some environments inject EXPO_PUBLIC_API_BASE_URL onto globalThis
  (globalThis as any).EXPO_PUBLIC_API_BASE_URL ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'http://localhost:3000';

/** Helper: retrieve access token from Supabase session */
async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return (data as any)?.session?.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch inventory via backend HTTP endpoint.
 * Matches desktop signature and returns { success, data?, error? }.
 */
export async function fetchInventory(
  page = 1,
  pageSize = 50
): Promise<{ success: boolean; data?: InventoryItem[]; error?: string }> {
  try {
    const token = await getAccessToken();
    const url = `${API_BASE.replace(/\/$/, '')}/api/inventory?page=${encodeURIComponent(
      page
    )}&pageSize=${encodeURIComponent(pageSize)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json?.error ?? res.statusText };
    }
    // Expect desktop API to return shape { success: true, data: [...] }
    return json;
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) };
  }
}

/**
 * Create inventory item via backend HTTP endpoint.
 */
export async function createInventoryItem(
  payload: any
): Promise<{ success: boolean; data?: InventoryItem; error?: string }> {
  try {
    const token = await getAccessToken();
    const url = `${API_BASE.replace(/\/$/, '')}/api/inventory`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json?.error ?? res.statusText };
    }
    return json;
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) };
  }
}

/**
 * Update inventory item via backend HTTP endpoint.
 */
export async function updateInventoryItem(
  id: string,
  payload: any
): Promise<{ success: boolean; data?: InventoryItem; error?: string }> {
  try {
    const token = await getAccessToken();
    const url = `${API_BASE.replace(/\/$/, '')}/api/inventory?id=${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json?.error ?? res.statusText };
    }
    return json;
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) };
  }
}

/**
 * Delete inventory item via backend HTTP endpoint.
 */
export async function deleteInventoryItem(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getAccessToken();
    const url = `${API_BASE.replace(/\/$/, '')}/api/inventory?id=${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json?.error ?? res.statusText };
    }
    return json;
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) };
  }
}

/*
 * Preserve the existing hook-style helper for parts of the mobile app that used it.
 * It continues to use Supabase client directly (Option B) and returns the same shapes.
 */
export function useInventoryApi() {
  const { user } = useAuth();

  async function requireUserId() {
    // Prefer Supabase auth session for RLS policies
    const { data } = await supabase.auth.getUser();
    const uid = data.user?.id;
    const effectiveUserId = uid || user?.id;
    if (!effectiveUserId) throw new Error('Not authenticated');
    return effectiveUserId;
  }

  async function fetchInventoryHook(page: number = 1, pageSize: number = 50) {
    try {
      const userId = await requireUserId();
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { success: true, data: (data as any as InventoryItem[]) ?? [] };
    } catch (err: any) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }

  async function createInventoryItemHook(body: Omit<InventoryItem, 'id' | 'lastUpdated'>) {
    try {
      const userId = await requireUserId();
      const insertBody: any = { ...body, user_id: userId };
      const { data, error } = await supabase
        .from('inventory_items')
        .insert(insertBody)
        .select('*')
        .single();
      if (error) throw error;
      return { success: true, data: data as any as InventoryItem };
    } catch (err: any) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }

  async function updateInventoryItemHook(id: string, body: Partial<Omit<InventoryItem, 'id' | 'lastUpdated'>>) {
    try {
      const userId = await requireUserId();
      const { data, error } = await supabase
        .from('inventory_items')
        .update(body as any)
        .eq('id', id)
        .eq('user_id', userId)
        .select('*')
        .single();
      if (error) throw error;
      return { success: true, data: data as any as InventoryItem };
    } catch (err: any) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }

  async function deleteInventoryItemHook(id: string) {
    try {
      const userId = await requireUserId();
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }

  return {
    fetchInventory: fetchInventoryHook,
    createInventoryItem: createInventoryItemHook,
    updateInventoryItem: updateInventoryItemHook,
    deleteInventoryItem: deleteInventoryItemHook,
  };
}
