-- =====================================================================
-- 決定版 SQL スクリプト：コメント機能・管理者権限の完全セットアップ
-- =====================================================================
-- ※こちらのSQLをすべてコピーして、SupabaseのSQLエディタで実行してください。
-- すでに実行済みでエラーになった場合でも、再実行やポリシー上書きができるよう記述しています。

-- 1. カラムの追加と安全な型確保（既存の場合はエラーにならないように IF NOT EXISTSを使用）
ALTER TABLE comment_replies ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comment_replies(id) ON DELETE CASCADE;
ALTER TABLE comment_replies ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. 報告テーブル（reports）の作成
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type TEXT NOT NULL CHECK (target_type IN ('rating', 'reply')),
    target_id UUID NOT NULL,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: reports へのインサートと管理者閲覧のポリシー
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reports_insert" ON reports;
CREATE POLICY "reports_insert" ON reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_select_admin" ON reports;
CREATE POLICY "reports_select_admin" ON reports FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =====================================================================
-- ★重要★ comment_replies と ratings の RLS ポリシー再設定
-- 400エラーや送信拒否が起きないように、INSERT と UPDATE ポリシーを適切に再構築します
-- =====================================================================

ALTER TABLE comment_replies ENABLE ROW LEVEL SECURITY;

-- 全員が返信を読み取れる
DROP POLICY IF EXISTS "replies_select" ON comment_replies;
CREATE POLICY "replies_select" ON comment_replies FOR SELECT USING (true);

-- 認証済みユーザーは自身の user_id であればコメント返信を登録（INSERT）できる
DROP POLICY IF EXISTS "replies_insert" ON comment_replies;
CREATE POLICY "replies_insert" ON comment_replies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 更新（UPDATE）：自身のコメント、または profile.role = 'admin' の場合のみ論理削除などを許容
DROP POLICY IF EXISTS "replies_update" ON comment_replies;
CREATE POLICY "replies_update" ON comment_replies FOR UPDATE TO authenticated USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);


ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Ratings の更新（UPDATE）：自身のコメント、または admin のみ論理削除等を許容
DROP POLICY IF EXISTS "ratings_update" ON ratings;
CREATE POLICY "ratings_update" ON ratings FOR UPDATE TO authenticated USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
) WITH CHECK (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
