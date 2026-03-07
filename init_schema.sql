-- =====================================================================
-- PIXEL HUB - 統合スキーマ定義 (init_schema.sql)
-- 
-- 目的: 26個の個別SQLファイルから統合した「正解」のスキーマ
-- 用途: リファレンス / 新環境セットアップ用
-- 特徴: すべて IF NOT EXISTS / CREATE OR REPLACE で冪等
--
-- ⚠️ 本番環境への追加変更は migration_*.sql を使用してください
-- =====================================================================

-- =====================================================
-- 1. 拡張・型
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_status') THEN
    CREATE TYPE match_status AS ENUM ('upcoming', 'live', 'finished');
  END IF;
END $$;

-- =====================================================
-- 2. profiles: ユーザー情報
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  plan_type TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  role TEXT DEFAULT 'user',
  updated_at TIMESTAMPTZ
);

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

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. seasons: シーズン管理
-- =====================================================
CREATE TABLE IF NOT EXISTS seasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  start_year INT NOT NULL,
  end_year INT NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. matches: 試合データ (team_id 対応)
-- =====================================================
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id TEXT DEFAULT 'milan',
  opponent_name TEXT NOT NULL,
  match_date TIMESTAMPTZ NOT NULL,
  home_score INT DEFAULT 0,
  away_score INT DEFAULT 0,
  is_finished BOOLEAN DEFAULT FALSE,
  status match_status DEFAULT 'upcoming',
  competition TEXT,
  season_id UUID REFERENCES seasons(id),
  is_home BOOLEAN DEFAULT TRUE,
  formation TEXT DEFAULT '4-3-3',
  external_id TEXT
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. players: 選手マスタ (team_id 対応)
-- =====================================================
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id TEXT DEFAULT 'milan',
  name TEXT NOT NULL,
  number INT NOT NULL,
  position TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  pixel_config JSONB,
  external_id TEXT
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. player_seasons: 選手×シーズン関連
-- =====================================================
CREATE TABLE IF NOT EXISTS player_seasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  jersey_number INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  joined_date DATE,
  left_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, season_id)
);

ALTER TABLE player_seasons ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. match_players: 試合出場選手
-- =====================================================
CREATE TABLE IF NOT EXISTS match_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  is_starter BOOLEAN DEFAULT TRUE
);

ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. match_events: 試合イベント (ゴール・カード等)
-- =====================================================
CREATE TABLE IF NOT EXISTS match_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'goal', 'assist', 'yellow_card', 'red_card',
    'substitution_in', 'substitution_out'
  )),
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  player_name TEXT,
  minute INT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9. match_lineups: フォーメーション・ラインナップ
-- =====================================================
CREATE TABLE IF NOT EXISTS match_lineups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  player_name TEXT,
  jersey_number INT,
  is_starter BOOLEAN DEFAULT FALSE,
  position_role TEXT CHECK (position_role IN ('GK', 'DF', 'MF', 'FW')),
  role TEXT DEFAULT 'MF',
  position_side TEXT DEFAULT 'Center',
  position_row INT DEFAULT 2,
  position_x INT DEFAULT 50 CHECK (position_x >= 0 AND position_x <= 100),
  position_y INT DEFAULT 50 CHECK (position_y >= 0 AND position_y <= 100),
  minutes_played INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

