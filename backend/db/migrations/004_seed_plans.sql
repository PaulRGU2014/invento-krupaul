-- Optional seed for plans/products with placeholder Stripe price IDs
-- Replace the price IDs below before running.

INSERT INTO products (code, name) VALUES
  ('inventory', 'Inventory'),
  ('analytics', 'Analytics'),
  ('feedback', 'Feedback')
ON CONFLICT (code) DO NOTHING;

-- Bundles
INSERT INTO plans (code, name, price_cents, billing_interval, is_bundle, stripe_price_id) VALUES
  ('starter', 'Starter', 1900, 'month', true, 'price_1SfS8tEd5PgqPig81DiSXrHc'),
  ('pro', 'Pro', 4900, 'month', true, 'price_1SfS8AEd5PgqPig8Ck884Wy5')
ON CONFLICT (code) DO NOTHING;

-- Addons
INSERT INTO plans (code, name, price_cents, billing_interval, is_bundle, stripe_price_id) VALUES
  ('addon-analytics', 'Analytics Addon', 900, 'month', false, 'price_replace_addon_analytics'),
  ('addon-feedback', 'Feedback Addon', 500, 'month', false, 'price_replace_addon_feedback')
ON CONFLICT (code) DO NOTHING;

-- Bundle contents
INSERT INTO plan_items (plan_id, product_id, quota)
SELECT p.id, pr.id, NULL
FROM plans p
JOIN products pr ON pr.code IN ('inventory')
WHERE p.code = 'starter'
ON CONFLICT DO NOTHING;

INSERT INTO plan_items (plan_id, product_id, quota)
SELECT p.id, pr.id, NULL
FROM plans p
JOIN products pr ON pr.code IN ('inventory', 'analytics', 'feedback')
WHERE p.code = 'pro'
ON CONFLICT DO NOTHING;

-- Addon contents
INSERT INTO plan_items (plan_id, product_id, quota)
SELECT p.id, pr.id, NULL
FROM plans p
JOIN products pr ON pr.code = 'analytics'
WHERE p.code = 'addon-analytics'
ON CONFLICT DO NOTHING;

INSERT INTO plan_items (plan_id, product_id, quota)
SELECT p.id, pr.id, NULL
FROM plans p
JOIN products pr ON pr.code = 'feedback'
WHERE p.code = 'addon-feedback'
ON CONFLICT DO NOTHING;
