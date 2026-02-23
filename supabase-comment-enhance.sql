-- =====================================================================
-- ROSSONERI PIXEL HUB - Comment Enhancements Migration
-- 1. comment_replies に parent_id 追加 (ネスト表示用)
-- 2. ratings / comment_replies に is_deleted 追加 (論理削除用)
-- 3. profiles に role 追加 (管理者権限用)
-- 4. reports テーブル新設 (報告機能用)
-- =====================================================================

-- 1. 返信のネスト対応
ALTER TABLE comment_replies ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comment_replies(id) ON DELETE CASCADE;

-- 2. 論理削除フラグの追加
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE comment_replies ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 3. 管理者権限（role）の追加
-- デフォルトは 'user'、特別なユーザーのみ 'admin' にする想定
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 4. reports テーブルの作成
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type TEXT NOT NULL CHECK (target_type IN ('rating', 'reply')),
    target_id UUID NOT NULL, -- references ratings.id OR comment_replies.id
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: 報告テーブルは報告者自身のみ送信・閲覧可能（管理者はすべて閲覧可能にするが簡易化のためここではINSERTとSELECTに制限）
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_select_admin" ON reports FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =====================================================================
-- RLS更新: 既存のコメントテーブルに対する、UPDATE権限（論理削除用）
-- 注意: supabase-complete-matches.sql等で既に作られているポリシーと競合しないよう注意
-- 基本的に UPDATE は自分のコメント、または admin のみ可能とする
-- =====================================================================

-- Ratings テーブルの UPDATE ポリシー（論理削除用）
CREATE POLICY "ratings_update" ON ratings FOR UPDATE USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Comment Replies テーブルの UPDATE ポリシー（論理削除用）
CREATE POLICY "replies_update" ON comment_replies FOR UPDATE USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- (必要に応じて管理者機能のために profiles の role も参照可能に)
-- もし profiles に SELECT ポリシーがなければ追加（通常は作成済み）
