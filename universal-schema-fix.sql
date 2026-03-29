-- ============================================================
-- RBM CRM — Universal Schema Fix
-- Safe to re-run (fully idempotent)
-- Run this in Supabase SQL Editor to ensure all columns exist.
-- It adds any missing columns without touching existing data.
-- ============================================================

-- ─── Enums (safe to re-run) ─────────────────────────────────
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

DO $$ BEGIN CREATE TYPE notification_type AS ENUM ('contract-renewal', 'at-risk', 'task-assigned', 'request-submitted', 'visit-scheduled', 'health-score-drop', 'general');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Tables (create if missing) ──────────────────────────────
-- These CREATE TABLE IF NOT EXISTS statements are safe if the table already exists.

CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL UNIQUE,
  full_name  TEXT,
  role       user_role NOT NULL DEFAULT 'sales',
  phone      TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_sites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  site_name   TEXT NOT NULL,
  address     TEXT NOT NULL,
  city        TEXT NOT NULL,
  state       TEXT NOT NULL,
  zip         TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  TEXT NOT NULL,
  role       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visits (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  visit_date  TIMESTAMPTZ NOT NULL,
  visit_type  TEXT NOT NULL DEFAULT 'routine',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_interactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  rep_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type             interaction_type NOT NULL,
  subject          TEXT NOT NULL,
  interaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  customer_name  TEXT NOT NULL,
  subject        TEXT NOT NULL,
  description    TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  created_by_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  date       TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_attendees (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_templates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  subject    TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── profiles columns ────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clerk_id   TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name  TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role       user_role NOT NULL DEFAULT 'sales';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status     TEXT NOT NULL DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone      TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ─── customers columns ───────────────────────────────────────
ALTER TABLE customers ADD COLUMN IF NOT EXISTS brand                 brand NOT NULL DEFAULT 'rbm-services';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_name          TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS status                customer_status NOT NULL DEFAULT 'lead';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS stage                 sales_stage;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS industry              TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address               TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city                  TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS state                 TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS zip                   TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS primary_contact_name  TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS primary_contact_email TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS primary_contact_phone TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS assigned_rep_id       UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS monthly_value         DECIMAL(10,2);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contract_start_date   DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contract_end_date     DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ai_health_score       INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ai_risk_score         INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ai_lead_score         INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS ai_notes              TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_score_at         TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes                 TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS visit_frequency       TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS risk_threshold_days   INTEGER DEFAULT 90;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ─── customer_sites columns ──────────────────────────────────
ALTER TABLE customer_sites ADD COLUMN IF NOT EXISTS sqft            INTEGER;
ALTER TABLE customer_sites ADD COLUMN IF NOT EXISTS visit_frequency TEXT;
ALTER TABLE customer_sites ADD COLUMN IF NOT EXISTS notes           TEXT;

-- ─── employees columns ───────────────────────────────────────
ALTER TABLE employees ADD COLUMN IF NOT EXISTS email      TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone      TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS brand      brand NOT NULL DEFAULT 'rbm-services';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status     employee_status NOT NULL DEFAULT 'active';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hire_date  DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- ─── visits columns ──────────────────────────────────────────
ALTER TABLE visits ADD COLUMN IF NOT EXISTS site_id         UUID REFERENCES customer_sites(id) ON DELETE SET NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS employee_id     UUID REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS status          visit_status NOT NULL DEFAULT 'scheduled';
ALTER TABLE visits ADD COLUMN IF NOT EXISTS notes           TEXT;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS customer_rating INTEGER;

-- ─── customer_interactions columns ───────────────────────────
ALTER TABLE customer_interactions ADD COLUMN IF NOT EXISTS notes              TEXT;
ALTER TABLE customer_interactions ADD COLUMN IF NOT EXISTS outcome            TEXT;
ALTER TABLE customer_interactions ADD COLUMN IF NOT EXISTS next_follow_up_date DATE;

-- ─── customer_requests columns ───────────────────────────────
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS customer_id   UUID REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS status        request_status NOT NULL DEFAULT 'open';
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS priority      task_priority NOT NULL DEFAULT 'medium';
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS assigned_to_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE customer_requests ADD COLUMN IF NOT EXISTS resolved_at   TIMESTAMPTZ;

-- ─── tasks columns ───────────────────────────────────────────
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description   TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status        task_status NOT NULL DEFAULT 'todo';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority      task_priority NOT NULL DEFAULT 'medium';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS customer_id   UUID REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date      TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at  TIMESTAMPTZ;

-- ─── events columns ──────────────────────────────────────────
ALTER TABLE events ADD COLUMN IF NOT EXISTS location      TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS type          event_type NOT NULL DEFAULT 'other';
ALTER TABLE events ADD COLUMN IF NOT EXISTS notes         TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- ─── event_customers columns ─────────────────────────────────
ALTER TABLE event_customers ADD COLUMN IF NOT EXISTS attended BOOLEAN DEFAULT FALSE;
ALTER TABLE event_customers ADD COLUMN IF NOT EXISTS notes    TEXT;

-- ─── event_attendees columns ─────────────────────────────────
-- This is the column that caused the most recent error
ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS type       TEXT NOT NULL DEFAULT 'employee';

-- ─── email_templates columns ─────────────────────────────────
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS category      TEXT NOT NULL DEFAULT 'general';
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- ─── notifications columns ───────────────────────────────────
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type        notification_type NOT NULL DEFAULT 'general';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link        TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read        BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE CASCADE;

-- ─── Indexes (safe to re-run) ────────────────────────────────
CREATE INDEX IF NOT EXISTS customers_status_idx       ON customers(status);
CREATE INDEX IF NOT EXISTS customers_stage_idx        ON customers(stage);
CREATE INDEX IF NOT EXISTS customers_brand_idx        ON customers(brand);
CREATE INDEX IF NOT EXISTS customers_assigned_rep_idx ON customers(assigned_rep_id);
CREATE INDEX IF NOT EXISTS visits_customer_idx        ON visits(customer_id);
CREATE INDEX IF NOT EXISTS visits_date_idx            ON visits(visit_date);
CREATE INDEX IF NOT EXISTS interactions_customer_idx  ON customer_interactions(customer_id);
CREATE INDEX IF NOT EXISTS interactions_rep_idx       ON customer_interactions(rep_id);
CREATE INDEX IF NOT EXISTS requests_status_idx        ON customer_requests(status);
CREATE INDEX IF NOT EXISTS tasks_status_idx           ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_assigned_idx         ON tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS notifications_profile_idx  ON notifications(profile_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx     ON notifications(read);

-- ─── RLS (enable on all tables) ──────────────────────────────
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_sites      ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees           ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits              ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE events              ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees     ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;

-- ─── Updated-at trigger ──────────────────────────────────────
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

DROP TRIGGER IF EXISTS trg_email_templates_updated_at ON email_templates;
CREATE TRIGGER trg_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
