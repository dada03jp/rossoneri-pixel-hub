-- AC MILAN PIXEL HUB - 試合ごとのラインナップ (match_players)
-- 
-- ⚠️ 実行方法: Supabaseで新しいクエリタブを開いてペースト
--
-- このSQLは各試合のスターティングラインナップをmatch_playersテーブルに追加します
-- 2025-26シーズン 最新スカッドに基づく

-- 2025-26シーズンの現在のスカッド（参考）：
-- GK: Maignan(16), Terracciano(1), Torriani(96)
-- DF: Estupiñan(2), De Winter(5), Athekame(24), Odogu(27), Tomori(23), Gabbia(46), Pavlović(31), Bartesaghi(33)
-- MF: Ricci(4), Modrić(14), Jashari(30), Rabiot(12), Pulisic(11), Loftus-Cheek(8), Fofana(19), Saelemaekers(56)
-- FW: Nkunku(18), Füllkrug(9), Leão(10), Giménez(7)

-- 退団した選手（これらは使用しない）:
-- Hernández, Calabria, Reijnders, Thiaw, Chukwueze, Morata, Bennacer, Royal

-- まず既存のmatch_playersデータを削除（重複防止）
DELETE FROM match_players;

-- ============================================
-- Bologna戦 (2026-02-05) - Away 3-0 勝利
-- 公式ラインナップ: 
-- Maignan; De Winter, Gabbia, Pavlović; Athekame, Fofana, Modrić, Rabiot, Bartesaghi; Loftus-Cheek, Nkunku
-- Formation: 3-5-2
-- ============================================
INSERT INTO match_players (match_id, player_id, is_starter)
SELECT m.id, p.id, TRUE
FROM matches m
CROSS JOIN players p
WHERE (m.opponent_name LIKE '%Bologna%' OR m.opponent_name LIKE '%ボローニャ%')
  AND m.match_date >= '2026-02-01'
  AND m.match_date < '2026-02-10'
  AND p.name IN (
    'Mike Maignan',           -- GK
    'Koni De Winter',         -- DF
    'Matteo Gabbia',          -- DF
    'Strahinja Pavlovic',     -- DF
    'Zachary Athekame',       -- MF/DF
    'Youssouf Fofana',        -- MF
    'Luka Modric',            -- MF
    'Adrien Rabiot',          -- MF
    'Davide Bartesaghi',      -- MF/DF
    'Ruben Loftus-Cheek',     -- FW
    'Christopher Nkunku'      -- FW
  );

-- ============================================
-- Roma戦 (2026-01-26) - Away 1-1 引き分け
-- Formation: 4-3-3
-- ============================================
INSERT INTO match_players (match_id, player_id, is_starter)
SELECT m.id, p.id, TRUE
FROM matches m
CROSS JOIN players p
WHERE (m.opponent_name LIKE '%Roma%' OR m.opponent_name LIKE '%ローマ%')
  AND m.match_date >= '2026-01-20'
  AND m.match_date < '2026-01-30'
  AND p.name IN (
    'Mike Maignan',           -- GK
    'Pervis Estupiñán',       -- DF
    'Fikayo Tomori',          -- DF
    'Matteo Gabbia',          -- DF
    'Davide Bartesaghi',      -- DF
    'Youssouf Fofana',        -- MF
    'Samuele Ricci',          -- MF
    'Luka Modric',            -- MF
    'Rafael Leão',            -- FW
    'Christopher Nkunku',     -- FW
    'Christian Pulisic'       -- FW
  );

-- ============================================
-- Lecce戦 (2026-01-18) - Home 1-0 勝利
-- Formation: 4-3-3
-- ============================================
INSERT INTO match_players (match_id, player_id, is_starter)
SELECT m.id, p.id, TRUE
FROM matches m
CROSS JOIN players p
WHERE (m.opponent_name LIKE '%Lecce%' OR m.opponent_name LIKE '%レッチェ%')
  AND m.match_date >= '2026-01-15'
  AND m.match_date < '2026-01-20'
  AND p.name IN (
    'Mike Maignan',           -- GK
    'Pervis Estupiñán',       -- DF
    'Fikayo Tomori',          -- DF
    'Matteo Gabbia',          -- DF
    'Davide Bartesaghi',      -- DF
    'Youssouf Fofana',        -- MF
    'Samuele Ricci',          -- MF
    'Ardon Jashari',          -- MF
    'Rafael Leão',            -- FW
    'Christian Pulisic',      -- FW
    'Alexis Saelemaekers'     -- FW
  );

