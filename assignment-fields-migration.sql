-- Add assigned_operations_manager_clerk_id to customers table
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS assigned_operations_manager_clerk_id TEXT;
