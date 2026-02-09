-- AC MILAN PIXEL HUB - 2025-26シーズン選手データ追加
-- 
-- ⚠️ 実行方法: Supabaseで新しいクエリタブを開いてペースト
--
-- このSQLは2025-26シーズンの新加入選手をplayersテーブルに追加します
-- supabase-match-lineups.sql の前に実行してください

-- ============================================
-- 2025-26シーズン 新加入選手
-- ============================================
INSERT INTO players (id, name, number, position, pixel_config) VALUES
  -- Goalkeepers
  ('a5260001-0001-0001-0001-000000000001', 'Pietro Terracciano', 1, 'GK', '{"skinTone": "light", "hairStyle": "short", "hairColor": "brown"}'),
  
  -- Defenders
  ('a5260002-0002-0002-0002-000000000002', 'Pervis Estupiñán', 2, 'DF', '{"skinTone": "medium", "hairStyle": "short", "hairColor": "black"}'),
  ('a5260003-0003-0003-0003-000000000003', 'Koni De Winter', 5, 'DF', '{"skinTone": "light", "hairStyle": "short", "hairColor": "brown"}'),
  ('a5260004-0004-0004-0004-000000000004', 'Zachary Athekame', 24, 'DF', '{"skinTone": "dark", "hairStyle": "short", "hairColor": "black"}'),
  ('a5260005-0005-0005-0005-000000000005', 'David Odogu', 27, 'DF', '{"skinTone": "dark", "hairStyle": "short", "hairColor": "black"}'),
  ('a5260006-0006-0006-0006-000000000006', 'Strahinja Pavlovic', 31, 'DF', '{"skinTone": "light", "hairStyle": "short", "hairColor": "brown"}'),
  ('a5260007-0007-0007-0007-000000000007', 'Davide Bartesaghi', 33, 'DF', '{"skinTone": "light", "hairStyle": "short", "hairColor": "brown"}'),
  
  -- Midfielders
  ('a5260008-0008-0008-0008-000000000008', 'Samuele Ricci', 4, 'MF', '{"skinTone": "light", "hairStyle": "short", "hairColor": "brown"}'),
  ('a5260009-0009-0009-0009-000000000009', 'Ruben Loftus-Cheek', 8, 'MF', '{"skinTone": "dark", "hairStyle": "short", "hairColor": "black"}'),
  ('a526000a-000a-000a-000a-00000000000a', 'Adrien Rabiot', 12, 'MF', '{"skinTone": "light", "hairStyle": "short", "hairColor": "brown"}'),
  ('a526000b-000b-000b-000b-00000000000b', 'Luka Modric', 14, 'MF', '{"skinTone": "light", "hairStyle": "medium", "hairColor": "blonde"}'),
  ('a526000c-000c-000c-000c-00000000000c', 'Youssouf Fofana', 19, 'MF', '{"skinTone": "dark", "hairStyle": "short", "hairColor": "black"}'),
  ('a526000d-000d-000d-000d-00000000000d', 'Ardon Jashari', 30, 'MF', '{"skinTone": "light", "hairStyle": "short", "hairColor": "brown"}'),
  ('a526000e-000e-000e-000e-00000000000e', 'Alexis Saelemaekers', 56, 'MF', '{"skinTone": "light", "hairStyle": "short", "hairColor": "brown"}'),
  
  -- Forwards
  ('a526000f-000f-000f-000f-00000000000f', 'Santiago Giménez', 7, 'FW', '{"skinTone": "medium", "hairStyle": "short", "hairColor": "brown"}'),
  ('a5260010-0010-0010-0010-000000000010', 'Niclas Füllkrug', 9, 'FW', '{"skinTone": "light", "hairStyle": "short", "hairColor": "blonde"}'),
  ('a5260011-0011-0011-0011-000000000011', 'Christopher Nkunku', 18, 'FW', '{"skinTone": "dark", "hairStyle": "short", "hairColor": "black"}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  number = EXCLUDED.number,
  position = EXCLUDED.position,
  pixel_config = EXCLUDED.pixel_config;

-- ============================================
-- 既存選手の更新（残留選手）
-- ============================================
-- Maignan (16), Tomori (23), Gabbia (46), Pulisic (11), Leão (10) は既に登録済み

-- Matteo Gabbiaの番号を更新（既に追加済みの場合）
UPDATE players SET number = 46 WHERE name = 'Matteo Gabbia';

-- ============================================
-- 確認クエリ
-- ============================================
SELECT id, name, number, position FROM players ORDER BY position, number;
