-- ============================================================
-- RBM CRM — Events Migration
-- Run this in your Supabase SQL Editor to create the events tables.
-- Safe to re-run (idempotent).
-- ============================================================

-- ─── Event Type Enum ────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE event_type AS ENUM (
    'delta-center',
    'theater',
    'golf',
    'dinner',
    'client-appreciation',
    'conference',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Events ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  date          TIMESTAMPTZ NOT NULL,
  location      TEXT,
  type          event_type NOT NULL DEFAULT 'other',
  notes         TEXT,
  created_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Event Customers (many-to-many join) ────────────────────
CREATE TABLE IF NOT EXISTS event_customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  attended    BOOLEAN DEFAULT FALSE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, customer_id)
);

-- ─── Event Attendees (internal staff on the event) ──────────
CREATE TABLE IF NOT EXISTS event_attendees (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  profile_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'employee',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Row Level Security ──────────────────────────────────────
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- ─── RLS Policies ────────────────────────────────────────────
DROP POLICY IF EXISTS "events_staff" ON events;
DROP POLICY IF EXISTS "event_customers_staff" ON event_customers;
DROP POLICY IF EXISTS "event_attendees_staff" ON event_attendees;

CREATE POLICY "events_staff" ON events FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "event_customers_staff" ON event_customers FOR ALL
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "event_attendees_staff" ON event_attendees FOR ALL
  USING (auth.uid() IS NOT NULL);

-- ─── Updated At Trigger ──────────────────────────────────────
DROP TRIGGER IF EXISTS trg_events_updated_at ON events;
CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
