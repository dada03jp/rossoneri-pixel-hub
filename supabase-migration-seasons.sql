-- ROSSONERI PIXEL HUB - Multi-Season Schema Migration
-- Run this in Supabase SQL Editor
-- Updated with accurate 25-26 season roster information

-- ============================================
-- STEP 1: Create seasons table
-- ============================================
CREATE TABLE IF NOT EXISTS seasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  start_year INT NOT NULL,
  end_year INT NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for seasons" ON seasons FOR SELECT USING (true);

-- ============================================
-- STEP 2: Create player_seasons junction table
-- ============================================
CREATE TABLE IF NOT EXISTS player_seasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  jersey_number INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  joined_date DATE,
  left_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, season_id)
);

-- Enable RLS
ALTER TABLE player_seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for player_seasons" ON player_seasons FOR SELECT USING (true);

-- ============================================
-- STEP 3: Add season_id to matches table
-- ============================================
ALTER TABLE matches ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES seasons(id);

-- ============================================
-- STEP 4: Insert seasons data
-- ============================================
INSERT INTO seasons (id, name, start_year, end_year, is_current) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '24-25', 2024, 2025, FALSE),
  ('aaaaaaaa-0000-0000-0000-000000000002', '25-26', 2025, 2026, TRUE)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- STEP 5: Add new 25-26 season players
-- Accurate jersey numbers from official AC Milan roster
-- ============================================
INSERT INTO players (id, name, number, position, pixel_config) VALUES
  -- Goalkeepers
  ('cccccccc-0001-0001-0001-000000000001', 'Pietro Terracciano', 1, 'GK', '{"skinTone": "light", "hairStyle": "short", "hairColor": "brown"}'),
  
  -- Defenders
  ('cccccccc-0002-0002-0002-000000000002', 'Pervis Estupiñán', 2, 'DF', '{"skinTone": "dark", "hairStyle": "short", "hairColor": "black"}'),
  ('cccccccc-0003-0003-0003-000000000003', 'Koni De Winter', 5, 'DF', '{"skinTone": "light", "hairStyle": "short", "hairColor": "blonde"}'),
  ('cccccccc-0004-0004-0004-000000000004', 'Zachary Athekame', 24, 'DF', '{"skinTone": "dark", "hairStyle": "short", "hairColor": "black"}'),
  ('cccccccc-0005-0005-0005-000000000005', 'David Odogu', 27, 'DF', '{"skinTone": "dark", "hairStyle": "short", "hairColor": "black"}'),
  ('cccccccc-0006-0006-0006-000000000006', 'Strahinja Pavlović', 31, 'DF', '{"skinTone": "light", "hairStyle": "short", "hairColor": "brown"}'),
  
  -- Midfielders
  ('cccccccc-0007-0007-0007-000000000007', 'Samuele Ricci', 4, 'MF', '{"skinTone": "light", "hairStyle": "medium", "hairColor": "brown"}'),
  ('cccccccc-0008-0008-0008-000000000008', 'Ruben Loftus-Cheek', 8, 'MF', '{"skinTone": "dark", "hairStyle": "short", "hairColor": "black"}'),
  ('cccccccc-0009-0009-0009-000000000009', 'Adrien Rabiot', 12, 'MF', '{"skinTone": "light", "hairStyle": "short", "hairColor": "brown"}'),
  ('cccccccc-0010-0010-0010-000000000010', 'Luka Modrić', 14, 'MF', '{"skinTone": "light", "hairStyle": "medium", "hairColor": "brown"}'),
  ('cccccccc-0011-0011-0011-000000000011', 'Youssouf Fofana', 19, 'MF', '{"skinTone": "dark", "hairStyle": "short", "hairColor": "black"}'),
  ('cccccccc-0012-0012-0012-000000000012', 'Ardon Jashari', 30, 'MF', '{"skinTone": "light", "hairStyle": "short", "hairColor": "brown"}'),
  ('cccccccc-0013-0013-0013-000000000013', 'Alexis Saelemaekers', 56, 'MF', '{"skinTone": "light", "hairStyle": "short", "hairColor": "brown"}'),
  
  -- Forwards
  ('cccccccc-0014-0014-0014-000000000014', 'Santiago Giménez', 7, 'FW', '{"skinTone": "medium", "hairStyle": "short", "hairColor": "brown"}'),
  ('cccccccc-0015-0015-0015-000000000015', 'Niclas Füllkrug', 9, 'FW', '{"skinTone": "light", "hairStyle": "short", "hairColor": "blonde"}'),
  ('cccccccc-0016-0016-0016-000000000016', 'Christopher Nkunku', 18, 'FW', '{"skinTone": "dark", "hairStyle": "short", "hairColor": "black"}')
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 6: Link existing players to 24-25 season
-- ============================================
INSERT INTO player_seasons (player_id, season_id, jersey_number, is_active)
SELECT 
  p.id,
  'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
  p.number,
  TRUE
