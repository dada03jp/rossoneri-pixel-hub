-- AC Milan 25-26シーズン 試合イベントデータ (サンプル - 3試合分)
-- 公式サイトMATCHCENTERから抽出

-- ボローニャ戦 (2026-02-04) - Away 3-0 勝利
-- まず試合IDを確認: SELECT id FROM matches WHERE opponent_name = 'Bologna' AND match_date LIKE '2026-02%';

-- ボローニャ戦イベント
INSERT INTO match_events (match_id, event_type, player_name, minute, details) VALUES
-- ゴール (スコア更新: 試合IDは実際の値に置き換えてください)
('25260123-0123-0123-0123-000000000123', 'goal', 'Ruben Loftus-Cheek', 20, '{"assisted_by": "Adrien Rabiot"}'),
('25260123-0123-0123-0123-000000000123', 'goal', 'Christopher Nkunku', 39, '{"penalty": true}'),
('25260123-0123-0123-0123-000000000123', 'goal', 'Adrien Rabiot', 48, '{}'),
-- イエローカード (ACミランへのカードはなし、ボローニャのカードは除外)
-- 交代
('25260123-0123-0123-0123-000000000123', 'substitution_out', 'Davide Bartesaghi', 75, '{}'),
('25260123-0123-0123-0123-000000000123', 'substitution_in', 'Pervis Estupiñán', 75, '{}'),
('25260123-0123-0123-0123-000000000123', 'substitution_out', 'Luka Modric', 70, '{}'),
('25260123-0123-0123-0123-000000000123', 'substitution_in', 'Ardon Jashari', 70, '{}'),
('25260123-0123-0123-0123-000000000123', 'substitution_out', 'Christopher Nkunku', 70, '{}'),
('25260123-0123-0123-0123-000000000123', 'substitution_in', 'Niclas Füllkrug', 70, '{}'),
('25260123-0123-0123-0123-000000000123', 'substitution_out', 'Ruben Loftus-Cheek', 65, '{}'),
('25260123-0123-0123-0123-000000000123', 'substitution_in', 'Samuele Ricci', 65, '{}'),
('25260123-0123-0123-0123-000000000123', 'substitution_out', 'Zachary Athekame', 65, '{}'),
('25260123-0123-0123-0123-000000000123', 'substitution_in', 'Fikayo Tomori', 65, '{}');

-- matchesテーブルのformation更新
UPDATE matches SET formation = '4-3-3' WHERE id = '25260123-0123-0123-0123-000000000123';

-- ================================

-- ローマ戦 (2026-01-26) - Away 1-1 引き分け
INSERT INTO match_events (match_id, event_type, player_name, minute, details) VALUES
-- ゴール
('25260122-0122-0122-0122-000000000122', 'goal', 'Koni De Winter', 52, '{"assisted_by": "Luka Modric", "header": true}'),
-- イエローカード
('25260122-0122-0122-0122-000000000122', 'yellow_card', 'Adrien Rabiot', 55, '{}'),
('25260122-0122-0122-0122-000000000122', 'yellow_card', 'Zachary Athekame', 58, '{}'),
('25260122-0122-0122-0122-000000000122', 'yellow_card', 'Luka Modric', 72, '{}'),
('25260122-0122-0122-0122-000000000122', 'yellow_card', 'Mike Maignan', 74, '{}'),
-- 交代
('25260122-0122-0122-0122-000000000122', 'substitution_out', 'Rafael Leão', 67, '{}'),
('25260122-0122-0122-0122-000000000122', 'substitution_in', 'Niclas Füllkrug', 67, '{}'),
('25260122-0122-0122-0122-000000000122', 'substitution_out', 'Christopher Nkunku', 67, '{}'),
('25260122-0122-0122-0122-000000000122', 'substitution_in', 'Christian Pulisic', 67, '{}'),
('25260122-0122-0122-0122-000000000122', 'substitution_out', 'Samuele Ricci', 80, '{}'),
('25260122-0122-0122-0122-000000000122', 'substitution_in', 'Ruben Loftus-Cheek', 80, '{}');

-- matchesテーブルのformation更新
UPDATE matches SET formation = '4-3-3' WHERE id = '25260122-0122-0122-0122-000000000122';

-- ================================

