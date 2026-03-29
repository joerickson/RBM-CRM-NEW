-- ============================================================
-- Admin Settings: Lookup Tables Migration
-- Run this in your Supabase SQL editor
-- ============================================================

-- 1. Convert enum columns to text (preserves existing data)
ALTER TABLE customers
  ALTER COLUMN status TYPE text USING status::text;

ALTER TABLE customer_interactions
  ALTER COLUMN type TYPE text USING type::text;

-- 2. Create lookup tables
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS industries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS visit_frequencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS interaction_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Seed initial data
INSERT INTO companies (name) VALUES
  ('RBM Services'),
  ('TruCo'),
  ('Alpine'),
  ('DT')
ON CONFLICT (name) DO NOTHING;

INSERT INTO customer_statuses (name) VALUES
  ('lead'),
  ('prospect'),
  ('active'),
  ('at-risk'),
  ('churned')
ON CONFLICT (name) DO NOTHING;

INSERT INTO industries (name) VALUES
  ('Healthcare'),
  ('Office'),
  ('Retail'),
  ('Education'),
  ('Manufacturing'),
  ('Hospitality'),
  ('Government'),
  ('Technology'),
  ('Finance'),
  ('Other')
ON CONFLICT (name) DO NOTHING;

INSERT INTO visit_frequencies (name) VALUES
  ('weekly'),
  ('bi-weekly'),
  ('monthly'),
  ('quarterly'),
  ('bi-annual'),
  ('annual'),
  ('as-needed')
ON CONFLICT (name) DO NOTHING;

INSERT INTO interaction_types (name) VALUES
  ('call'),
  ('email'),
  ('meeting'),
  ('demo'),
  ('proposal'),
  ('follow-up'),
  ('site visit'),
  ('other')
ON CONFLICT (name) DO NOTHING;

-- 4. Enable RLS on new tables (matching existing pattern)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_frequencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_types ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read lookup tables
CREATE POLICY "Allow authenticated read on companies"
  ON companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on customer_statuses"
  ON customer_statuses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on industries"
  ON industries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on visit_frequencies"
  ON visit_frequencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on interaction_types"
  ON interaction_types FOR SELECT TO authenticated USING (true);

-- Allow service role full access (used by server actions)
CREATE POLICY "Allow service role full access on companies"
  ON companies FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role full access on customer_statuses"
  ON customer_statuses FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role full access on industries"
  ON industries FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role full access on visit_frequencies"
  ON visit_frequencies FOR ALL TO service_role USING (true);
CREATE POLICY "Allow service role full access on interaction_types"
  ON interaction_types FOR ALL TO service_role USING (true);
