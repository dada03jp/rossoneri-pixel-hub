-- =====================================================================
-- ROSSONERI PIXEL HUB - V2 Database Migration
-- 2026年スカッド対応 + status enum + 管理者RLS
--
-- ⚠️ Supabase SQL Editorで実行してください
-- ⚠️ 既存機能を保持しつつ段階的に拡張するため安全です
-- =====================================================================

-- =====================================================
-- 1. match_status ENUM 作成
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_status') THEN
    CREATE TYPE match_status AS ENUM ('upcoming', 'live', 'finished');
  END IF;
END
$$;

-- =====================================================
-- 2. matches テーブル拡張
-- =====================================================

-- status カラム追加
ALTER TABLE matches ADD COLUMN IF NOT EXISTS status match_status DEFAULT 'upcoming';

-- 将来のAPI連携用 external_id
ALTER TABLE matches ADD COLUMN IF NOT EXISTS external_id TEXT;

-- 既存データ移行: is_finished boolean → status enum
UPDATE matches SET status = CASE
  WHEN is_finished = TRUE THEN 'finished'::match_status
  WHEN match_date < NOW() THEN 'live'::match_status
  ELSE 'upcoming'::match_status
END
WHERE status IS NULL OR status = 'upcoming';

-- home_score, away_score のデフォルト値設定
ALTER TABLE matches ALTER COLUMN home_score SET DEFAULT 0;
ALTER TABLE matches ALTER COLUMN away_score SET DEFAULT 0;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_match_date ON matches(match_date);

-- =====================================================
-- 3. players テーブル拡張
-- =====================================================

-- is_active: 現在の所属状況管理
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 将来のAPI連携用 external_id
ALTER TABLE players ADD COLUMN IF NOT EXISTS external_id TEXT;

-- 2026年2月現在の退団選手を非アクティブに
UPDATE players SET is_active = FALSE WHERE name IN (
  'Tijjani Reijnders',    -- → Man City (2025夏移籍)
  'Álvaro Morata',        -- → Como (2026冬移籍)
  'Samuel Chukwueze',     -- → Fulham (2025夏移籍)
  'Tammy Abraham',        -- → West Ham (レンタル終了)
  'Davide Calabria',      -- 退団
  'Ismaël Bennacer',      -- 退団
  'Malick Thiaw',         -- 退団
  'Theo Hernández',       -- 退団
  'Noah Okafor'           -- 退団
);

-- アクティブ選手のインデックス
CREATE INDEX IF NOT EXISTS idx_players_is_active ON players(is_active);

-- =====================================================
-- 4. match_lineups テーブル拡張
-- =====================================================

-- 出場時間カラム追加
ALTER TABLE match_lineups
  ADD COLUMN IF NOT EXISTS minutes_played INTEGER DEFAULT 0;

-- =====================================================
-- 5. 管理者判定関数
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
-- 6. 管理者用RLSポリシー
-- =====================================================

-- matches: 管理者のみ挿入・更新・削除
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can insert matches') THEN
    CREATE POLICY "Admin can insert matches" ON matches
      FOR INSERT WITH CHECK (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can update matches') THEN
    CREATE POLICY "Admin can update matches" ON matches
      FOR UPDATE USING (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can delete matches') THEN
    CREATE POLICY "Admin can delete matches" ON matches
      FOR DELETE USING (is_admin());
  END IF;
END $$;

-- players: 管理者のみ挿入・更新
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can insert players') THEN
    CREATE POLICY "Admin can insert players" ON players
      FOR INSERT WITH CHECK (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can update players') THEN
    CREATE POLICY "Admin can update players" ON players
      FOR UPDATE USING (is_admin());
  END IF;
END $$;

-- match_lineups: 管理者のみ挿入・更新・削除
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can insert lineups') THEN
    CREATE POLICY "Admin can insert lineups" ON match_lineups
      FOR INSERT WITH CHECK (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can update lineups') THEN
    CREATE POLICY "Admin can update lineups" ON match_lineups
      FOR UPDATE USING (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can delete lineups') THEN
    CREATE POLICY "Admin can delete lineups" ON match_lineups
      FOR DELETE USING (is_admin());
  END IF;
END $$;

-- match_events: 管理者のみ挿入・更新・削除
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can insert events') THEN
    CREATE POLICY "Admin can insert events" ON match_events
      FOR INSERT WITH CHECK (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can update events') THEN
    CREATE POLICY "Admin can update events" ON match_events
      FOR UPDATE USING (is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can delete events') THEN
    CREATE POLICY "Admin can delete events" ON match_events
      FOR DELETE USING (is_admin());
  END IF;
END $$;

-- =====================================================
-- 7. 確認クエリ
-- =====================================================
SELECT 'Migration complete' AS status;

-- アクティブ選手一覧
SELECT name, number, position, is_active
FROM players
ORDER BY is_active DESC, position, number;

-- 試合ステータス確認
SELECT opponent_name, match_date, status, is_finished, home_score, away_score
FROM matches
ORDER BY match_date DESC
LIMIT 10;
