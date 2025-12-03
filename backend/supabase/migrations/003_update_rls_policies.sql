-- Migration: Update RLS policies to use SELECT-wrapped calls
-- Description: Replace direct auth.uid() with (SELECT auth.uid()) and ensure indexes
-- Created: 2025-12-03

-- Safety: only update policies if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'inventory_items'
  ) THEN
    -- Drop existing policies if present, then recreate with SELECT-wrapped calls
    IF EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inventory_items' AND policyname='Users can view own inventory items'
    ) THEN
      EXECUTE 'DROP POLICY "Users can view own inventory items" ON public.inventory_items';
    END IF;
    IF EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inventory_items' AND policyname='Users can insert own inventory items'
    ) THEN
      EXECUTE 'DROP POLICY "Users can insert own inventory items" ON public.inventory_items';
    END IF;
    IF EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inventory_items' AND policyname='Users can update own inventory items'
    ) THEN
      EXECUTE 'DROP POLICY "Users can update own inventory items" ON public.inventory_items';
    END IF;
    IF EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inventory_items' AND policyname='Users can delete own inventory items'
    ) THEN
      EXECUTE 'DROP POLICY "Users can delete own inventory items" ON public.inventory_items';
    END IF;

    -- Recreate policies using SELECT-wrapped auth.uid()
    EXECUTE $$
      CREATE POLICY "Users can view own inventory items"
        ON public.inventory_items
        FOR SELECT
        USING ((SELECT auth.uid()) = user_id)
    $$;

    EXECUTE $$
      CREATE POLICY "Users can insert own inventory items"
        ON public.inventory_items
        FOR INSERT
        WITH CHECK ((SELECT auth.uid()) = user_id)
    $$;

    EXECUTE $$
      CREATE POLICY "Users can update own inventory items"
        ON public.inventory_items
        FOR UPDATE
        USING ((SELECT auth.uid()) = user_id)
        WITH CHECK ((SELECT auth.uid()) = user_id)
    $$;

    EXECUTE $$
      CREATE POLICY "Users can delete own inventory items"
        ON public.inventory_items
        FOR DELETE
        USING ((SELECT auth.uid()) = user_id)
    $$;

    -- Ensure index on policy column user_id exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = 'idx_inventory_items_user_id' AND n.nspname = 'public'
    ) THEN
      EXECUTE 'CREATE INDEX idx_inventory_items_user_id ON public.inventory_items(user_id)';
    END IF;
  END IF;
END $$;
