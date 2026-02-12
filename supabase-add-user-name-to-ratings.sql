-- Add user_name column to ratings table
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS user_name TEXT;

-- Policy is likely already set for updates, but good to check if new column needs permissions
-- Assuming standard RLS, authenticated users can update their own rows including this new column
