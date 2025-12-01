# Database Migrations

This directory contains SQL migration files for the Supabase database.

## Running Migrations

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the content of each migration file (in order)
4. Click **Run** to execute

### Option 2: Using Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Migration Files

- `001_create_inventory_items.sql` - Creates the inventory_items table with RLS policies
- `002_seed_sample_data.sql` - (Optional) Adds sample data for testing

## Important Notes

- Migrations should be run in numerical order
- Row Level Security (RLS) is enabled to ensure users only access their own data
- The `updated_at` field is automatically updated via trigger
- All timestamps are stored with timezone information
