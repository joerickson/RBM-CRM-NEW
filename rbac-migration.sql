-- ============================================================
-- RBM CRM — RBAC Migration (Clerk + Supabase RLS)
-- Run this in the Supabase SQL Editor AFTER the base schema.
-- Safe to re-run (uses IF NOT EXISTS / OR REPLACE patterns).
-- ============================================================

-- ─── 1. Extend the user_role enum with new granular roles ────
-- PostgreSQL requires ALTER TYPE ... ADD VALUE (no IF NOT EXISTS
-- before PG 14, so we guard with a DO block).

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sales_manager';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sales_rep';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'account_manager';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'building_ops';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 2. Ensure profiles has clerk_id ─────────────────────────
-- The Supabase-native schema ties id to auth.users(id).
-- When using Clerk, we add a separate clerk_id column.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE;

-- ─── 3. Add assigned_sales_rep_clerk_id to key tables ────────
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS assigned_sales_rep_clerk_id TEXT;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS assigned_sales_rep_clerk_id TEXT;

ALTER TABLE visits
  ADD COLUMN IF NOT EXISTS assigned_sales_rep_clerk_id TEXT;

ALTER TABLE customer_interactions
  ADD COLUMN IF NOT EXISTS assigned_sales_rep_clerk_id TEXT;

-- Indexes for fast RLS filtering
CREATE INDEX IF NOT EXISTS customers_sales_rep_clerk_idx
  ON customers(assigned_sales_rep_clerk_id);

CREATE INDEX IF NOT EXISTS tasks_sales_rep_clerk_idx
  ON tasks(assigned_sales_rep_clerk_id);

CREATE INDEX IF NOT EXISTS visits_sales_rep_clerk_idx
  ON visits(assigned_sales_rep_clerk_id);

CREATE INDEX IF NOT EXISTS interactions_sales_rep_clerk_idx
  ON customer_interactions(assigned_sales_rep_clerk_id);

-- ─── 4. Clerk JWT helper function ────────────────────────────
-- Supabase must be configured to trust Clerk's JWKS endpoint.
-- In Supabase Dashboard → Settings → Auth → JWT Settings,
-- set the JWKS URL to: https://clerk.your-domain.com/.well-known/jwks.json

CREATE OR REPLACE FUNCTION requesting_user_clerk_id()
RETURNS TEXT
STABLE
LANGUAGE sql
AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  )::text;
$$;

-- Helper: is the current user an admin or sales_manager?
CREATE OR REPLACE FUNCTION is_manager_or_admin()
RETURNS BOOLEAN
STABLE
LANGUAGE sql
AS $$
  SELECT role IN ('admin', 'sales_manager', 'sales')
  FROM profiles
  WHERE clerk_id = requesting_user_clerk_id()
  LIMIT 1;
$$;

-- Helper: is the current user a restricted role?
CREATE OR REPLACE FUNCTION is_restricted_role()
RETURNS BOOLEAN
STABLE
LANGUAGE sql
AS $$
  SELECT role IN ('sales_rep', 'account_manager', 'building_ops', 'building-ops')
  FROM profiles
  WHERE clerk_id = requesting_user_clerk_id()
  LIMIT 1;
$$;

-- ─── 5. Drop old overly-broad RLS policies ───────────────────
DROP POLICY IF EXISTS "customers_staff_all"       ON customers;
DROP POLICY IF EXISTS "customers_select_staff"    ON customers;
DROP POLICY IF EXISTS "sites_staff"               ON customer_sites;
DROP POLICY IF EXISTS "interactions_staff"        ON customer_interactions;
DROP POLICY IF EXISTS "visits_staff"              ON visits;
DROP POLICY IF EXISTS "employees_staff"           ON employees;
DROP POLICY IF EXISTS "tasks_staff"               ON tasks;
DROP POLICY IF EXISTS "events_staff"              ON events;
DROP POLICY IF EXISTS "event_customers_staff"     ON event_customers;
DROP POLICY IF EXISTS "event_attendees_staff"     ON event_attendees;
DROP POLICY IF EXISTS "requests_staff_select"     ON customer_requests;
DROP POLICY IF EXISTS "requests_staff_update"     ON customer_requests;

-- ─── 6. New role-aware RLS policies ──────────────────────────

-- ── Customers ──
-- Admins / managers see all records.
-- Sales reps / account managers see only their assigned records.
CREATE POLICY "customers_manager_all" ON customers
  FOR ALL
  USING (is_manager_or_admin());

