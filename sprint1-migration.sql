-- ============================================================
-- RBM CRM — Sprint 1 Migration
-- Run this in your Supabase SQL Editor (or via drizzle-kit push)
-- after updating the schema.ts file.
-- ============================================================

-- ─── New Enums ──────────────────────────────────────────────
CREATE TYPE notification_type AS ENUM (
  'contract-renewal',
  'at-risk',
  'task-assigned',
  'request-submitted',
  'visit-scheduled',
  'health-score-drop',
  'general'
);

-- ─── Email Templates ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  subject       TEXT NOT NULL,
  body          TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'general',
  created_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Notifications ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        notification_type NOT NULL DEFAULT 'general',
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  link        TEXT,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS notifications_profile_idx ON notifications(profile_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);

-- ─── Seed Default Email Templates ───────────────────────────
-- (Optional — uncomment to seed starter templates)
/*
INSERT INTO email_templates (name, subject, body, category) VALUES
(
  'Introduction Email',
  'Introduction from {{rep_name}} at RBM Services',
  'Hi {{contact_name}},

My name is {{rep_name}} and I''m reaching out from RBM Services. We specialize in commercial cleaning and facility maintenance for businesses like {{customer_name}}.

I''d love to schedule a quick 15-minute call to learn more about your facility needs and share how we''ve helped similar companies in your area.

Are you available this week for a brief conversation?

Best regards,
{{rep_name}}
RBM Services',
  'intro'
),
(
  'Follow-Up After Proposal',
  'Following up on our proposal for {{customer_name}}',
  'Hi {{contact_name}},

I wanted to follow up on the proposal I sent over for {{customer_name}}. I hope you had a chance to review it.

I''m happy to answer any questions or adjust the scope to better fit your needs.

Would you have 10 minutes to connect this week?

Best regards,
{{rep_name}}',
  'follow-up'
),
(
  'Contract Renewal Reminder',
  'Your RBM Services contract is coming up for renewal',
  'Hi {{contact_name}},

I wanted to reach out because your service contract with RBM Services is coming up for renewal on {{contract_end_date}}.

We truly value our partnership with {{customer_name}} and would love to continue providing you with the same quality service.

I''ll give you a call this week to discuss renewal options. Please don''t hesitate to reach out in the meantime.

Best regards,
{{rep_name}}
RBM Services',
  'renewal'
);
*/