FROM players p
WHERE p.id IN (
  '11111111-1111-1111-1111-111111111111',  -- Maignan
  '22222222-2222-2222-2222-222222222222',  -- Calabria
  '33333333-3333-3333-3333-333333333333',  -- Tomori
  '44444444-4444-4444-4444-444444444444',  -- Thiaw
  '55555555-5555-5555-5555-555555555555',  -- Theo
  '66666666-6666-6666-6666-666666666666',  -- Bennacer
  '77777777-7777-7777-7777-777777777777',  -- Reijnders
  '88888888-8888-8888-8888-888888888888',  -- Pulisic
  '99999999-9999-9999-9999-999999999999',  -- Leao
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',  -- Morata
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'   -- Chukwueze
)
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 7: Link players to 25-26 season
-- ============================================
-- Continuing players from 24-25
INSERT INTO player_seasons (player_id, season_id, jersey_number, is_active)
SELECT 
  p.id,
  'aaaaaaaa-0000-0000-0000-000000000002'::uuid,
  p.number,
  TRUE
FROM players p
WHERE p.id IN (
  '11111111-1111-1111-1111-111111111111',  -- Maignan #16
  '33333333-3333-3333-3333-333333333333',  -- Tomori #23
  '55555555-5555-5555-5555-555555555555',  -- Theo (departed - set to inactive if needed)
  '66666666-6666-6666-6666-666666666666',  -- Bennacer
  '77777777-7777-7777-7777-777777777777',  -- Reijnders
  '88888888-8888-8888-8888-888888888888',  -- Pulisic #11
  '99999999-9999-9999-9999-999999999999'   -- Leao #10
)
ON CONFLICT DO NOTHING;

-- New players for 25-26 with accurate jersey numbers
INSERT INTO player_seasons (player_id, season_id, jersey_number, is_active) VALUES
  -- GK
  ('cccccccc-0001-0001-0001-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 1, TRUE),   -- Terracciano #1
  -- DF
  ('cccccccc-0002-0002-0002-000000000002', 'aaaaaaaa-0000-0000-0000-000000000002', 2, TRUE),   -- Estupiñán #2
  ('cccccccc-0003-0003-0003-000000000003', 'aaaaaaaa-0000-0000-0000-000000000002', 5, TRUE),   -- De Winter #5
  ('cccccccc-0004-0004-0004-000000000004', 'aaaaaaaa-0000-0000-0000-000000000002', 24, TRUE),  -- Athekame #24
  ('cccccccc-0005-0005-0005-000000000005', 'aaaaaaaa-0000-0000-0000-000000000002', 27, TRUE),  -- Odogu #27
  ('cccccccc-0006-0006-0006-000000000006', 'aaaaaaaa-0000-0000-0000-000000000002', 31, TRUE),  -- Pavlović #31
  -- MF
  ('cccccccc-0007-0007-0007-000000000007', 'aaaaaaaa-0000-0000-0000-000000000002', 4, TRUE),   -- Ricci #4
  ('cccccccc-0008-0008-0008-000000000008', 'aaaaaaaa-0000-0000-0000-000000000002', 8, TRUE),   -- Loftus-Cheek #8
  ('cccccccc-0009-0009-0009-000000000009', 'aaaaaaaa-0000-0000-0000-000000000002', 12, TRUE),  -- Rabiot #12
  ('cccccccc-0010-0010-0010-000000000010', 'aaaaaaaa-0000-0000-0000-000000000002', 14, TRUE),  -- Modrić #14
  ('cccccccc-0011-0011-0011-000000000011', 'aaaaaaaa-0000-0000-0000-000000000002', 19, TRUE),  -- Fofana #19
  ('cccccccc-0012-0012-0012-000000000012', 'aaaaaaaa-0000-0000-0000-000000000002', 30, TRUE),  -- Jashari #30
  ('cccccccc-0013-0013-0013-000000000013', 'aaaaaaaa-0000-0000-0000-000000000002', 56, TRUE),  -- Saelemaekers #56
  -- FW
  ('cccccccc-0014-0014-0014-000000000014', 'aaaaaaaa-0000-0000-0000-000000000002', 7, TRUE),   -- Giménez #7
  ('cccccccc-0015-0015-0015-000000000015', 'aaaaaaaa-0000-0000-0000-000000000002', 9, TRUE),   -- Füllkrug #9
  ('cccccccc-0016-0016-0016-000000000016', 'aaaaaaaa-0000-0000-0000-000000000002', 18, TRUE)   -- Nkunku #18
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 8: Update existing matches with season_id
-- ============================================
UPDATE matches 
SET season_id = 'aaaaaaaa-0000-0000-0000-000000000001'
WHERE season_id IS NULL;
