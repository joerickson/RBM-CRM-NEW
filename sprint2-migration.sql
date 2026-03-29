-- ============================================================
-- RBM CRM — Sprint 2 Migration
-- Run this in your Supabase SQL Editor (or Vercel Postgres console)
-- Adds missing columns and tables introduced after initial setup
-- ============================================================

-- ─── Events: add created_by_id column ───────────────────────
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- ─── Profiles: add columns added for Clerk integration ──────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS permissions TEXT[],
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
