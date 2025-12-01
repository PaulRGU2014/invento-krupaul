import { NextRequest } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getSupabaseClient(token?: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  if (!url || !anon) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return createClient(url, anon, token
    ? { global: { headers: { Authorization: `Bearer ${token}` } } }
    : undefined as any);
}

async function getUserIdFromToken(token: string): Promise<string> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error('Unauthorized');
  return data.user.id;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get('page') || '1');
    const pageSize = Number(searchParams.get('pageSize') || '50');
    
    // Get access token from Authorization header: Bearer <token>
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length)
      : undefined;

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing Authorization Bearer token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = getSupabaseClient(token);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { count, error: countError } = await supabase
      .from('inventory_items')
      .select('*', { count: 'exact', head: true });
    if (countError) throw countError;

    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('updated_at', { ascending: false })
      .range(from, to);
    if (error) throw error;

    const items = (data || []).map((it: any) => ({
      id: it.id,
      name: it.name,
      category: it.category,
      quantity: it.quantity,
      unit: it.unit,
      minStock: it.min_stock,
      price: it.price,
      supplier: it.supplier || '',
      lastUpdated: it.updated_at,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: items,
        pagination: {
          page,
          pageSize,
          totalItems: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'Unexpected error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length)
      : undefined;
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'Missing Authorization Bearer token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    const userId = await getUserIdFromToken(token);
    const body = await req.json();
    const supabase = getSupabaseClient(token);
    const insert = {
      user_id: userId,
      name: body.name,
      category: body.category,
      quantity: body.quantity,
      unit: body.unit,
      min_stock: body.minStock,
      price: body.price,
      supplier: body.supplier ?? null,
    };
    const { data, error } = await supabase.from('inventory_items').insert(insert).select().single();
    if (error) throw error;
    const mapped = {
      id: data.id,
      name: data.name,
      category: data.category,
      quantity: data.quantity,
      unit: data.unit,
      minStock: data.min_stock,
      price: data.price,
      supplier: data.supplier || '',
      lastUpdated: data.updated_at,
    };
    return new Response(JSON.stringify({ success: true, data: mapped }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Unexpected error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'Missing id query parameter' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length)
      : undefined;
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'Missing Authorization Bearer token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    const body = await req.json();
    const supabase = getSupabaseClient(token);
    const update: any = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.category !== undefined) update.category = body.category;
    if (body.quantity !== undefined) update.quantity = body.quantity;
    if (body.unit !== undefined) update.unit = body.unit;
    if (body.minStock !== undefined) update.min_stock = body.minStock;
    if (body.price !== undefined) update.price = body.price;
    if (body.supplier !== undefined) update.supplier = body.supplier ?? null;
    const { data, error } = await supabase
      .from('inventory_items')
      .update(update)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    const mapped = {
      id: data.id,
      name: data.name,
      category: data.category,
      quantity: data.quantity,
      unit: data.unit,
      minStock: data.min_stock,
      price: data.price,
      supplier: data.supplier || '',
      lastUpdated: data.updated_at,
    };
    return new Response(JSON.stringify({ success: true, data: mapped }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Unexpected error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ success: false, error: 'Missing id query parameter' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring('Bearer '.length)
      : undefined;
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'Missing Authorization Bearer token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    const supabase = getSupabaseClient(token);
    const { error } = await supabase.from('inventory_items').delete().eq('id', id);
    if (error) throw error;
    return new Response(JSON.stringify({ success: true, message: 'Deleted' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Unexpected error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
