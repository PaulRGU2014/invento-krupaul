import { createClient } from '@supabase/supabase-js';

export async function getSessionToken() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

export async function fetchInventory(page = 1, pageSize = 50) {
  const token = await getSessionToken();
  const res = await fetch(`/api/inventory?page=${page}&pageSize=${pageSize}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.json();
}

export async function createInventoryItem(body: any) {
  const token = await getSessionToken();
  const res = await fetch('/api/inventory', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function updateInventoryItem(id: string, body: any) {
  const token = await getSessionToken();
  const res = await fetch(`/api/inventory?id=${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function deleteInventoryItem(id: string) {
  const token = await getSessionToken();
  const res = await fetch(`/api/inventory?id=${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.json();
}
