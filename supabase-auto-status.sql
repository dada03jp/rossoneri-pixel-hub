-- =====================================================================
-- ROSSONERI PIXEL HUB - 自動ステータス更新ロジック
--
-- ⚠️ supabase-v2-migration.sql の後に実行してください
-- ⚠️ Free プランのため pg_cron は使用せず、
--    Vercel Cron Jobs (API Route) で定期呼び出しします
-- =====================================================================

-- =====================================================
-- 1. 自動ステータス更新関数
-- =====================================================
CREATE OR REPLACE FUNCTION update_match_statuses()
RETURNS TABLE(
  updated_id UUID,
  opponent TEXT,
  old_status match_status,
  new_status match_status
) AS $$
BEGIN
  -- upcoming → live: キックオフ時刻を過ぎた試合
  RETURN QUERY
  WITH updated AS (
    UPDATE matches
    SET status = 'live'::match_status
    WHERE status = 'upcoming'
      AND match_date <= NOW()
    RETURNING id, opponent_name, 'upcoming'::match_status AS old, 'live'::match_status AS new
  )
  SELECT id, opponent_name, old, new FROM updated;

  -- ※ live → finished は自動化しない
  -- 管理者が管理画面から手動で「試合終了」を押す運用
  -- 120分経過した試合は管理画面でアラート表示される
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. 管理画面用ビュー: 試合終了確認待ち
-- =====================================================
CREATE OR REPLACE VIEW admin_pending_matches AS
SELECT
  id,
  opponent_name,
  match_date,
  status,
  home_score,
  away_score,
  is_home,
  competition,
  formation,
  ROUND(EXTRACT(EPOCH FROM (NOW() - match_date)) / 60) AS minutes_since_kickoff,
  CASE
    WHEN EXTRACT(EPOCH FROM (NOW() - match_date)) / 60 > 120 THEN TRUE
    ELSE FALSE
  END AS should_confirm_finished
FROM matches
WHERE status = 'live'
ORDER BY match_date ASC;

-- =====================================================
-- 3. 管理画面用ビュー: 直近試合一覧
-- =====================================================
CREATE OR REPLACE VIEW admin_match_overview AS
SELECT
  m.id,
  m.opponent_name,
  m.match_date,
  m.status,
  m.is_finished,
  m.home_score,
  m.away_score,
  m.is_home,
  m.competition,
  m.formation,
  m.external_id,
  (SELECT COUNT(*) FROM match_lineups ml WHERE ml.match_id = m.id) AS lineup_count,
  (SELECT COUNT(*) FROM match_events me WHERE me.match_id = m.id) AS event_count,
  (SELECT COUNT(DISTINCT user_id) FROM ratings r WHERE r.match_id = m.id) AS rater_count
FROM matches m
ORDER BY m.match_date DESC;

-- =====================================================
-- 確認
-- =====================================================
SELECT 'Auto-status functions created' AS status;
SELECT * FROM admin_pending_matches;
