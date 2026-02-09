-- ROSSONERI PIXEL HUB - Latest Match Data Update
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Add latest Serie A matches for 25-26 season
-- ============================================

-- Get the 25-26 season ID
-- Using: aaaaaaaa-0000-0000-0000-000000000002

-- Delete old mock matches first (optional - comment out if you want to keep them)
-- DELETE FROM matches WHERE id LIKE 'match-%';
-- DELETE FROM matches WHERE id LIKE 'cccccccc-%';

-- Add real 2025-26 Serie A matches
INSERT INTO matches (id, opponent_name, match_date, home_score, away_score, is_finished, competition, season_id) VALUES
  -- Completed matches
  ('dddddddd-0001-0001-0001-000000000001', 'Bologna', '2026-02-03T20:45:00+01:00', 3, 0, TRUE, 'Serie A', 'aaaaaaaa-0000-0000-0000-000000000002'),
  
  -- Upcoming matches
  ('dddddddd-0002-0002-0002-000000000002', 'Como', '2026-02-08T18:00:00+01:00', NULL, NULL, FALSE, 'Serie A', 'aaaaaaaa-0000-0000-0000-000000000002'),
  ('dddddddd-0003-0003-0003-000000000003', 'Pisa', '2026-02-14T20:45:00+01:00', NULL, NULL, FALSE, 'Serie A', 'aaaaaaaa-0000-0000-0000-000000000002'),
  ('dddddddd-0004-0004-0004-000000000004', 'Parma', '2026-02-22T15:00:00+01:00', NULL, NULL, FALSE, 'Serie A', 'aaaaaaaa-0000-0000-0000-000000000002'),
  ('dddddddd-0005-0005-0005-000000000005', 'Cremonese', '2026-03-01T20:45:00+01:00', NULL, NULL, FALSE, 'Serie A', 'aaaaaaaa-0000-0000-0000-000000000002')
ON CONFLICT (id) DO UPDATE SET
  opponent_name = EXCLUDED.opponent_name,
  match_date = EXCLUDED.match_date,
  home_score = EXCLUDED.home_score,
  away_score = EXCLUDED.away_score,
  is_finished = EXCLUDED.is_finished,
  competition = EXCLUDED.competition,
  season_id = EXCLUDED.season_id;

-- ============================================
-- STEP 2: Add match_players for Bologna match
-- Players who scored: Loftus-Cheek, Nkunku, Rabiot
-- ============================================

-- Link starting XI to Bologna match
INSERT INTO match_players (id, match_id, player_id, is_starter) VALUES
  -- GK
  (gen_random_uuid(), 'dddddddd-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', TRUE),  -- Maignan
  -- DF
  (gen_random_uuid(), 'dddddddd-0001-0001-0001-000000000001', 'cccccccc-0002-0002-0002-000000000002', TRUE),  -- Estupiñán
  (gen_random_uuid(), 'dddddddd-0001-0001-0001-000000000001', '33333333-3333-3333-3333-333333333333', TRUE),  -- Tomori
  (gen_random_uuid(), 'dddddddd-0001-0001-0001-000000000001', 'cccccccc-0006-0006-0006-000000000006', TRUE),  -- Pavlović
  -- MF
  (gen_random_uuid(), 'dddddddd-0001-0001-0001-000000000001', 'cccccccc-0007-0007-0007-000000000007', TRUE),  -- Ricci
  (gen_random_uuid(), 'dddddddd-0001-0001-0001-000000000001', 'cccccccc-0008-0008-0008-000000000008', TRUE),  -- Loftus-Cheek (goal)
  (gen_random_uuid(), 'dddddddd-0001-0001-0001-000000000001', 'cccccccc-0009-0009-0009-000000000009', TRUE),  -- Rabiot (goal)
  (gen_random_uuid(), 'dddddddd-0001-0001-0001-000000000001', '88888888-8888-8888-8888-888888888888', TRUE),  -- Pulisic
  (gen_random_uuid(), 'dddddddd-0001-0001-0001-000000000001', '99999999-9999-9999-9999-999999999999', TRUE),  -- Leão
  -- FW
  (gen_random_uuid(), 'dddddddd-0001-0001-0001-000000000001', 'cccccccc-0016-0016-0016-000000000016', TRUE),  -- Nkunku (goal)
  (gen_random_uuid(), 'dddddddd-0001-0001-0001-000000000001', 'cccccccc-0014-0014-0014-000000000014', TRUE)   -- Giménez
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 3: Mark departed players as inactive for 25-26 season
-- These players left but their 24-25 records remain
-- ============================================

-- Example: If Calabria left the club
UPDATE player_seasons 
SET is_active = FALSE, left_date = '2025-08-31'
WHERE player_id = '22222222-2222-2222-2222-222222222222' 
  AND season_id = 'aaaaaaaa-0000-0000-0000-000000000002';

-- Example: If Morata left the club
UPDATE player_seasons 
SET is_active = FALSE, left_date = '2025-07-01'
WHERE player_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' 
  AND season_id = 'aaaaaaaa-0000-0000-0000-000000000002';
