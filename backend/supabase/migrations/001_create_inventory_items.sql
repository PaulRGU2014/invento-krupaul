-- Copied from backend/db/migrations/001_create_inventory_items.sql
-- Keep this in sync with DB migrations and push via CLI

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL,
  min_stock INTEGER NOT NULL DEFAULT 0,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  supplier VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_user_id ON inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON inventory_items;
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-pushing
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inventory_items' AND policyname='Users can view own inventory items'
  ) THEN
    EXECUTE 'DROP POLICY "Users can view own inventory items" ON inventory_items';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inventory_items' AND policyname='Users can insert own inventory items'
  ) THEN
    EXECUTE 'DROP POLICY "Users can insert own inventory items" ON inventory_items';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inventory_items' AND policyname='Users can update own inventory items'
  ) THEN
    EXECUTE 'DROP POLICY "Users can update own inventory items" ON inventory_items';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inventory_items' AND policyname='Users can delete own inventory items'
  ) THEN
    EXECUTE 'DROP POLICY "Users can delete own inventory items" ON inventory_items';
  END IF;
END$$;

CREATE POLICY "Users can view own inventory items"
  ON inventory_items
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory items"
  ON inventory_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory items"
  ON inventory_items
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory items"
  ON inventory_items
  FOR DELETE
  USING (auth.uid() = user_id);