-- ============================================
-- Como戦 (2026-01-15) - Away 1-3 勝利
-- Formation: 4-3-3
-- ============================================
INSERT INTO match_players (match_id, player_id, is_starter)
SELECT m.id, p.id, TRUE
FROM matches m
CROSS JOIN players p
WHERE (m.opponent_name LIKE '%Como%' OR m.opponent_name LIKE '%コモ%')
  AND m.match_date >= '2026-01-10'
  AND m.match_date < '2026-01-17'
  AND p.name IN (
    'Mike Maignan',           -- GK
    'Pervis Estupiñán',       -- DF
    'Koni De Winter',         -- DF
    'Strahinja Pavlovic',     -- DF
    'Davide Bartesaghi',      -- DF
    'Youssouf Fofana',        -- MF
    'Adrien Rabiot',          -- MF
    'Luka Modric',            -- MF
    'Rafael Leão',            -- FW
    'Christopher Nkunku',     -- FW
    'Christian Pulisic'       -- FW
  );

-- ============================================
-- Fiorentina戦 (2026-01-11) - Away 1-1 引き分け
-- Formation: 4-3-3
-- ============================================
INSERT INTO match_players (match_id, player_id, is_starter)
SELECT m.id, p.id, TRUE
FROM matches m
CROSS JOIN players p
WHERE (m.opponent_name LIKE '%Fiorentina%' OR m.opponent_name LIKE '%フィオレンティーナ%')
  AND m.match_date >= '2026-01-08'
  AND m.match_date < '2026-01-15'
  AND p.name IN (
    'Mike Maignan',           -- GK
    'Pervis Estupiñán',       -- DF
    'Fikayo Tomori',          -- DF
    'Matteo Gabbia',          -- DF
    'Davide Bartesaghi',      -- DF
    'Youssouf Fofana',        -- MF
    'Samuele Ricci',          -- MF
    'Adrien Rabiot',          -- MF
    'Rafael Leão',            -- FW
    'Santiago Giménez',       -- FW
    'Christian Pulisic'       -- FW
  );

-- ============================================
-- Genoa戦 (2026-01-08) - Away 1-1 引き分け
-- Formation: 4-3-3
-- ============================================
INSERT INTO match_players (match_id, player_id, is_starter)
SELECT m.id, p.id, TRUE
FROM matches m
CROSS JOIN players p
WHERE (m.opponent_name LIKE '%Genoa%' OR m.opponent_name LIKE '%ジェノア%')
  AND m.match_date >= '2026-01-05'
  AND m.match_date < '2026-01-10'
  AND p.name IN (
    'Mike Maignan',           -- GK
    'Pervis Estupiñán',       -- DF
    'Koni De Winter',         -- DF
    'Strahinja Pavlovic',     -- DF
    'Davide Bartesaghi',      -- DF
    'Youssouf Fofana',        -- MF
    'Samuele Ricci',          -- MF
    'Luka Modric',            -- MF
    'Rafael Leão',            -- FW
    'Niclas Füllkrug',        -- FW
    'Christian Pulisic'       -- FW
  );

-- ============================================
-- Cagliari戦 (2026-01-02) - Away 0-1 敗北
-- Formation: 4-3-3
-- ============================================
INSERT INTO match_players (match_id, player_id, is_starter)
SELECT m.id, p.id, TRUE
FROM matches m
CROSS JOIN players p
WHERE (m.opponent_name LIKE '%Cagliari%' OR m.opponent_name LIKE '%カリアリ%')
  AND m.match_date >= '2025-12-30'
  AND m.match_date < '2026-01-05'
  AND p.name IN (
    'Mike Maignan',           -- GK
    'Pervis Estupiñán',       -- DF
    'Fikayo Tomori',          -- DF
    'Matteo Gabbia',          -- DF
    'Davide Bartesaghi',      -- DF
    'Youssouf Fofana',        -- MF
    'Ardon Jashari',          -- MF
    'Adrien Rabiot',          -- MF
    'Rafael Leão',            -- FW
    'Christopher Nkunku',     -- FW
    'Alexis Saelemaekers'     -- FW
  );

