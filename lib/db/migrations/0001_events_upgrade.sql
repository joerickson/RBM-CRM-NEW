-- Migration: Events & Entertaining Module Upgrade
-- Run this once against your Supabase/PostgreSQL database.

-- 1. Add 'events-only' role to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'events-only';

-- 2. Create event_types table
CREATE TABLE IF NOT EXISTS event_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT 'gray',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Seed default event types (idempotent)
INSERT INTO event_types (name, slug, color, sort_order) VALUES
  ('Delta Center Suite',  'delta-center',         'blue',   1),
  ('Hale Center Theater', 'theater',              'purple', 2),
  ('Golf Outing',         'golf',                 'green',  3),
  ('Dinner',              'dinner',               'orange', 4),
  ('Client Appreciation', 'client-appreciation',  'pink',   5),
  ('Conference',          'conference',           'indigo', 6),
  ('Other',               'other',                'gray',   7)
ON CONFLICT (slug) DO NOTHING;

-- 4. Add new columns to events
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS event_type_id UUID REFERENCES event_types(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS company TEXT,
  ADD COLUMN IF NOT EXISTS total_tickets INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_parking_passes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tickets_sent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parking_sent BOOLEAN NOT NULL DEFAULT false;

-- 5. Back-fill event_type_id from existing type slug
UPDATE events e
SET event_type_id = et.id
FROM event_types et
WHERE et.slug = e.type::text
  AND e.event_type_id IS NULL;

-- 6. Add ticket/parking columns to event_customers
ALTER TABLE event_customers
  ADD COLUMN IF NOT EXISTS tickets_assigned INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parking_assigned INTEGER NOT NULL DEFAULT 0;

-- 7. Create attendees table (non-customer people)
CREATE TABLE IF NOT EXISTS attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  notes TEXT,
  attendance_count INTEGER NOT NULL DEFAULT 0,
  last_attended TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Add extra columns to event_attendees
ALTER TABLE event_attendees
  ADD COLUMN IF NOT EXISTS attendee_id UUID REFERENCES attendees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS company TEXT,
  ADD COLUMN IF NOT EXISTS tickets_assigned INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parking_assigned INTEGER NOT NULL DEFAULT 0;

-- 9. Add per-attendee tickets_sent / parking_sent to event_attendees
ALTER TABLE event_attendees
  ADD COLUMN IF NOT EXISTS tickets_sent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parking_sent BOOLEAN NOT NULL DEFAULT false;

-- 10. Add per-attendee tickets_sent / parking_sent to event_customers
ALTER TABLE event_customers
  ADD COLUMN IF NOT EXISTS tickets_sent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parking_sent BOOLEAN NOT NULL DEFAULT false;