-- レッチェ戦 (2026-01-19) - Home 1-0 勝利
INSERT INTO match_events (match_id, event_type, player_name, minute, details) VALUES
-- ゴール
('25260121-0121-0121-0121-000000000121', 'goal', 'Niclas Füllkrug', 62, '{"assisted_by": "Alexis Saelemaekers", "header": true}'),
-- イエローカード (ACミランへのカードはなし)
-- 交代
('25260121-0121-0121-0121-000000000121', 'substitution_out', 'Christian Pulisic', 55, '{}'),
('25260121-0121-0121-0121-000000000121', 'substitution_in', 'Niclas Füllkrug', 55, '{}'),
('25260121-0121-0121-0121-000000000121', 'substitution_out', 'Samuele Ricci', 55, '{}'),
('25260121-0121-0121-0121-000000000121', 'substitution_in', 'Ruben Loftus-Cheek', 55, '{}'),
('25260121-0121-0121-0121-000000000121', 'substitution_out', 'Alexis Saelemaekers', 64, '{}'),
('25260121-0121-0121-0121-000000000121', 'substitution_in', 'Zachary Athekame', 64, '{}'),
('25260121-0121-0121-0121-000000000121', 'substitution_out', 'Rafael Leão', 85, '{}'),
('25260121-0121-0121-0121-000000000121', 'substitution_in', 'Christopher Nkunku', 85, '{}'),
('25260121-0121-0121-0121-000000000121', 'substitution_out', 'Ardon Jashari', 85, '{}'),
('25260121-0121-0121-0121-000000000121', 'substitution_in', 'Luka Modric', 85, '{}');

-- matchesテーブルのformation更新
UPDATE matches SET formation = '4-3-3' WHERE id = '25260121-0121-0121-0121-000000000121';

-- ================================

-- インテル戦 (2025-11-24) - Away 1-0 勝利
INSERT INTO match_events (match_id, event_type, player_name, minute, details) VALUES
-- ゴール
('25260112-0112-0112-0112-000000000112', 'goal', 'Christian Pulisic', 51, '{}'),
-- イエローカード
('25260112-0112-0112-0112-000000000112', 'yellow_card', 'Strahinja Pavlovic', 67, '{}'),
-- 交代
('25260112-0112-0112-0112-000000000112', 'substitution_out', 'Youssouf Fofana', 70, '{}'),
('25260112-0112-0112-0112-000000000112', 'substitution_in', 'Samuele Ricci', 70, '{}'),
('25260112-0112-0112-0112-000000000112', 'substitution_out', 'Christian Pulisic', 70, '{}'),
('25260112-0112-0112-0112-000000000112', 'substitution_in', 'Christopher Nkunku', 70, '{}'),
('25260112-0112-0112-0112-000000000112', 'substitution_out', 'Rafael Leão', 80, '{}'),
('25260112-0112-0112-0112-000000000112', 'substitution_in', 'Ruben Loftus-Cheek', 80, '{}');

-- matchesテーブルのformation更新
UPDATE matches SET formation = '4-3-3' WHERE id = '25260112-0112-0112-0112-000000000112';

-- ================================

-- ナポリ戦 (2025-09-29) - Home 2-1 勝利
INSERT INTO match_events (match_id, event_type, player_name, minute, details) VALUES
-- ゴール
('25260105-0105-0105-0105-000000000105', 'goal', 'Alexis Saelemaekers', 5, '{"assisted_by": "Christian Pulisic"}'),
('25260105-0105-0105-0105-000000000105', 'goal', 'Christian Pulisic', 35, '{"assisted_by": "Youssouf Fofana"}'),
-- レッドカード
('25260105-0105-0105-0105-000000000105', 'red_card', 'Pervis Estupiñán', 47, '{"var_upgraded": true}'),
-- イエローカード
('25260105-0105-0105-0105-000000000105', 'yellow_card', 'Adrien Rabiot', 82, '{}'),
-- 交代
('25260105-0105-0105-0105-000000000105', 'substitution_out', 'Christian Pulisic', 47, '{}'),
('25260105-0105-0105-0105-000000000105', 'substitution_in', 'Davide Bartesaghi', 47, '{}'),
('25260105-0105-0105-0105-000000000105', 'substitution_out', 'Santiago Giménez', 60, '{}'),
('25260105-0105-0105-0105-000000000105', 'substitution_in', 'Rafael Leão', 60, '{}'),
('25260105-0105-0105-0105-000000000105', 'substitution_out', 'Alexis Saelemaekers', 60, '{}'),
('25260105-0105-0105-0105-000000000105', 'substitution_in', 'Zachary Athekame', 60, '{}'),
('25260105-0105-0105-0105-000000000105', 'substitution_out', 'Youssouf Fofana', 75, '{}'),
('25260105-0105-0105-0105-000000000105', 'substitution_in', 'Koni De Winter', 75, '{}'),
('25260105-0105-0105-0105-000000000105', 'substitution_out', 'Fikayo Tomori', 75, '{}'),
('25260105-0105-0105-0105-000000000105', 'substitution_in', 'Ruben Loftus-Cheek', 75, '{}');

