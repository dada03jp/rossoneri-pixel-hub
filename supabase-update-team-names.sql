-- AC MILAN PIXEL HUB - チーム名をアルファベット表記に更新
-- 
-- ⚠️ 実行方法: Supabaseで新しいクエリタブを開いてペースト
--
-- このSQLはDBに保存されている日本語のチーム名をアルファベット表記に更新します

-- Serie A チーム名更新
UPDATE matches SET opponent_name = 'Atalanta' WHERE opponent_name = 'アタランタ';
UPDATE matches SET opponent_name = 'Bologna' WHERE opponent_name = 'ボローニャ';
UPDATE matches SET opponent_name = 'Cagliari' WHERE opponent_name = 'カリアリ';
UPDATE matches SET opponent_name = 'Como' WHERE opponent_name = 'コモ';
UPDATE matches SET opponent_name = 'Cremonese' WHERE opponent_name = 'クレモネーゼ';
UPDATE matches SET opponent_name = 'Empoli' WHERE opponent_name = 'エンポリ';
UPDATE matches SET opponent_name = 'Fiorentina' WHERE opponent_name = 'フィオレンティーナ';
UPDATE matches SET opponent_name = 'Genoa' WHERE opponent_name = 'ジェノア';
UPDATE matches SET opponent_name = 'Hellas Verona' WHERE opponent_name = 'ヴェローナ';
UPDATE matches SET opponent_name = 'Inter' WHERE opponent_name = 'インテル';
UPDATE matches SET opponent_name = 'Juventus' WHERE opponent_name = 'ユヴェントス';
UPDATE matches SET opponent_name = 'Lazio' WHERE opponent_name = 'ラツィオ';
UPDATE matches SET opponent_name = 'Lecce' WHERE opponent_name = 'レッチェ';
UPDATE matches SET opponent_name = 'Monza' WHERE opponent_name = 'モンツァ';
UPDATE matches SET opponent_name = 'Napoli' WHERE opponent_name = 'ナポリ';
UPDATE matches SET opponent_name = 'Parma' WHERE opponent_name = 'パルマ';
UPDATE matches SET opponent_name = 'Pisa' WHERE opponent_name = 'ピサ';
UPDATE matches SET opponent_name = 'Roma' WHERE opponent_name = 'ローマ';
UPDATE matches SET opponent_name = 'Sassuolo' WHERE opponent_name = 'サッスオーロ';
UPDATE matches SET opponent_name = 'Torino' WHERE opponent_name = 'トリノ';
UPDATE matches SET opponent_name = 'Udinese' WHERE opponent_name = 'ウディネーゼ';
UPDATE matches SET opponent_name = 'Venezia' WHERE opponent_name = 'ヴェネツィア';

-- Champions League / 国際大会チーム名更新
UPDATE matches SET opponent_name = 'Liverpool' WHERE opponent_name = 'リヴァプール';
UPDATE matches SET opponent_name = 'Leverkusen' WHERE opponent_name = 'レバークーゼン';
UPDATE matches SET opponent_name = 'Club Brugge' WHERE opponent_name = 'クラブ・ブルッヘ';
UPDATE matches SET opponent_name = 'Real Madrid' WHERE opponent_name = 'レアル・マドリード';
UPDATE matches SET opponent_name = 'Slovan' WHERE opponent_name = 'スロヴァン';
UPDATE matches SET opponent_name = 'Red Star' WHERE opponent_name = 'レッドスター';
UPDATE matches SET opponent_name = 'Girona' WHERE opponent_name = 'ジローナ';
UPDATE matches SET opponent_name = 'Dinamo Zagreb' WHERE opponent_name = 'ディナモ・ザグレブ';
UPDATE matches SET opponent_name = 'Feyenoord' WHERE opponent_name = 'フェイエノールト';
UPDATE matches SET opponent_name = 'Bari' WHERE opponent_name = 'バーリ';

-- 確認クエリ
SELECT id, opponent_name, match_date FROM matches ORDER BY match_date DESC LIMIT 20;
