-- ============================================================
-- Phase A: rating_comments 作成 + データ移行
-- 全ステップ冪等。新規/途中状態 両環境対応。
-- Preflight check + root comment 一意性保証。
-- ============================================================

-- ── Preflight: root comment 重複チェック ──
-- (rating_comments が存在する場合のみ)
DO $$
DECLARE
  dup_count INT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'rating_comments'
  ) THEN
    SELECT COUNT(*) INTO dup_count
    FROM (
      SELECT rating_id, COUNT(*)
      FROM rating_comments
      WHERE parent_comment_id IS NULL
      GROUP BY rating_id
      HAVING COUNT(*) > 1
    ) dupes;
    
    IF dup_count > 0 THEN
      RAISE EXCEPTION 'Preflight failed: % rating_comments root duplicates found. Clean up before migration.', dup_count;
    END IF;
  END IF;
END $$;

-- ── Step 1: テーブル作成 ──
CREATE TABLE IF NOT EXISTS rating_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rating_id UUID NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  comment TEXT NOT NULL,
  parent_comment_id UUID REFERENCES rating_comments(id) ON DELETE SET NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  legacy_rating_id UUID,
  legacy_reply_id UUID
);

-- ── Step 1b: 途中状態環境向け列補強 ──
ALTER TABLE rating_comments ADD COLUMN IF NOT EXISTS legacy_rating_id UUID;
ALTER TABLE rating_comments ADD COLUMN IF NOT EXISTS legacy_reply_id UUID;
ALTER TABLE rating_comments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE rating_comments ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;
ALTER TABLE rating_comments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE rating_comments ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE rating_comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE rating_comments ADD COLUMN IF NOT EXISTS parent_comment_id UUID;

-- ── Step 1c: parent_comment_id 自己参照 FK 保証 ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'rating_comments_parent_comment_id_fkey'
      AND table_name = 'rating_comments'
  ) THEN
    ALTER TABLE rating_comments
      ADD CONSTRAINT rating_comments_parent_comment_id_fkey
      FOREIGN KEY (parent_comment_id)
      REFERENCES rating_comments(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ── Step 1d: インデックス ──
CREATE UNIQUE INDEX IF NOT EXISTS idx_rc_legacy_rating
  ON rating_comments(legacy_rating_id) WHERE legacy_rating_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_rc_legacy_reply
  ON rating_comments(legacy_reply_id) WHERE legacy_reply_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_rc_root_unique
  ON rating_comments(rating_id) WHERE parent_comment_id IS NULL;

-- ── Step 2: ratings.comment → rating_comments (root) ──
-- 状態カラム (is_deleted, is_edited, edited_at, deleted_at) も移行
INSERT INTO rating_comments
  (rating_id, user_id, user_name, comment,
   is_deleted, is_edited, edited_at, deleted_at, created_at,
   legacy_rating_id)
SELECT
  r.id, r.user_id, r.user_name, r.comment,
  COALESCE(r.is_deleted, false),
  COALESCE(r.is_edited, false),
  r.edited_at, r.deleted_at, r.created_at,
  r.id
FROM ratings r
WHERE r.comment IS NOT NULL
  AND r.comment != ''
  AND r.comment != 'null'
  AND NOT EXISTS (
    SELECT 1 FROM rating_comments rc WHERE rc.legacy_rating_id = r.id
  )
ON CONFLICT DO NOTHING;

-- ── Step 3: comment_replies → rating_comments (reply) ──
INSERT INTO rating_comments
  (rating_id, user_id, user_name, comment,
   parent_comment_id, is_deleted, created_at,
   legacy_reply_id)
SELECT
  cr.rating_id, cr.user_id, cr.user_name, cr.content,
  NULL, cr.is_deleted, cr.created_at,
  cr.id
FROM comment_replies cr
WHERE NOT EXISTS (
  SELECT 1 FROM rating_comments rc WHERE rc.legacy_reply_id = cr.id
)
ON CONFLICT DO NOTHING;

-- ── Step 4: parent_comment_id 張替え ──

-- Case A: parent_id IS NULL → root comment への直接返信
UPDATE rating_comments rc_child
SET parent_comment_id = rc_parent.id
FROM comment_replies cr
JOIN rating_comments rc_parent
  ON rc_parent.legacy_rating_id = cr.rating_id
WHERE rc_child.legacy_reply_id = cr.id
  AND cr.parent_id IS NULL
  AND rc_child.parent_comment_id IS NULL;

-- Case B: parent_id IS NOT NULL → 他 reply への返信
UPDATE rating_comments rc_child
SET parent_comment_id = rc_parent.id
FROM comment_replies cr
JOIN rating_comments rc_parent
  ON rc_parent.legacy_reply_id = cr.parent_id
WHERE rc_child.legacy_reply_id = cr.id
  AND cr.parent_id IS NOT NULL
  AND rc_child.parent_comment_id IS NULL;

-- ── Step 5: comment_likes 移行 ──
-- ★ likes は root comment のみ対象。reply への likes は存在しない。
-- ★ Phase A 後: アプリは comment_id のみで読み書き。rating_id は使わない。

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comment_likes' AND column_name = 'comment_id'
  ) THEN
    ALTER TABLE comment_likes ADD COLUMN comment_id UUID;
  END IF;
END $$;

UPDATE comment_likes cl
SET comment_id = rc.id
FROM rating_comments rc
WHERE rc.legacy_rating_id = cl.rating_id
  AND cl.comment_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'comment_likes_comment_id_fkey'
  ) THEN
    ALTER TABLE comment_likes
      ADD CONSTRAINT comment_likes_comment_id_fkey
      FOREIGN KEY (comment_id) REFERENCES rating_comments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ── Step 6: RLS + インデックス ──
ALTER TABLE rating_comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rating_comments' AND policyname = 'rc_select') THEN
    CREATE POLICY "rc_select" ON rating_comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rating_comments' AND policyname = 'rc_insert') THEN
    CREATE POLICY "rc_insert" ON rating_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rating_comments' AND policyname = 'rc_update_own') THEN
    CREATE POLICY "rc_update_own" ON rating_comments FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rc_rating_id ON rating_comments(rating_id);
CREATE INDEX IF NOT EXISTS idx_rc_user_id ON rating_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_rc_parent ON rating_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_rc_created ON rating_comments(created_at DESC);

-- ── 完了 ──
SELECT 'migration_split_comments Phase A complete' AS status;
