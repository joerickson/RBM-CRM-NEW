-- ============================================================
-- RBM CRM — Supabase Schema SQL
-- Copy and paste this into Supabase SQL Editor
-- Safe to re-run (idempotent)
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enums ──────────────────────────────────────────────────
-- Using DO blocks so this script is safe to re-run (PostgreSQL has no CREATE TYPE IF NOT EXISTS)
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin', 'sales', 'building-ops', 'customer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE brand AS ENUM ('rbm-services', 'double-take', 'five-star');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE customer_status AS ENUM ('lead', 'prospect', 'active', 'at-risk', 'churned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE sales_stage AS ENUM ('new-lead', 'contacted', 'qualified', 'proposal-sent', 'negotiating', 'closed-won', 'closed-lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE task_status AS ENUM ('todo', 'in-progress', 'done', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE request_status AS ENUM ('open', 'in-review', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE interaction_type AS ENUM ('call', 'email', 'meeting', 'demo', 'proposal', 'follow-up', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE visit_status AS ENUM ('scheduled', 'completed', 'missed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE employee_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE event_type AS ENUM ('delta-center', 'theater', 'golf', 'dinner', 'client-appreciation', 'conference', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Profiles ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT,
  role        user_role NOT NULL DEFAULT 'sales',
  phone       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'sales')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Customers ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand                   brand NOT NULL DEFAULT 'rbm-services',
  company_name            TEXT NOT NULL,
  status                  customer_status NOT NULL DEFAULT 'lead',
  stage                   sales_stage,
  industry                TEXT,
  address                 TEXT,
  city                    TEXT,
  state                   TEXT,
  zip                     TEXT,
  primary_contact_name    TEXT,
  primary_contact_email   TEXT,
  primary_contact_phone   TEXT,
  assigned_rep_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  monthly_value           DECIMAL(10,2),
  contract_start_date     DATE,
  contract_end_date       DATE,
  ai_health_score         INTEGER CHECK (ai_health_score BETWEEN 0 AND 100),
  ai_risk_score           INTEGER CHECK (ai_risk_score BETWEEN 0 AND 100),
  ai_lead_score           INTEGER CHECK (ai_lead_score BETWEEN 0 AND 100),
  ai_notes                TEXT,
  last_score_at           TIMESTAMPTZ,
  notes                   TEXT,
  visit_frequency         TEXT,
  risk_threshold_days     INTEGER DEFAULT 90,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS customers_status_idx ON customers(status);
CREATE INDEX IF NOT EXISTS customers_stage_idx ON customers(stage);
CREATE INDEX IF NOT EXISTS customers_brand_idx ON customers(brand);
CREATE INDEX IF NOT EXISTS customers_assigned_rep_idx ON customers(assigned_rep_id);

-- ─── Customer Sites ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_sites (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id      UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  site_name        TEXT NOT NULL,
  address          TEXT NOT NULL,
  city             TEXT NOT NULL,
  state            TEXT NOT NULL,
  zip              TEXT NOT NULL,
  sqft             INTEGER,
  visit_frequency  TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Employees ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name   TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  role        TEXT NOT NULL,
  brand       brand NOT NULL DEFAULT 'rbm-services',
  status      employee_status NOT NULL DEFAULT 'active',
  hire_date   DATE,
  profile_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Visits ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visits (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id      UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  site_id          UUID REFERENCES customer_sites(id) ON DELETE SET NULL,
  employee_id      UUID REFERENCES employees(id) ON DELETE SET NULL,
  visit_date       TIMESTAMPTZ NOT NULL,
  visit_type       TEXT NOT NULL DEFAULT 'routine',
  status           visit_status NOT NULL DEFAULT 'scheduled',
  notes            TEXT,
  customer_rating  INTEGER CHECK (customer_rating BETWEEN 1 AND 5),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS visits_customer_idx ON visits(customer_id);
CREATE INDEX IF NOT EXISTS visits_date_idx ON visits(visit_date);

-- ─── Customer Interactions ──────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_interactions (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id          UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  rep_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type                 interaction_type NOT NULL,
  subject              TEXT NOT NULL,
  notes                TEXT,
  outcome              TEXT,
  next_follow_up_date  DATE,
  interaction_date     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS interactions_customer_idx ON customer_interactions(customer_id);
CREATE INDEX IF NOT EXISTS interactions_rep_idx ON customer_interactions(rep_id);

-- ─── Customer Requests ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_requests (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id      UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_email   TEXT NOT NULL,
  customer_name    TEXT NOT NULL,
  subject          TEXT NOT NULL,
  description      TEXT NOT NULL,
  status           request_status NOT NULL DEFAULT 'open',
  priority         task_priority NOT NULL DEFAULT 'medium',
  assigned_to_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS requests_status_idx ON customer_requests(status);

-- ─── Tasks ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  description     TEXT,
  status          task_status NOT NULL DEFAULT 'todo',
  priority        task_priority NOT NULL DEFAULT 'medium',
  assigned_to_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
  due_date        TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_assigned_idx ON tasks(assigned_to_id);

-- ─── Events ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  date          TIMESTAMPTZ NOT NULL,
  location      TEXT,
  type          event_type NOT NULL DEFAULT 'other',
  notes         TEXT,
  created_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Event Customers (many-to-many) ─────────────────────────
CREATE TABLE IF NOT EXISTS event_customers (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  attended    BOOLEAN DEFAULT FALSE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Event Attendees ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_attendees (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  profile_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'employee',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Row Level Security ──────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role LANGUAGE sql SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- ─── RLS Policies ────────────────────────────────────────────
-- Drop existing policies first so re-runs don't error
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
DROP POLICY IF EXISTS "customers_staff_all" ON customers;
DROP POLICY IF EXISTS "customers_select_staff" ON customers;
DROP POLICY IF EXISTS "requests_insert_anon" ON customer_requests;
DROP POLICY IF EXISTS "requests_staff_select" ON customer_requests;
DROP POLICY IF EXISTS "requests_staff_update" ON customer_requests;
DROP POLICY IF EXISTS "sites_staff" ON customer_sites;
DROP POLICY IF EXISTS "interactions_staff" ON customer_interactions;
DROP POLICY IF EXISTS "visits_staff" ON visits;
DROP POLICY IF EXISTS "employees_staff" ON employees;
DROP POLICY IF EXISTS "tasks_staff" ON tasks;
DROP POLICY IF EXISTS "events_staff" ON events;
DROP POLICY IF EXISTS "event_customers_staff" ON event_customers;
DROP POLICY IF EXISTS "event_attendees_staff" ON event_attendees;

-- Profiles: users can read all, update own; admins can update any
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (get_user_role() = 'admin');

-- Customers: authenticated staff can read all; customers can only read their own
CREATE POLICY "customers_staff_all" ON customers FOR ALL
  USING (get_user_role() IN ('admin', 'sales', 'building-ops'));
CREATE POLICY "customers_select_staff" ON customers FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Customer requests: anyone can insert (for portal), staff can read/update
CREATE POLICY "requests_insert_anon" ON customer_requests FOR INSERT
  WITH CHECK (true);
CREATE POLICY "requests_staff_select" ON customer_requests FOR SELECT
  USING (get_user_role() IN ('admin', 'sales', 'building-ops'));
CREATE POLICY "requests_staff_update" ON customer_requests FOR UPDATE
  USING (get_user_role() IN ('admin', 'sales', 'building-ops'));

-- Customer sites, interactions, visits, employees, tasks: authenticated staff
CREATE POLICY "sites_staff" ON customer_sites FOR ALL
  USING (get_user_role() IN ('admin', 'sales', 'building-ops'));
CREATE POLICY "interactions_staff" ON customer_interactions FOR ALL
  USING (get_user_role() IN ('admin', 'sales', 'building-ops'));
CREATE POLICY "visits_staff" ON visits FOR ALL
  USING (get_user_role() IN ('admin', 'sales', 'building-ops'));
CREATE POLICY "employees_staff" ON employees FOR ALL
  USING (get_user_role() IN ('admin', 'sales', 'building-ops'));
CREATE POLICY "tasks_staff" ON tasks FOR ALL
  USING (get_user_role() IN ('admin', 'sales', 'building-ops'));
CREATE POLICY "events_staff" ON events FOR ALL
  USING (get_user_role() IN ('admin', 'sales', 'building-ops'));
CREATE POLICY "event_customers_staff" ON event_customers FOR ALL
  USING (get_user_role() IN ('admin', 'sales', 'building-ops'));
CREATE POLICY "event_attendees_staff" ON event_attendees FOR ALL
  USING (get_user_role() IN ('admin', 'sales', 'building-ops'));

-- ─── Updated At Triggers ─────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers;
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_employees_updated_at ON employees;
CREATE TRIGGER trg_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_requests_updated_at ON customer_requests;
CREATE TRIGGER trg_requests_updated_at BEFORE UPDATE ON customer_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_events_updated_at ON events;
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
