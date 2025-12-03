# Testing Supabase RLS and API flows

This guide helps validate RLS changes and application behavior for anonymous, authenticated, and multi-user scenarios, and measure performance.

## Prerequisites
- Supabase project configured with `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and server `SUPABASE_SERVICE_ROLE_KEY` (if used for privileged ops).
- Next.js app running locally on `http://localhost:3000`.
- A valid user JWT (via login) to test authenticated requests.

## Apply migrations
Using Supabase CLI, apply the latest migrations:

```bash
# From backend/supabase
supabase migration up
```

If local dev fails due to Docker not running, run migrations against your remote Supabase project instead:

```bash
# One-time setup
cd /home/surface-paul/works/invento-krupaul/backend/supabase
supabase login                                  # authenticate in browser
supabase link --project-ref <YOUR_PROJECT_REF>  # from Project Settings > Project ref

# Option A: apply to the linked remote project
# First link your project, then run:
supabase link --project-ref <YOUR_PROJECT_REF>
supabase migration up --linked

# Option B: apply to a specific remote DB URL
# Use percent-encoded connection string
supabase migration up --db-url postgresql://postgres:%3CPASSWORD%3E@db.<HOST>.supabase.co:5432/postgres
```

If you see failures, inspect logs:

```bash
# Show last migration status
supabase migration status

# Open Studio SQL editor and run the SQL from
# backend/supabase/migrations/003_update_rls_policies.sql
```

## Test scenarios

### 1) Anonymous user (no token)
Inventory API should return 401 and RLS blocks access.

```bash
curl -i http://localhost:3000/api/inventory
```

Expected: `401 Missing Bearer token`.

### 2) Authenticated user A
List and create items owned by user A.

```bash
# Replace <JWT_A> with a valid token for user A
curl -s -H "Authorization: Bearer <JWT_A>" \
  http://localhost:3000/api/inventory | jq

# Insert an item for user A
curl -s -X POST -H "Authorization: Bearer <JWT_A>" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Rice","category":"Food","quantity":10,
    "unit":"kg","minStock":2,"price":3.50,"supplier":"Local"
  }' \
  http://localhost:3000/api/inventory | jq
```

Expected: Items returned belong to user A; insert succeeds and returns the created record.

### 3) Authenticated user B (isolation)
User B should not see user A's items.

```bash
# Replace <JWT_B> with a valid token for user B
curl -s -H "Authorization: Bearer <JWT_B>" \
  http://localhost:3000/api/inventory | jq
```

Expected: Items list excludes user A's data.

### 4) Update and delete with RLS
Both operations require matching `user_id`; RLS blocks cross-user actions.

```bash
# Update an item (owned by user A)
curl -s -X PATCH -H "Authorization: Bearer <JWT_A>" \
  -H "Content-Type: application/json" \
  "http://localhost:3000/api/inventory?id=<ITEM_ID>" \
  -d '{"quantity":20}' | jq

# Delete the item
curl -s -X DELETE -H "Authorization: Bearer <JWT_A>" \
  "http://localhost:3000/api/inventory?id=<ITEM_ID>" | jq
```

Expected: Update and delete succeed for owner; fail/403 if attempted by another user.

## Performance checks
- Ensure index exists on `inventory_items(user_id)` (done in migration `003_update_rls_policies.sql`).
- For heavy queries, use Supabase logs and `EXPLAIN ANALYZE` in the SQL editor to evaluate RLS filter performance.
- Prefer server-side fetching for larger lists; paging is implemented via `page` and `pageSize` params.

## Notes on privileged operations
- Use `SUPABASE_SERVICE_ROLE_KEY` only from server code (API routes/Edge Functions); never expose it client-side.
- Privileged queries should bypass RLS and be limited to admin tasks.

## Troubleshooting
- Invalid token: Ensure you pass `Authorization: Bearer <JWT>` header.
- 401 Unauthorized: Re-login to obtain a fresh token.
- Migration failure: Run SQL directly in Studio; confirm policies exist or are dropped before recreation.
