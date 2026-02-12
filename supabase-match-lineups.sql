-- ==========================================
-- 25-26シーズン 全試合ラインナップ一括登録
-- ==========================================

-- ⚠️ 注意: これは標準的なスタメン（4-2-3-1）を未登録の試合に適用するものです。
-- 既に登録済みの試合（Bologna, Roma, Lecce）はスキップされます。

WITH match_list AS (
  SELECT id as match_id 
  FROM matches 
  WHERE season_id = 'aaaaaaaa-0000-0000-0000-000000000002' 
  AND is_finished = true
  AND id NOT IN (SELECT DISTINCT match_id FROM match_lineups) -- 既に登録済みの試合を除外
),
standard_lineup AS (
  SELECT * FROM (VALUES
    ('Mike Maignan', 16, true, 'GK', 50, 90),
    ('Emerson Royal', 22, true, 'DF', 85, 75),
    ('Matteo Gabbia', 46, true, 'DF', 65, 80),
    ('Fikayo Tomori', 23, true, 'DF', 35, 80),
    ('Theo Hernández', 19, true, 'DF', 15, 75),
    ('Youssouf Fofana', 29, true, 'MF', 65, 60),
    ('Tijjani Reijnders', 14, true, 'MF', 35, 60),
    ('Christian Pulisic', 11, true, 'MF', 85, 40),
    ('Ruben Loftus-Cheek', 8, true, 'MF', 50, 45),
    ('Rafael Leão', 10, true, 'MF', 15, 40),
    ('Álvaro Morata', 7, true, 'FW', 50, 20),
    -- Subs
    ('Noah Okafor', 17, false, 'FW', 0, 0),
    ('Samu Chukwueze', 21, false, 'MF', 0, 0),
    ('Yunus Musah', 80, false, 'MF', 0, 0),
    ('Malick Thiaw', 28, false, 'DF', 0, 0),
    ('Davide Calabria', 2, false, 'DF', 0, 0),
    ('Tammy Abraham', 90, false, 'FW', 0, 0),
    ('Marco Sportiello', 57, false, 'GK', 0, 0)
  ) AS t(player_name, jersey_number, is_starter, position_role, position_x, position_y)
)
INSERT INTO match_lineups (match_id, player_name, jersey_number, is_starter, position_role, position_x, position_y)
SELECT 
  m.match_id,
  l.player_name,
  l.jersey_number,
  l.is_starter,
  l.position_role,
  l.position_x,
  l.position_y
FROM match_list m
CROSS JOIN standard_lineup l;

-- フォーメーション設定
UPDATE matches
SET formation = '4-2-3-1'
WHERE season_id = 'aaaaaaaa-0000-0000-0000-000000000002' 
AND is_finished = true
AND formation IS NULL;

-- ゴールイベント自動生成（簡易版：スコアに合わせてランダムに割り当てたいがSQLでは難しいので、主要選手に割り当て）
-- 注: これは複雑すぎるため、まずはラインナップのみ提供します。
