-- =====================================================================
-- ROSSONERI PIXEL HUB - V3 Community & Freemium Migration
-- コミュニティ機能・マイページ・有料プラン制限・選手成績View
--
-- ⚠️ Supabase SQL Editorで実行してください
-- ⚠️ 既存テーブル(comment_likes, comment_replies)を活用します
-- =====================================================================

-- =====================================================
-- 1. profiles 拡張: plan_type
-- =====================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free';

-- CHECK制約を安全に追加
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'profiles_plan_type_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_plan_type_check
      CHECK (plan_type IN ('free', 'premium'));
  END IF;
END $$;

-- 既存データ移行: is_premium → plan_type
UPDATE profiles SET plan_type = CASE
  WHEN is_premium = TRUE THEN 'premium'
  ELSE 'free'
END
WHERE plan_type IS NULL OR plan_type = 'free';

-- =====================================================
-- 2. ratings 拡張: user_name 永続化
-- =====================================================
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS user_name TEXT;

-- =====================================================
-- 3. notifications テーブル
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'reply')),
  rating_id UUID REFERENCES ratings(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES comment_replies(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 通知は本人のみ閲覧
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own notifications') THEN
    CREATE POLICY "Users can view own notifications" ON notifications
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- 通知挿入は認証ユーザー
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert notifications') THEN
    CREATE POLICY "Authenticated users can insert notifications" ON notifications
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 本人のみ既読更新
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own notifications') THEN
    CREATE POLICY "Users can update own notifications" ON notifications
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- =====================================================
-- 4. 選手シーズン成績 View
-- =====================================================
CREATE OR REPLACE VIEW player_season_stats AS
SELECT
  p.id AS player_id,
  p.name,
  p.number,
  p.position,
  p.is_active,
  p.pixel_config,
  -- 採点統計
  COALESCE(ROUND(AVG(r.score)::numeric, 2), 0) AS avg_rating,
  COUNT(DISTINCT r.match_id) AS rated_matches,
  COUNT(r.id) AS total_ratings,
  -- match_events からの成績集計
  COUNT(DISTINCT CASE WHEN me.event_type = 'goal' THEN me.id END) AS goals,
  COUNT(DISTINCT CASE WHEN me.event_type = 'yellow_card' THEN me.id END) AS yellow_cards,
  COUNT(DISTINCT CASE WHEN me.event_type = 'red_card' THEN me.id END) AS red_cards,
  -- アシスト: details に assisted_by が自分の名前の場合をカウント
  (
    SELECT COUNT(*)
    FROM match_events me2
    WHERE me2.event_type = 'goal'
      AND me2.details->>'assisted_by' = p.name
  ) AS assists,
  -- 出場数
  COUNT(DISTINCT ml.match_id) AS appearances
FROM players p
LEFT JOIN ratings r ON r.player_id = p.id
LEFT JOIN match_events me ON me.player_id = p.id
LEFT JOIN match_lineups ml ON ml.player_id = p.id
WHERE p.is_active = TRUE
GROUP BY p.id, p.name, p.number, p.position, p.is_active, p.pixel_config;

-- =====================================================
-- 5. Freemium RLS（個別コメント制限）
-- =====================================================

-- 既存ポリシー削除 → 再作成
DROP POLICY IF EXISTS "Public read access for ratings" ON ratings;

-- 集計用: 未ログインでも全コメント閲覧可（View/集計がRLSを通過する必要あり）
-- premium: 全閲覧、free: 直近2試合 + 自分の採点
CREATE POLICY "Ratings read with freemium" ON ratings FOR SELECT USING (
  -- 未ログインは全て閲覧可（集計表示・公開データとして）
  auth.uid() IS NULL
  OR
  -- premium ユーザーは全閲覧
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND plan_type = 'premium'
  )
  OR
  -- free ユーザー: 直近2試合のコメントのみ
  match_id IN (
    SELECT id FROM matches
    WHERE status = 'finished'
    ORDER BY match_date DESC
    LIMIT 2
  )
  OR
  -- 自分の採点は常に見える
  auth.uid() = user_id
);

-- =====================================================
-- 6. マイページ用関数
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_stats(target_user_id UUID)
RETURNS JSON AS $$
SELECT json_build_object(
  'total_ratings', (
    SELECT COUNT(*) FROM ratings WHERE user_id = target_user_id
  ),
  'matches_rated', (
    SELECT COUNT(DISTINCT match_id) FROM ratings WHERE user_id = target_user_id
  ),
  'favorite_player', (
    SELECT json_build_object(
      'name', p.name,
      'number', p.number,
      'avg_score', ROUND(AVG(r.score)::numeric, 1),
      'count', COUNT(*)
    )
    FROM ratings r
    JOIN players p ON p.id = r.player_id
    WHERE r.user_id = target_user_id
    GROUP BY p.id, p.name, p.number
    ORDER BY AVG(r.score) DESC
    LIMIT 1
  ),
  'recent_ratings', (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
      SELECT
        r.score,
        r.comment,
        r.created_at,
        m.opponent_name,
        m.match_date,
        m.is_home,
        p.name AS player_name,
        p.number AS player_number
      FROM ratings r
      JOIN matches m ON m.id = r.match_id
      JOIN players p ON p.id = r.player_id
      WHERE r.user_id = target_user_id
      ORDER BY r.created_at DESC
      LIMIT 10
    ) t
  ),
  'rated_matches', (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
      SELECT DISTINCT ON (m.id)
        m.id,
        m.opponent_name,
        m.match_date,
        m.home_score,
        m.away_score,
        m.is_home,
        m.competition,
        COUNT(r.id) OVER (PARTITION BY m.id) AS player_count,
        ROUND(AVG(r.score) OVER (PARTITION BY m.id)::numeric, 1) AS avg_given
      FROM ratings r
      JOIN matches m ON m.id = r.match_id
      WHERE r.user_id = target_user_id
      ORDER BY m.id, m.match_date DESC
    ) t
    ORDER BY t.match_date DESC
  )
);
$$ LANGUAGE SQL STABLE;

