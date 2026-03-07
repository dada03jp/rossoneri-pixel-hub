-- =====================================================================
-- PIXEL HUB - マイグレーション: team_id カラム追加
-- 
-- 目的: matches / players テーブルにマルチチーム対応の team_id を追加
-- 安全性: IF NOT EXISTS / WHERE NULL で冪等、既存データを壊しません
--
-- ⚠️ 本番の Supabase SQL Editor で実行してください
-- =====================================================================

-- =====================================================
-- 1. matches テーブルに team_id 追加
-- =====================================================
ALTER TABLE matches ADD COLUMN IF NOT EXISTS team_id TEXT DEFAULT 'milan';

-- 既存レコードを初期化
UPDATE matches SET team_id = 'milan' WHERE team_id IS NULL;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_matches_team_id ON matches(team_id);

-- =====================================================
-- 2. players テーブルに team_id 追加
-- =====================================================
ALTER TABLE players ADD COLUMN IF NOT EXISTS team_id TEXT DEFAULT 'milan';

-- 既存レコードを初期化
UPDATE players SET team_id = 'milan' WHERE team_id IS NULL;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);

-- =====================================================
-- 3. player_season_stats View を team_id 対応に更新
-- =====================================================
CREATE OR REPLACE VIEW player_season_stats AS
SELECT
  p.id AS player_id,
  p.name,
  p.number,
  p.position,
  p.is_active,
  p.pixel_config,
  p.team_id,
  COALESCE(ROUND(r_agg.avg_score::numeric, 2), 0) AS avg_rating,
  COALESCE(r_agg.rated_matches, 0) AS rated_matches,
  COALESCE(r_agg.total_ratings, 0) AS total_ratings,
  COALESCE(e_agg.goals, 0) AS goals,
  COALESCE(e_agg.yellow_cards, 0) AS yellow_cards,
  COALESCE(e_agg.red_cards, 0) AS red_cards,
  COALESCE(a_agg.assists, 0) AS assists,
  COALESCE(l_agg.appearances, 0) AS appearances
FROM players p
LEFT JOIN (
  SELECT player_id, AVG(score) AS avg_score,
    COUNT(DISTINCT match_id) AS rated_matches, COUNT(*) AS total_ratings
  FROM ratings GROUP BY player_id
) r_agg ON r_agg.player_id = p.id
LEFT JOIN (
  SELECT player_id,
    COUNT(*) FILTER (WHERE event_type = 'goal') AS goals,
    COUNT(*) FILTER (WHERE event_type = 'yellow_card') AS yellow_cards,
    COUNT(*) FILTER (WHERE event_type = 'red_card') AS red_cards
  FROM match_events GROUP BY player_id
) e_agg ON e_agg.player_id = p.id
LEFT JOIN (
  SELECT details->>'assisted_by' AS assist_name, COUNT(*) AS assists
  FROM match_events
  WHERE event_type = 'goal' AND details->>'assisted_by' IS NOT NULL
  GROUP BY details->>'assisted_by'
) a_agg ON a_agg.assist_name = p.name
LEFT JOIN (
  SELECT player_id, COUNT(DISTINCT match_id) AS appearances
  FROM match_lineups GROUP BY player_id
) l_agg ON l_agg.player_id = p.id
WHERE p.is_active = TRUE;

-- =====================================================
-- 完了
-- =====================================================
SELECT 'migration_add_team_id complete' AS status;
