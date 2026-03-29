-- ============================================================
-- Migration: events tables + missing created_by_id column
-- Safe to re-run (idempotent)
-- ============================================================

-- ─── event_type enum ────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE event_type AS ENUM (
    'delta-center', 'theater', 'golf', 'dinner',
    'client-appreciation', 'conference', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── events ─────────────────────────────────────────────────
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

-- Add created_by_id if the table already existed without it
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- ─── event_customers ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  attended    BOOLEAN DEFAULT FALSE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── event_attendees ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_attendees (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'employee',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── RLS ────────────────────────────────────────────────────
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_staff" ON events;
DROP POLICY IF EXISTS "event_customers_staff" ON event_customers;
DROP POLICY IF EXISTS "event_attendees_staff" ON event_attendees;

CREATE POLICY "events_staff" ON events FOR ALL
  USING (get_user_role() IN ('admin', 'sales', 'building-ops'));
CREATE POLICY "event_customers_staff" ON event_customers FOR ALL
  USING (get_user_role() IN ('admin', 'sales', 'building-ops'));
CREATE POLICY "event_attendees_staff" ON event_attendees FOR ALL
  USING (get_user_role() IN ('admin', 'sales', 'building-ops'));

-- ─── updated_at trigger ─────────────────────────────────────
DROP TRIGGER IF EXISTS trg_events_updated_at ON events;
CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
