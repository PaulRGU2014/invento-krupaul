# Invento Backend

Backend API for the Invento inventory management system using Supabase.

## Features

- ✅ Supabase integration for database and authentication
- ✅ TypeScript support
- ✅ Row Level Security (RLS) for data isolation
- ✅ CRUD operations for inventory items
- ✅ User authentication functions
- ✅ Pagination support
- ✅ Low stock alerts
- ✅ Category filtering and search

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Supabase

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Fill in your Supabase credentials in `.env`:
   - `SUPABASE_URL`: Your project URL (found in Project Settings > API)
   - `SUPABASE_ANON_KEY`: Your anon/public key (found in Project Settings > API)
   - `SUPABASE_SERVICE_KEY`: (Optional) Your service role key for admin operations

### 3. Run Database Migrations

Go to your Supabase dashboard:
1. Navigate to **SQL Editor**
2. Run the migrations in order:
   - Copy content from `db/migrations/001_create_inventory_items.sql`
   - Click **Run** to execute
   - (Optional) Run `002_seed_sample_data.sql` for test data

See `db/README.md` for detailed migration instructions.

### 4. Enable Google OAuth (if using)

In your Supabase dashboard:
1. Go to **Authentication > Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials from Google Cloud Console
4. Add authorized redirect URLs:
   - `https://your-project.supabase.co/auth/v1/callback`

## Usage

### Import Functions

```typescript
import {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getLowStockItems,
  searchItems,
} from './functions/inventory';

import {
  authenticateUser,
  signInWithEmail,
  signUpWithEmail,
  signOut,
} from './functions/auth';
```

### Example: Get All Items

```typescript
const userId = 'user-uuid-here';
const result = await getAllItems(userId, 1, 50);

if (result.success) {
  console.log('Items:', result.data);
  console.log('Total:', result.pagination.totalItems);
} else {
  console.error('Error:', result.error);
}
```

### Example: Create Item

```typescript
const newItem = {
  name: 'Laptop',
  category: 'Electronics',
  quantity: 10,
  unit: 'pcs',
  minStock: 5,
  price: 999.99,
  supplier: 'TechCorp',
};

const result = await createItem(userId, newItem);

if (result.success) {
  console.log('Created:', result.data);
} else {
  console.error('Error:', result.error);
}
```

## API Functions

### Inventory Functions

- `getAllItems(userId, page?, pageSize?)` - Get paginated list of items
- `getItemById(userId, itemId)` - Get single item by ID
- `createItem(userId, input)` - Create new inventory item
- `updateItem(userId, itemId, input)` - Update existing item
- `deleteItem(userId, itemId)` - Delete item
- `getItemsByCategory(userId, category)` - Filter items by category
- `getLowStockItems(userId)` - Get items with low stock
- `searchItems(userId, searchTerm)` - Search items by name

### Auth Functions

- `authenticateUser(accessToken)` - Verify user token and get user ID
- `signInWithEmail(email, password)` - Sign in with email/password
- `signUpWithEmail(email, password, metadata?)` - Create new account
- `signOut()` - Sign out current user

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Build TypeScript
npm run build

# Run compiled JavaScript
npm start

# Run tests
npm test
```

## Integration with Frontend

### Desktop (Next.js)

Update your Next.js API routes to use these backend functions:

```typescript
// app/api/inventory/route.ts
import { getAllItems } from '@/backend/functions/inventory';

export async function GET(request: Request) {
  const userId = await getUserIdFromSession(request);
  const result = await getAllItems(userId);
  return Response.json(result);
}
```

### Mobile (React Native)

Use Supabase client directly in your mobile app:

```typescript
import { supabase } from './config/supabase';

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// Fetch items
const { data: items } = await supabase
  .from('inventory_items')
  .select('*')
  .eq('user_id', userId);
```

## Database Schema

### inventory_items

| Column      | Type      | Description                    |
|-------------|-----------|--------------------------------|
| id          | UUID      | Primary key                    |
| user_id     | UUID      | Foreign key to auth.users      |
| name        | VARCHAR   | Item name                      |
| category    | VARCHAR   | Item category                  |
| quantity    | INTEGER   | Current stock quantity         |
| unit        | VARCHAR   | Unit of measurement            |
| min_stock   | INTEGER   | Minimum stock level            |
| price       | DECIMAL   | Item price                     |
| supplier    | VARCHAR   | Supplier name                  |
| created_at  | TIMESTAMP | Creation timestamp             |
| updated_at  | TIMESTAMP | Last update timestamp          |

## Security

- **Row Level Security (RLS)** is enabled on all tables
- Users can only access their own inventory items
- Authentication required for all operations
- Supabase handles token validation automatically

## Next Steps

1. ✅ Set up Supabase account and project
2. ✅ Configure environment variables
3. ✅ Run database migrations
4. ⬜ Integrate with frontend applications
5. ⬜ Set up authentication in frontend
6. ⬜ Deploy to production

## Support

For issues or questions, refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