ALTER TABLE match_lineups ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. ratings: 採点データ
-- =====================================================
CREATE TABLE IF NOT EXISTS ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  score DECIMAL(3,1) NOT NULL CHECK (score >= 1.0 AND score <= 10.0),
  comment TEXT,
  user_name TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id, player_id)
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 11. comment_likes: コメントいいね
-- =====================================================
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rating_id UUID NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rating_id, user_id)
);

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 12. comment_replies: コメント返信
-- =====================================================
CREATE TABLE IF NOT EXISTS comment_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rating_id UUID NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comment_replies(id) ON DELETE CASCADE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comment_replies ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 13. notifications: 通知
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'reply')),
  rating_id UUID REFERENCES ratings(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES comment_replies(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 14. reports: 通報
-- =====================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('rating', 'reply')),
  target_id UUID NOT NULL,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 15. formation_templates: フォーメーションテンプレート
-- =====================================================
CREATE TABLE IF NOT EXISTS formation_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  formation_type TEXT NOT NULL,
  positions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE formation_templates ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 16. インデックス
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_matches_team_id ON matches(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_match_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_season_id ON matches(season_id);

CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_is_active ON players(is_active);

CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_match_events_player_id ON match_events(player_id);
CREATE INDEX IF NOT EXISTS idx_match_lineups_match_id ON match_lineups(match_id);
CREATE INDEX IF NOT EXISTS idx_match_lineups_player_id ON match_lineups(player_id);

CREATE INDEX IF NOT EXISTS idx_ratings_match_player ON ratings(match_id, player_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- =====================================================
-- 17. RLS ポリシー
-- =====================================================

-- profiles
CREATE POLICY IF NOT EXISTS "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- seasons
CREATE POLICY IF NOT EXISTS "seasons_select" ON seasons FOR SELECT USING (true);

-- matches (公開読み取り、管理者のみ書き込み)
CREATE POLICY IF NOT EXISTS "matches_select" ON matches FOR SELECT USING (true);

-- players (公開読み取り)
CREATE POLICY IF NOT EXISTS "players_select" ON players FOR SELECT USING (true);

-- player_seasons
CREATE POLICY IF NOT EXISTS "player_seasons_select" ON player_seasons FOR SELECT USING (true);

-- match_players
CREATE POLICY IF NOT EXISTS "match_players_select" ON match_players FOR SELECT USING (true);

-- match_events (公開読み取り)
CREATE POLICY IF NOT EXISTS "match_events_select" ON match_events FOR SELECT USING (true);

-- match_lineups (公開読み取り)
CREATE POLICY IF NOT EXISTS "match_lineups_select" ON match_lineups FOR SELECT USING (true);

-- ratings (Freemium読み取り)
CREATE POLICY IF NOT EXISTS "ratings_select_freemium" ON ratings FOR SELECT USING (
  auth.uid() IS NULL
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND plan_type = 'premium')
  OR match_id IN (SELECT id FROM matches WHERE status = 'finished' ORDER BY match_date DESC LIMIT 2)
  OR auth.uid() = user_id
);
CREATE POLICY IF NOT EXISTS "ratings_insert_auth" ON ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "ratings_update_own" ON ratings FOR UPDATE USING (auth.uid() = user_id);

-- comment_likes
CREATE POLICY IF NOT EXISTS "likes_select" ON comment_likes FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "likes_insert" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "likes_delete" ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- comment_replies
CREATE POLICY IF NOT EXISTS "replies_select" ON comment_replies FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "replies_insert" ON comment_replies FOR INSERT WITH CHECK (auth.uid() = user_id);

-- notifications (本人のみ)
CREATE POLICY IF NOT EXISTS "notifications_select_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "notifications_insert_auth" ON notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY IF NOT EXISTS "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- formation_templates
CREATE POLICY IF NOT EXISTS "formation_templates_select" ON formation_templates FOR SELECT USING (true);

-- reports
CREATE POLICY IF NOT EXISTS "reports_insert_auth" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- =====================================================
-- 18. 管理者判定関数
-- =====================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT email = 'marketing.workself@gmail.com'
    FROM auth.users WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 19. View: 選手シーズン成績 (重複排除・サブクエリJOIN方式)
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
  SELECT player_id,
    AVG(score) AS avg_score,
    COUNT(DISTINCT match_id) AS rated_matches,
    COUNT(*) AS total_ratings
  FROM ratings
  GROUP BY player_id
) r_agg ON r_agg.player_id = p.id
LEFT JOIN (
  SELECT player_id,
    COUNT(*) FILTER (WHERE event_type = 'goal') AS goals,
    COUNT(*) FILTER (WHERE event_type = 'yellow_card') AS yellow_cards,
    COUNT(*) FILTER (WHERE event_type = 'red_card') AS red_cards
  FROM match_events
  GROUP BY player_id
) e_agg ON e_agg.player_id = p.id
LEFT JOIN (
  SELECT details->>'assisted_by' AS assist_name, COUNT(*) AS assists
  FROM match_events
  WHERE event_type = 'goal' AND details->>'assisted_by' IS NOT NULL
  GROUP BY details->>'assisted_by'
) a_agg ON a_agg.assist_name = p.name
LEFT JOIN (
  SELECT player_id, COUNT(DISTINCT match_id) AS appearances
  FROM match_lineups
  GROUP BY player_id
) l_agg ON l_agg.player_id = p.id
WHERE p.is_active = TRUE;

-- =====================================================
-- 20. Function: get_user_stats
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
      SELECT r.score, r.comment, r.created_at,
             m.opponent_name, m.match_date, m.is_home,
             p.name AS player_name, p.number AS player_number
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
      SELECT m.id, m.opponent_name, m.match_date,
             m.home_score, m.away_score, m.is_home, m.competition,
             COUNT(r.id) AS player_count,
             ROUND(AVG(r.score)::numeric, 1) AS avg_given
      FROM ratings r
      JOIN matches m ON m.id = r.match_id
      WHERE r.user_id = target_user_id
      GROUP BY m.id, m.opponent_name, m.match_date, m.home_score,
               m.away_score, m.is_home, m.competition
      ORDER BY m.match_date DESC
    ) t
  )
);
$$ LANGUAGE SQL STABLE;

-- =====================================================
-- 21. Function: get_user_highlights
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_highlights(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  recent_match_ids UUID[];
BEGIN
  SELECT ARRAY(
    SELECT id FROM matches
    WHERE id IN (SELECT DISTINCT match_id FROM ratings WHERE user_id = target_user_id)
    ORDER BY match_date DESC
    LIMIT 2
  ) INTO recent_match_ids;

  RETURN json_build_object(
    'top', (
      SELECT json_build_object(
        'score', r.score, 'player_name', p.name,
        'player_number', p.number, 'opponent_name', m.opponent_name,
        'match_date', m.match_date, 'comment', r.comment
      )
      FROM ratings r
      JOIN players p ON p.id = r.player_id
      JOIN matches m ON m.id = r.match_id
      WHERE r.user_id = target_user_id AND r.match_id = ANY(recent_match_ids)
      ORDER BY r.score DESC LIMIT 1
    ),
    'worst', (
      SELECT json_build_object(
        'score', r.score, 'player_name', p.name,
        'player_number', p.number, 'opponent_name', m.opponent_name,
        'match_date', m.match_date, 'comment', r.comment
      )
      FROM ratings r
      JOIN players p ON p.id = r.player_id
      JOIN matches m ON m.id = r.match_id
      WHERE r.user_id = target_user_id AND r.match_id = ANY(recent_match_ids)
      ORDER BY r.score ASC LIMIT 1
    )
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- 22. Triggers: いいね・返信通知
-- =====================================================
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
  rating_owner_id UUID;
BEGIN
  SELECT user_id INTO rating_owner_id FROM ratings WHERE id = NEW.rating_id;
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

CREATE OR REPLACE FUNCTION notify_on_reply()
RETURNS TRIGGER AS $$
DECLARE
  rating_owner_id UUID;
BEGIN
  SELECT user_id INTO rating_owner_id FROM ratings WHERE id = NEW.rating_id;
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
-- 完了
-- =====================================================
SELECT 'init_schema.sql complete' AS status;
