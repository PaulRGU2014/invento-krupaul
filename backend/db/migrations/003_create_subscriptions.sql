-- Migration: Add subscriptions and entitlements schema
-- Description: Plans, plan items, subscriptions, addons, usage tracking, entitlements view, and RPC
-- Created: 2025-12-17

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  billing_interval TEXT NOT NULL CHECK (billing_interval IN ('month', 'year')),
  is_bundle BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_price_id TEXT
);

CREATE TABLE IF NOT EXISTS plan_items (
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quota INTEGER,
  PRIMARY KEY (plan_id, product_id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled')),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  addon_plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usage_records (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_plans_code ON plans(code);
CREATE INDEX IF NOT EXISTS idx_plans_is_bundle ON plans(is_bundle);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_addons_subscription_id ON subscription_addons(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_addons_status ON subscription_addons(status);
CREATE INDEX IF NOT EXISTS idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_product_id ON usage_records(product_id);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read products"
  ON products
  FOR SELECT
  USING (true);

CREATE POLICY "Public read plans"
  ON plans
  FOR SELECT
  USING (true);

CREATE POLICY "Public read plan items"
  ON plan_items
  FOR SELECT
  USING (true);

CREATE POLICY "Users can select own subscriptions"
  ON subscriptions
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own subscriptions"
  ON subscriptions
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can select own subscription addons"
  ON subscription_addons
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.id = subscription_id AND s.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can insert own subscription addons"
  ON subscription_addons
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.id = subscription_id AND s.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can update own subscription addons"
  ON subscription_addons
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.id = subscription_id AND s.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.id = subscription_id AND s.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can delete own subscription addons"
  ON subscription_addons
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.id = subscription_id AND s.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can select own usage records"
  ON usage_records
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own usage records"
  ON usage_records
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own usage records"
  ON usage_records
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own usage records"
  ON usage_records
  FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

CREATE OR REPLACE VIEW entitlements_view AS
SELECT
  combined.user_id,
  combined.product_id,
  CASE
    WHEN bool_or(combined.quota IS NULL) THEN NULL
    ELSE SUM(combined.quota)
  END AS quota
FROM (
  SELECT s.user_id, pi.product_id, pi.quota
  FROM subscriptions s
  JOIN plan_items pi ON pi.plan_id = s.plan_id
  WHERE s.status = 'active'
  UNION ALL
  SELECT s.user_id, pi.product_id, pi.quota
  FROM subscription_addons sa
  JOIN subscriptions s ON s.id = sa.subscription_id
  JOIN plan_items pi ON pi.plan_id = sa.addon_plan_id
  WHERE sa.status = 'active' AND s.status = 'active'
) AS combined
GROUP BY combined.user_id, combined.product_id;

CREATE OR REPLACE FUNCTION get_entitlements(p_user UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(jsonb_object_agg(prod.code, ev.quota), '{}'::jsonb)
  FROM entitlements_view ev
  JOIN products prod ON prod.id = ev.product_id
  WHERE ev.user_id = p_user;
$$;
