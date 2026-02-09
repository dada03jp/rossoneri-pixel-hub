-- ROSSONERI PIXEL HUB - Data Correction SQL (Fixed)
-- Corrects match dates and adds 24-25 season full roster
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Delete old incorrect match data using proper UUID cast
-- ============================================

-- Remove old matches using text cast
DELETE FROM matches WHERE id::text LIKE 'dddddddd-%';
DELETE FROM matches WHERE id::text LIKE 'match-%';

-- Insert correct 25-26 Serie A matches with accurate dates
INSERT INTO matches (id, opponent_name, match_date, home_score, away_score, is_finished, competition, season_id) VALUES
  -- Completed matches (HOME scores first, regardless of venue)
  ('eeeeeeee-0001-0001-0001-000000000001', 'Bologna', '2026-02-01T15:00:00+01:00', 0, 3, TRUE, 'Serie A', 'aaaaaaaa-0000-0000-0000-000000000002'),
  
  -- Upcoming matches
  ('eeeeeeee-0002-0002-0002-000000000002', 'Como', '2026-02-08T18:00:00+01:00', NULL, NULL, FALSE, 'Serie A', 'aaaaaaaa-0000-0000-0000-000000000002'),
  ('eeeeeeee-0003-0003-0003-000000000003', 'Pisa', '2026-02-15T20:45:00+01:00', NULL, NULL, FALSE, 'Serie A', 'aaaaaaaa-0000-0000-0000-000000000002'),
  ('eeeeeeee-0004-0004-0004-000000000004', 'Parma', '2026-02-22T15:00:00+01:00', NULL, NULL, FALSE, 'Serie A', 'aaaaaaaa-0000-0000-0000-000000000002'),
  ('eeeeeeee-0005-0005-0005-000000000005', 'Cremonese', '2026-03-01T15:00:00+01:00', NULL, NULL, FALSE, 'Serie A', 'aaaaaaaa-0000-0000-0000-000000000002'),
  ('eeeeeeee-0006-0006-0006-000000000006', 'Inter', '2026-03-08T20:45:00+01:00', NULL, NULL, FALSE, 'Serie A', 'aaaaaaaa-0000-0000-0000-000000000002'),
  ('eeeeeeee-0007-0007-0007-000000000007', 'Lazio', '2026-03-15T18:00:00+01:00', NULL, NULL, FALSE, 'Serie A', 'aaaaaaaa-0000-0000-0000-000000000002'),
  ('eeeeeeee-0008-0008-0008-000000000008', 'Torino', '2026-03-22T15:00:00+01:00', NULL, NULL, FALSE, 'Serie A', 'aaaaaaaa-0000-0000-0000-000000000002')
ON CONFLICT (id) DO UPDATE SET
  opponent_name = EXCLUDED.opponent_name,
  match_date = EXCLUDED.match_date,
  home_score = EXCLUDED.home_score,
  away_score = EXCLUDED.away_score,
  is_finished = EXCLUDED.is_finished;

