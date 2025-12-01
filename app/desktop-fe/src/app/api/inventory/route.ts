import { NextRequest } from 'next/server';
import { getAllItems, createItem, updateItem, deleteItem } from '../../../../backend/functions/inventory';
import { authenticateUser } from '../../../../backend/functions/auth';

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

    const authRes = await authenticateUser(token);
    if (!authRes.success || !authRes.userId) {
      return new Response(
        JSON.stringify({ success: false, error: authRes.error || 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await getAllItems(authRes.userId, page, pageSize);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
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
    const authRes = await authenticateUser(token);
    if (!authRes.success || !authRes.userId) {
      return new Response(JSON.stringify({ success: false, error: authRes.error || 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    const body = await req.json();
    const result = await createItem(authRes.userId, body);
    return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers: { 'Content-Type': 'application/json' } });
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
    const authRes = await authenticateUser(token);
    if (!authRes.success || !authRes.userId) {
      return new Response(JSON.stringify({ success: false, error: authRes.error || 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    const body = await req.json();
    const result = await updateItem(authRes.userId, id, body);
    return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers: { 'Content-Type': 'application/json' } });
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
    const authRes = await authenticateUser(token);
    if (!authRes.success || !authRes.userId) {
      return new Response(JSON.stringify({ success: false, error: authRes.error || 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    const result = await deleteItem(authRes.userId, id);
    return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Unexpected error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
