-- =====================================================================
-- ROSSONERI PIXEL HUB - V4 Final Fix Migration
-- 重複排除・フォーメーション管理・マイページ統計拡張
--
-- ⚠️ Supabase SQL Editorで実行してください
-- =====================================================================

-- =====================================================
-- 1. matches テーブル: formation カラム（既存なら無視）
-- =====================================================
ALTER TABLE matches ADD COLUMN IF NOT EXISTS formation TEXT DEFAULT '4-3-3';

-- =====================================================
-- 2. match_lineups テーブル: role/position_side 追加
-- =====================================================
ALTER TABLE match_lineups ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'MF';
ALTER TABLE match_lineups ADD COLUMN IF NOT EXISTS position_side TEXT DEFAULT 'Center';

-- =====================================================
-- 3. player_season_stats View 重複排除修正
-- =====================================================
CREATE OR REPLACE VIEW player_season_stats AS
SELECT
  p.id AS player_id,
  p.name,
  p.number,
  p.position,
  p.is_active,
  p.pixel_config,
  -- 採点統計（ratingsから直接集計）
  COALESCE(ROUND(r_agg.avg_score::numeric, 2), 0) AS avg_rating,
  COALESCE(r_agg.rated_matches, 0) AS rated_matches,
  COALESCE(r_agg.total_ratings, 0) AS total_ratings,
  -- match_events から成績集計
  COALESCE(e_agg.goals, 0) AS goals,
  COALESCE(e_agg.yellow_cards, 0) AS yellow_cards,
  COALESCE(e_agg.red_cards, 0) AS red_cards,
  -- アシスト
  COALESCE(a_agg.assists, 0) AS assists,
  -- 出場数
  COALESCE(l_agg.appearances, 0) AS appearances
FROM players p
-- 採点集計（サブクエリで重複除去）
LEFT JOIN (
  SELECT player_id,
    AVG(score) AS avg_score,
    COUNT(DISTINCT match_id) AS rated_matches,
    COUNT(*) AS total_ratings
  FROM ratings
  GROUP BY player_id
) r_agg ON r_agg.player_id = p.id
-- イベント集計（サブクエリで重複除去）
LEFT JOIN (
  SELECT player_id,
    COUNT(*) FILTER (WHERE event_type = 'goal') AS goals,
    COUNT(*) FILTER (WHERE event_type = 'yellow_card') AS yellow_cards,
    COUNT(*) FILTER (WHERE event_type = 'red_card') AS red_cards
  FROM match_events
  GROUP BY player_id
) e_agg ON e_agg.player_id = p.id
-- アシスト（名前ベース）
LEFT JOIN (
  SELECT details->>'assisted_by' AS assist_name, COUNT(*) AS assists
  FROM match_events
  WHERE event_type = 'goal' AND details->>'assisted_by' IS NOT NULL
  GROUP BY details->>'assisted_by'
) a_agg ON a_agg.assist_name = p.name
-- 出場数
LEFT JOIN (
  SELECT player_id, COUNT(DISTINCT match_id) AS appearances
  FROM match_lineups
  GROUP BY player_id
) l_agg ON l_agg.player_id = p.id
WHERE p.is_active = TRUE;

-- =====================================================
-- 4. get_user_highlights RPC
-- 直近2試合の最高・最低評価選手
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_highlights(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  recent_match_ids UUID[];
BEGIN
  -- 直近2試合のIDを取得
  SELECT ARRAY(
    SELECT DISTINCT r.match_id
    FROM ratings r
    JOIN matches m ON m.id = r.match_id
    WHERE r.user_id = target_user_id
    ORDER BY r.match_id  -- サブクエリではmatch_dateでソートできないため別途
    LIMIT 2
  ) INTO recent_match_ids;

  -- match_dateでソートし直す
  SELECT ARRAY(
    SELECT id FROM matches
    WHERE id = ANY(
      SELECT DISTINCT r.match_id
      FROM ratings r
      WHERE r.user_id = target_user_id
    )
    ORDER BY match_date DESC
    LIMIT 2
  ) INTO recent_match_ids;

  RETURN json_build_object(
    'top', (
      SELECT json_build_object(
        'score', r.score,
        'player_name', p.name,
        'player_number', p.number,
        'opponent_name', m.opponent_name,
        'match_date', m.match_date,
        'comment', r.comment
      )
      FROM ratings r
      JOIN players p ON p.id = r.player_id
      JOIN matches m ON m.id = r.match_id
      WHERE r.user_id = target_user_id
        AND r.match_id = ANY(recent_match_ids)
      ORDER BY r.score DESC
      LIMIT 1
    ),
    'worst', (
      SELECT json_build_object(
        'score', r.score,
        'player_name', p.name,
        'player_number', p.number,
        'opponent_name', m.opponent_name,
        'match_date', m.match_date,
        'comment', r.comment
      )
      FROM ratings r
      JOIN players p ON p.id = r.player_id
      JOIN matches m ON m.id = r.match_id
      WHERE r.user_id = target_user_id
        AND r.match_id = ANY(recent_match_ids)
      ORDER BY r.score ASC
      LIMIT 1
    )
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 5. 確認クエリ
-- =====================================================
SELECT 'V4 Final Fix Migration complete' AS status;

-- View 重複テスト（名前の重複がないか確認）
SELECT name, COUNT(*) AS cnt
FROM player_season_stats
GROUP BY name
HAVING COUNT(*) > 1;

SELECT * FROM player_season_stats ORDER BY avg_rating DESC LIMIT 5;