-- matchesテーブルのformation更新
UPDATE matches SET formation = '4-3-3' WHERE id = '25260105-0105-0105-0105-000000000105';

-- ================================
-- 試合IDを確認するコマンド:
-- SELECT id, opponent_name, match_date FROM matches WHERE season_id = 'YOUR_SEASON_ID' ORDER BY match_date DESC;

-- ================================

-- ユベントス戦 (2025-09-21) - Away 0-0 引き分け（Pulisic PKミス）
INSERT INTO match_events (match_id, event_type, player_name, minute, details) VALUES
-- イエローカード
('25260106-0106-0106-0106-000000000106', 'yellow_card', 'Youssouf Fofana', 44, '{}'),
('25260106-0106-0106-0106-000000000106', 'yellow_card', 'Davide Bartesaghi', 57, '{}'),
-- 交代
('25260106-0106-0106-0106-000000000106', 'substitution_out', 'Youssouf Fofana', 60, '{}'),
('25260106-0106-0106-0106-000000000106', 'substitution_in', 'Ruben Loftus-Cheek', 60, '{}'),
('25260106-0106-0106-0106-000000000106', 'substitution_out', 'Santiago Giménez', 60, '{}'),
('25260106-0106-0106-0106-000000000106', 'substitution_in', 'Rafael Leão', 60, '{}'),
('25260106-0106-0106-0106-000000000106', 'substitution_out', 'Christian Pulisic', 75, '{}'),
('25260106-0106-0106-0106-000000000106', 'substitution_in', 'Christopher Nkunku', 75, '{}');

-- matchesテーブルのformation更新
UPDATE matches SET formation = '4-3-3' WHERE id = '25260106-0106-0106-0106-000000000106';

-- ================================

-- ラツィオ戦 (2025-12-07) - Home 1-0 勝利
INSERT INTO match_events (match_id, event_type, player_name, minute, details) VALUES
-- ゴール
('25260113-0113-0113-0113-000000000113', 'goal', 'Rafael Leão', 52, '{"assisted_by": "Fikayo Tomori"}'),
-- イエローカード
('25260113-0113-0113-0113-000000000113', 'yellow_card', 'Fikayo Tomori', 25, '{}'),
('25260113-0113-0113-0113-000000000113', 'yellow_card', 'Matteo Gabbia', 58, '{}'),
('25260113-0113-0113-0113-000000000113', 'yellow_card', 'Samuele Ricci', 85, '{}'),
-- 交代
('25260113-0113-0113-0113-000000000113', 'substitution_out', 'Youssouf Fofana', 58, '{}'),
('25260113-0113-0113-0113-000000000113', 'substitution_in', 'Ruben Loftus-Cheek', 58, '{}'),
('25260113-0113-0113-0113-000000000113', 'substitution_out', 'Christopher Nkunku', 75, '{}'),
('25260113-0113-0113-0113-000000000113', 'substitution_in', 'Samuele Ricci', 75, '{}');

-- matchesテーブルのformation更新
UPDATE matches SET formation = '4-3-3' WHERE id = '25260113-0113-0113-0113-000000000113';

-- ================================
-- 使用方法:
-- 1. まず試合IDを確認: SELECT id, opponent_name, match_date FROM matches ORDER BY match_date DESC;
-- 2. MATCH_ID_xxx を実際のIDに置き換え（検索・置換で一括変更）
-- 3. Supabase SQL Editorにコピー&ペーストして実行