-- ============================================
-- Hellas Verona戦 (2025-12-28) - Home 3-0 勝利
-- Formation: 4-3-3
-- ============================================
INSERT INTO match_players (match_id, player_id, is_starter)
SELECT m.id, p.id, TRUE
FROM matches m
CROSS JOIN players p
WHERE (m.opponent_name LIKE '%Verona%' OR m.opponent_name LIKE '%ヴェローナ%')
  AND m.match_date >= '2025-12-25'
  AND m.match_date < '2025-12-30'
  AND p.name IN (
    'Mike Maignan',           -- GK
    'Pervis Estupiñán',       -- DF
    'Koni De Winter',         -- DF
    'Strahinja Pavlovic',     -- DF
    'Davide Bartesaghi',      -- DF
    'Youssouf Fofana',        -- MF
    'Samuele Ricci',          -- MF
    'Luka Modric',            -- MF
    'Rafael Leão',            -- FW
    'Santiago Giménez',       -- FW
    'Christian Pulisic'       -- FW
  );

-- ============================================
-- Sassuolo戦 (2025-12-14) - Home 2-2 引き分け
-- Formation: 4-3-3
-- ============================================
INSERT INTO match_players (match_id, player_id, is_starter)
SELECT m.id, p.id, TRUE
FROM matches m
CROSS JOIN players p
WHERE (m.opponent_name LIKE '%Sassuolo%' OR m.opponent_name LIKE '%サッスオーロ%')
  AND m.match_date >= '2025-12-10'
  AND m.match_date < '2025-12-18'
  AND p.name IN (
    'Mike Maignan',           -- GK
    'Pervis Estupiñán',       -- DF
    'Fikayo Tomori',          -- DF
    'Matteo Gabbia',          -- DF
    'Davide Bartesaghi',      -- DF
    'Youssouf Fofana',        -- MF
    'Adrien Rabiot',          -- MF
    'Ardon Jashari',          -- MF
    'Rafael Leão',            -- FW
    'Niclas Füllkrug',        -- FW
    'Christian Pulisic'       -- FW
  );

-- ============================================
-- Torino戦 (2025-12-08) - Away 2-3 敗北
-- Formation: 4-3-3
-- ============================================
INSERT INTO match_players (match_id, player_id, is_starter)
SELECT m.id, p.id, TRUE
FROM matches m
CROSS JOIN players p
WHERE (m.opponent_name LIKE '%Torino%' OR m.opponent_name LIKE '%トリノ%')
  AND m.match_date >= '2025-12-05'
  AND m.match_date < '2025-12-10'
  AND p.name IN (
    'Mike Maignan',           -- GK
    'Pervis Estupiñán',       -- DF
    'Koni De Winter',         -- DF
    'Strahinja Pavlovic',     -- DF
    'Zachary Athekame',       -- DF
    'Youssouf Fofana',        -- MF
    'Samuele Ricci',          -- MF
    'Luka Modric',            -- MF
    'Rafael Leão',            -- FW
    'Christopher Nkunku',     -- FW
    'Christian Pulisic'       -- FW
  );

-- ============================================
-- Lazio戦 (2025-11-29) - Home 1-0 勝利
-- Formation: 4-3-3
-- ============================================
INSERT INTO match_players (match_id, player_id, is_starter)
SELECT m.id, p.id, TRUE
FROM matches m
CROSS JOIN players p
WHERE (m.opponent_name LIKE '%Lazio%' OR m.opponent_name LIKE '%ラツィオ%')
  AND m.match_date >= '2025-11-25'
  AND m.match_date < '2025-12-05'
  AND p.name IN (
    'Mike Maignan',           -- GK
    'Pervis Estupiñán',       -- DF
    'Fikayo Tomori',          -- DF
    'Matteo Gabbia',          -- DF
    'Davide Bartesaghi',      -- DF
    'Youssouf Fofana',        -- MF
    'Samuele Ricci',          -- MF
    'Adrien Rabiot',          -- MF
    'Rafael Leão',            -- FW
    'Christopher Nkunku',     -- FW
    'Christian Pulisic'       -- FW
  );

