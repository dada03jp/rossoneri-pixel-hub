-- AC MILAN PIXEL HUB - DBデバッグ用クエリ
-- 
-- このSQLを実行して、DBの現在の状態を確認してください

-- ============================================
-- 1. 全選手一覧を確認
-- ============================================
SELECT id, name, number, position 
FROM players 
ORDER BY position, number;

-- ============================================
-- 2. 特定の選手が存在するか確認
-- ============================================
SELECT name, id FROM players 
WHERE name IN (
    'Mike Maignan',
    'Koni De Winter',
    'Matteo Gabbia',
    'Strahinja Pavlovic',
    'Zachary Athekame',
    'Youssouf Fofana',
    'Luka Modric',
    'Adrien Rabiot',
    'Davide Bartesaghi',
    'Ruben Loftus-Cheek',
    'Christopher Nkunku'
);

-- ============================================
-- 3. Bologna戦のmatch_playersを確認
-- ============================================
SELECT 
    m.opponent_name,
    m.match_date,
    p.name,
    p.number
FROM match_players mp
JOIN matches m ON mp.match_id = m.id
JOIN players p ON mp.player_id = p.id
WHERE m.opponent_name LIKE '%Bologna%' OR m.opponent_name LIKE '%ボローニャ%'
ORDER BY p.number;

-- ============================================
-- 4. 選手数が少ない試合を確認
-- ============================================
SELECT 
    m.opponent_name,
    m.match_date,
    COUNT(mp.id) AS player_count
FROM matches m
LEFT JOIN match_players mp ON mp.match_id = m.id
WHERE m.is_finished = TRUE
GROUP BY m.id, m.opponent_name, m.match_date
ORDER BY m.match_date DESC;
