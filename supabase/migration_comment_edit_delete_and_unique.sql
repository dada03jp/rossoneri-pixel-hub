-- Migration: Add comment edit/delete columns and unique constraint for ratings
-- Created: 2026-03-19
-- Purpose: 
--   1. Add is_deleted, is_edited, edited_at, deleted_at columns to ratings table
--   2. Add unique constraint on (user_id, match_id, player_id) to prevent duplicate ratings
--   3. Clean up any existing duplicate ratings before adding unique constraint

-- ============================
-- Step 1: Add columns
-- ============================
ALTER TABLE ratings 
  ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_edited boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- ============================
-- Step 2: Clean up duplicate ratings (keep the latest one per user+match+player)
-- ============================
-- First, identify duplicates and delete older ones
DELETE FROM ratings
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, match_id, player_id) id
  FROM ratings
  ORDER BY user_id, match_id, player_id, created_at DESC
);

-- ============================
-- Step 3: Add unique constraint
-- ============================
-- This ensures one rating per user per match per player
ALTER TABLE ratings
  ADD CONSTRAINT ratings_user_match_player_unique 
  UNIQUE (user_id, match_id, player_id);

-- ============================
-- Step 4: Add indexes for performance
-- ============================
CREATE INDEX IF NOT EXISTS idx_ratings_is_deleted ON ratings(is_deleted) WHERE is_deleted = true;
CREATE INDEX IF NOT EXISTS idx_ratings_is_edited ON ratings(is_edited) WHERE is_edited = true;