-- ============================================
-- STEP 2: Add missing 24-25 season players
-- ============================================
INSERT INTO players (id, name, number, position, pixel_config) VALUES
  -- Goalkeepers
  ('24250001-0001-0001-0001-000000000001', 'Marco Sportiello', 57, 'GK', '{"skinTone": "light", "hairStyle": "bald", "hairColor": "brown"}'),
  ('24250002-0002-0002-0002-000000000002', 'Lorenzo Torriani', 96, 'GK', '{"skinTone": "light", "hairStyle": "short", "hairColor": "brown"}'),
  
  -- Defenders
  ('24250003-0003-0003-0003-000000000003', 'Matteo Gabbia', 46, 'DF', '{"skinTone": "light", "hairStyle": "short", "hairColor": "brown"}'),
  ('24250004-0004-0004-0004-000000000004', 'Emerson Royal', 22, 'DF', '{"skinTone": "medium", "hairStyle": "short", "hairColor": "black"}'),
  ('24250005-0005-0005-0005-000000000005', 'Álex Jiménez', 17, 'DF', '{"skinTone": "light", "hairStyle": "short", "hairColor": "brown"}'),
  ('24250006-0006-0006-0006-000000000006', 'Kyle Walker', 32, 'DF', '{"skinTone": "dark", "hairStyle": "short", "hairColor": "black"}'),
  ('24250007-0007-0007-0007-000000000007', 'Alessandro Florenzi', 25, 'DF', '{"skinTone": "light", "hairStyle": "short", "hairColor": "brown"}'),
  ('24250008-0008-0008-0008-000000000008', 'Filippo Terracciano', 42, 'DF', '{"skinTone": "light", "hairStyle": "short", "hairColor": "brown"}'),
  
  -- Midfielders
  ('24250009-0009-0009-0009-000000000009', 'Yunus Musah', 80, 'MF', '{"skinTone": "dark", "hairStyle": "afro", "hairColor": "black"}'),
  ('24250010-0010-0010-0010-000000000010', 'Warren Bondo', 38, 'MF', '{"skinTone": "dark", "hairStyle": "short", "hairColor": "black"}'),
  ('24250011-0011-0011-0011-000000000011', 'Kevin Zeroli', 73, 'MF', '{"skinTone": "light", "hairStyle": "short", "hairColor": "brown"}'),
  ('24250012-0012-0012-0012-000000000012', 'Silvano Vos', 34, 'MF', '{"skinTone": "dark", "hairStyle": "short", "hairColor": "black"}'),
  
  -- Forwards
  ('24250013-0013-0013-0013-000000000013', 'Noah Okafor', 17, 'FW', '{"skinTone": "dark", "hairStyle": "short", "hairColor": "black"}'),
  ('24250014-0014-0014-0014-000000000014', 'Tammy Abraham', 90, 'FW', '{"skinTone": "dark", "hairStyle": "short", "hairColor": "black"}'),
  ('24250015-0015-0015-0015-000000000015', 'João Félix', 30, 'FW', '{"skinTone": "light", "hairStyle": "medium", "hairColor": "brown"}'),
  ('24250016-0016-0016-0016-000000000016', 'Francesco Camarda', 71, 'FW', '{"skinTone": "light", "hairStyle": "short", "hairColor": "brown"}'),
  ('24250017-0017-0017-0017-000000000017', 'Luka Jović', 9, 'FW', '{"skinTone": "light", "hairStyle": "short", "hairColor": "brown"}')
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 3: Link 24-25 season players
-- ============================================

-- Link new players to 24-25 season
INSERT INTO player_seasons (player_id, season_id, jersey_number, is_active) VALUES
  -- GK
  ('24250001-0001-0001-0001-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 57, TRUE),
  ('24250002-0002-0002-0002-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 96, TRUE),
  -- DF
  ('24250003-0003-0003-0003-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 46, TRUE),
  ('24250004-0004-0004-0004-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001', 22, TRUE),
  ('24250005-0005-0005-0005-000000000005', 'aaaaaaaa-0000-0000-0000-000000000001', 17, TRUE),
  ('24250006-0006-0006-0006-000000000006', 'aaaaaaaa-0000-0000-0000-000000000001', 32, TRUE),
  ('24250007-0007-0007-0007-000000000007', 'aaaaaaaa-0000-0000-0000-000000000001', 25, TRUE),
  ('24250008-0008-0008-0008-000000000008', 'aaaaaaaa-0000-0000-0000-000000000001', 42, TRUE),
  -- MF
  ('24250009-0009-0009-0009-000000000009', 'aaaaaaaa-0000-0000-0000-000000000001', 80, TRUE),
  ('24250010-0010-0010-0010-000000000010', 'aaaaaaaa-0000-0000-0000-000000000001', 38, TRUE),
  ('24250011-0011-0011-0011-000000000011', 'aaaaaaaa-0000-0000-0000-000000000001', 73, TRUE),
  ('24250012-0012-0012-0012-000000000012', 'aaaaaaaa-0000-0000-0000-000000000001', 34, TRUE),
  -- FW
  ('24250013-0013-0013-0013-000000000013', 'aaaaaaaa-0000-0000-0000-000000000001', 17, TRUE),
  ('24250014-0014-0014-0014-000000000014', 'aaaaaaaa-0000-0000-0000-000000000001', 90, TRUE),
  ('24250015-0015-0015-0015-000000000015', 'aaaaaaaa-0000-0000-0000-000000000001', 30, TRUE),
  ('24250016-0016-0016-0016-000000000016', 'aaaaaaaa-0000-0000-0000-000000000001', 71, TRUE),
  ('24250017-0017-0017-0017-000000000017', 'aaaaaaaa-0000-0000-0000-000000000001', 9, TRUE)
ON CONFLICT DO NOTHING;

-- Also link existing players to 24-25 if not already
INSERT INTO player_seasons (player_id, season_id, jersey_number, is_active)
SELECT id, 'aaaaaaaa-0000-0000-0000-000000000001', number, TRUE
FROM players
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  '66666666-6666-6666-6666-666666666666',
  '77777777-7777-7777-7777-777777777777',
  '88888888-8888-8888-8888-888888888888',
  '99999999-9999-9999-9999-999999999999',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
)
ON CONFLICT DO NOTHING;