-- =====================================================
-- 7. いいね時の通知トリガー
-- =====================================================
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
  rating_owner_id UUID;
BEGIN
  -- 採点者を取得
  SELECT user_id INTO rating_owner_id
  FROM ratings WHERE id = NEW.rating_id;

  -- 自分自身へのいいねは通知しない
  IF rating_owner_id IS NOT NULL AND rating_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, rating_id)
    VALUES (rating_owner_id, NEW.user_id, 'like', NEW.rating_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_like ON comment_likes;
CREATE TRIGGER trigger_notify_on_like
  AFTER INSERT ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- =====================================================
-- 8. 返信時の通知トリガー
-- =====================================================
CREATE OR REPLACE FUNCTION notify_on_reply()
RETURNS TRIGGER AS $$
DECLARE
  rating_owner_id UUID;
BEGIN
  SELECT user_id INTO rating_owner_id
  FROM ratings WHERE id = NEW.rating_id;

  IF rating_owner_id IS NOT NULL AND rating_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, rating_id, reply_id)
    VALUES (rating_owner_id, NEW.user_id, 'reply', NEW.rating_id, NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_on_reply ON comment_replies;
CREATE TRIGGER trigger_notify_on_reply
  AFTER INSERT ON comment_replies
  FOR EACH ROW EXECUTE FUNCTION notify_on_reply();

-- =====================================================
-- 9. インデックス（パフォーマンス）
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_match_player ON ratings(match_id, player_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- =====================================================
-- 10. 確認クエリ
-- =====================================================
SELECT 'V3 Community Migration complete' AS status;

-- View テスト
SELECT * FROM player_season_stats ORDER BY avg_rating DESC LIMIT 5;