CREATE POLICY "customers_rep_own" ON customers
  FOR ALL
  USING (
    is_restricted_role()
    AND assigned_sales_rep_clerk_id = requesting_user_clerk_id()
  );

-- ── Customer Sites ──
-- Access via the parent customer (join check via RLS on customers covers this,
-- but we add explicit policies for direct queries).
CREATE POLICY "sites_manager_all" ON customer_sites
  FOR ALL
  USING (is_manager_or_admin());

CREATE POLICY "sites_rep_own" ON customer_sites
  FOR ALL
  USING (
    is_restricted_role()
    AND EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = customer_sites.customer_id
        AND c.assigned_sales_rep_clerk_id = requesting_user_clerk_id()
    )
  );

-- ── Customer Interactions ──
CREATE POLICY "interactions_manager_all" ON customer_interactions
  FOR ALL
  USING (is_manager_or_admin());

CREATE POLICY "interactions_rep_own" ON customer_interactions
  FOR ALL
  USING (
    is_restricted_role()
    AND assigned_sales_rep_clerk_id = requesting_user_clerk_id()
  );

-- ── Visits ──
CREATE POLICY "visits_manager_all" ON visits
  FOR ALL
  USING (is_manager_or_admin());

CREATE POLICY "visits_rep_own" ON visits
  FOR ALL
  USING (
    is_restricted_role()
    AND assigned_sales_rep_clerk_id = requesting_user_clerk_id()
  );

-- ── Tasks ──
CREATE POLICY "tasks_manager_all" ON tasks
  FOR ALL
  USING (is_manager_or_admin());

CREATE POLICY "tasks_rep_own" ON tasks
  FOR ALL
  USING (
    is_restricted_role()
    AND assigned_sales_rep_clerk_id = requesting_user_clerk_id()
  );

-- ── Customer Requests ──
-- Public insert (portal), staff read/update with role filter
CREATE POLICY "requests_insert_anon" ON customer_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "requests_manager_select" ON customer_requests
  FOR SELECT
  USING (is_manager_or_admin());

CREATE POLICY "requests_manager_update" ON customer_requests
  FOR UPDATE
  USING (is_manager_or_admin());

-- Reps can see requests linked to their own customers
CREATE POLICY "requests_rep_own" ON customer_requests
  FOR SELECT
  USING (
    is_restricted_role()
    AND EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = customer_requests.customer_id
        AND c.assigned_sales_rep_clerk_id = requesting_user_clerk_id()
    )
  );

-- ── Employees ──
CREATE POLICY "employees_staff" ON employees
  FOR ALL
  USING (
    requesting_user_clerk_id() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.clerk_id = requesting_user_clerk_id()
        AND p.role IN ('admin', 'sales_manager', 'sales', 'sales_rep',
                       'account_manager', 'building_ops', 'building-ops')
    )
  );

-- ── Events ──
-- All authenticated staff can view/manage events
CREATE POLICY "events_staff" ON events
  FOR ALL
  USING (
    requesting_user_clerk_id() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.clerk_id = requesting_user_clerk_id()
    )
  );

CREATE POLICY "event_customers_staff" ON event_customers
  FOR ALL
  USING (
    requesting_user_clerk_id() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.clerk_id = requesting_user_clerk_id()
    )
  );

CREATE POLICY "event_attendees_staff" ON event_attendees
  FOR ALL
  USING (
    requesting_user_clerk_id() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.clerk_id = requesting_user_clerk_id()
    )
  );

-- ─── 7. Keep existing profiles policies ──────────────────────
-- (profiles_select, profiles_update_own, profiles_admin_all remain from base schema)
-- No changes needed here; admins manage profiles via Clerk.

-- ─── 8. Convenience: backfill assigned_sales_rep_clerk_id ────
-- If customers already have assigned_rep_id pointing to a profile with a clerk_id,
-- this one-time backfill populates the new column.
UPDATE customers c
SET assigned_sales_rep_clerk_id = p.clerk_id
FROM profiles p
WHERE c.assigned_rep_id = p.id
  AND c.assigned_sales_rep_clerk_id IS NULL
  AND p.clerk_id IS NOT NULL;

UPDATE tasks t
SET assigned_sales_rep_clerk_id = p.clerk_id
FROM profiles p
WHERE t.assigned_to_id = p.id
  AND t.assigned_sales_rep_clerk_id IS NULL
  AND p.clerk_id IS NOT NULL;