-- ============================================
-- Inter戦 (2025-11-23) - Away 0-1 敗北
-- Formation: 4-3-3
-- ============================================
INSERT INTO match_players (match_id, player_id, is_starter)
SELECT m.id, p.id, TRUE
FROM matches m
CROSS JOIN players p
WHERE (m.opponent_name LIKE '%Inter%' OR m.opponent_name LIKE '%インテル%')
  AND m.match_date >= '2025-11-20'
  AND m.match_date < '2025-11-25'
  AND p.name IN (
    'Mike Maignan',           -- GK
    'Pervis Estupiñán',       -- DF
    'Fikayo Tomori',          -- DF
    'Strahinja Pavlovic',     -- DF
    'Davide Bartesaghi',      -- DF
    'Youssouf Fofana',        -- MF
    'Adrien Rabiot',          -- MF
    'Luka Modric',            -- MF
    'Rafael Leão',            -- FW
    'Santiago Giménez',       -- FW
    'Christian Pulisic'       -- FW
  );

-- ============================================
-- Parma戦 (2025-11-08) - Home 2-2 引き分け
-- Formation: 4-3-3
-- ============================================
INSERT INTO match_players (match_id, player_id, is_starter)
SELECT m.id, p.id, TRUE
FROM matches m
CROSS JOIN players p
WHERE (m.opponent_name LIKE '%Parma%' OR m.opponent_name LIKE '%パルマ%')
  AND m.match_date >= '2025-11-05'
  AND m.match_date < '2025-11-12'
  AND p.name IN (
    'Mike Maignan',           -- GK
    'Pervis Estupiñán',       -- DF
    'Koni De Winter',         -- DF
    'Matteo Gabbia',          -- DF
    'Zachary Athekame',       -- DF
    'Youssouf Fofana',        -- MF
    'Samuele Ricci',          -- MF
    'Ardon Jashari',          -- MF
    'Rafael Leão',            -- FW
    'Niclas Füllkrug',        -- FW
    'Alexis Saelemaekers'     -- FW
  );

-- ============================================
-- Roma戦 (2025-11-02) - Home 1-0 勝利
-- Formation: 4-3-3
-- ============================================
INSERT INTO match_players (match_id, player_id, is_starter)
SELECT m.id, p.id, TRUE
FROM matches m
CROSS JOIN players p
WHERE (m.opponent_name LIKE '%Roma%' OR m.opponent_name LIKE '%ローマ%')
  AND m.match_date >= '2025-10-30'
  AND m.match_date < '2025-11-05'
  AND p.name IN (
    'Mike Maignan',           -- GK
    'Pervis Estupiñán',       -- DF
    'Fikayo Tomori',          -- DF
    'Strahinja Pavlovic',     -- DF
    'Davide Bartesaghi',      -- DF
    'Youssouf Fofana',        -- MF
    'Adrien Rabiot',          -- MF
    'Luka Modric',            -- MF
    'Rafael Leão',            -- FW
    'Santiago Giménez',       -- FW
    'Christian Pulisic'       -- FW
  );

-- ============================================
-- Atalanta戦 (2025-10-28) - Away 1-1 引き分け
-- Formation: 4-3-3
-- ============================================
INSERT INTO match_players (match_id, player_id, is_starter)
SELECT m.id, p.id, TRUE
FROM matches m
CROSS JOIN players p
WHERE (m.opponent_name LIKE '%Atalanta%' OR m.opponent_name LIKE '%アタランタ%')
  AND m.match_date >= '2025-10-25'
  AND m.match_date < '2025-10-30'
  AND p.name IN (
    'Mike Maignan',           -- GK
    'Pervis Estupiñán',       -- DF
    'Koni De Winter',         -- DF
    'Matteo Gabbia',          -- DF
    'Zachary Athekame',       -- DF
    'Youssouf Fofana',        -- MF
    'Samuele Ricci',          -- MF
    'Adrien Rabiot',          -- MF
    'Rafael Leão',            -- FW
    'Christopher Nkunku',     -- FW
    'Christian Pulisic'       -- FW
  );

-- ============================================
-- 確認クエリ: 各試合のラインナップを確認
-- ============================================
SELECT 
    m.opponent_name,
    m.match_date,
    COUNT(mp.id) AS player_count,
    STRING_AGG(p.name, ', ' ORDER BY p.number) AS players
FROM match_players mp
JOIN matches m ON mp.match_id = m.id
JOIN players p ON mp.player_id = p.id
GROUP BY m.id, m.opponent_name, m.match_date
ORDER BY m.match_date DESC;
