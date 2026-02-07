-- ROSSONERI PIXEL HUB Database Schema
-- Run this in Supabase SQL Editor

-- Profiles: ユーザー情報
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Matches: 試合データ
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opponent_name TEXT NOT NULL,
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  home_score INT,
  away_score INT,
  is_finished BOOLEAN DEFAULT FALSE,
  competition TEXT
);

-- Players: 選手マスタとドット絵設定
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  number INT NOT NULL,
  position TEXT,
  pixel_config JSONB
);

-- Match Players: 試合出場選手
CREATE TABLE IF NOT EXISTS match_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  is_starter BOOLEAN DEFAULT TRUE
);

-- Ratings: 採点データ
CREATE TABLE IF NOT EXISTS ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  score DECIMAL(3,1) NOT NULL CHECK (score >= 1.0 AND score <= 10.0),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, match_id, player_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: 誰でも読み取り可能
CREATE POLICY "Public read access for matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Public read access for players" ON players FOR SELECT USING (true);
CREATE POLICY "Public read access for match_players" ON match_players FOR SELECT USING (true);
CREATE POLICY "Public read access for ratings" ON ratings FOR SELECT USING (true);
CREATE POLICY "Public read access for profiles" ON profiles FOR SELECT USING (true);

-- RLS Policies: 認証済みユーザーのみ書き込み可能  
CREATE POLICY "Authenticated users can insert ratings" ON ratings 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ratings" ON ratings 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Insert sample data: Players
INSERT INTO players (id, name, number, position, pixel_config) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Mike Maignan', 16, 'GK', '{"skinTone": "dark", "hairStyle": "short", "hairColor": "black"}'),
  ('22222222-2222-2222-2222-222222222222', 'Davide Calabria', 2, 'DF', '{"skinTone": "light", "hairStyle": "short", "hairColor": "brown"}'),
  ('33333333-3333-3333-3333-333333333333', 'Fikayo Tomori', 23, 'DF', '{"skinTone": "dark", "hairStyle": "short", "hairColor": "black"}'),
  ('44444444-4444-4444-4444-444444444444', 'Malick Thiaw', 28, 'DF', '{"skinTone": "dark", "hairStyle": "short", "hairColor": "black"}'),
  ('55555555-5555-5555-5555-555555555555', 'Theo Hernández', 19, 'DF', '{"skinTone": "medium", "hairStyle": "medium", "hairColor": "brown"}'),
  ('66666666-6666-6666-6666-666666666666', 'Ismaël Bennacer', 4, 'MF', '{"skinTone": "medium", "hairStyle": "short", "hairColor": "black"}'),
  ('77777777-7777-7777-7777-777777777777', 'Tijjani Reijnders', 14, 'MF', '{"skinTone": "light", "hairStyle": "medium", "hairColor": "brown"}'),
  ('88888888-8888-8888-8888-888888888888', 'Christian Pulisic', 11, 'MF', '{"skinTone": "light", "hairStyle": "short", "hairColor": "brown"}'),
  ('99999999-9999-9999-9999-999999999999', 'Rafael Leão', 10, 'FW', '{"skinTone": "dark", "hairStyle": "afro", "hairColor": "black"}'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Álvaro Morata', 7, 'FW', '{"skinTone": "light", "hairStyle": "short", "hairColor": "brown"}'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Samuel Chukwueze', 21, 'FW', '{"skinTone": "dark", "hairStyle": "short", "hairColor": "black"}')
ON CONFLICT DO NOTHING;

-- Insert sample data: Matches
INSERT INTO matches (id, opponent_name, match_date, home_score, away_score, is_finished, competition) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Juventus', '2026-02-10 20:45:00+00', 2, 1, TRUE, 'Serie A'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Inter', '2026-02-17 20:45:00+00', NULL, NULL, FALSE, 'Serie A'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Napoli', '2026-02-03 18:00:00+00', 3, 0, TRUE, 'Serie A'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Real Madrid', '2026-02-24 21:00:00+00', NULL, NULL, FALSE, 'UCL'),
  ('00000000-0000-0000-0000-000000000001', 'Roma', '2026-01-28 15:00:00+00', 1, 1, TRUE, 'Serie A')
ON CONFLICT DO NOTHING;

-- Insert sample data: Match Players (link players to finished matches)
INSERT INTO match_players (match_id, player_id, is_starter) 
SELECT m.id, p.id, TRUE
FROM matches m
CROSS JOIN players p
WHERE m.is_finished = TRUE
ON CONFLICT DO NOTHING;
