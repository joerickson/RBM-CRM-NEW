CREATE TABLE IF NOT EXISTS "pending_invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text NOT NULL,
  "role" text NOT NULL,
  "token" text NOT NULL UNIQUE,
  "invited_by_id" uuid REFERENCES "profiles"("id") ON DELETE SET NULL,
  "expires_at" timestamptz NOT NULL,
  "used_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
