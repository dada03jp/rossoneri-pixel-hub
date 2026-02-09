-- =====================================================
-- コメント機能拡張用スキーマ
-- =====================================================

-- 1. コメントへのいいねテーブル
CREATE TABLE IF NOT EXISTS comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id uuid REFERENCES ratings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(rating_id, user_id)
);

-- 2. コメントへの返信テーブル
CREATE TABLE IF NOT EXISTS comment_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id uuid REFERENCES ratings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLSポリシー
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_replies ENABLE ROW LEVEL SECURITY;

-- いいねの閲覧は誰でも可能
CREATE POLICY "Anyone can view likes" ON comment_likes
  FOR SELECT USING (true);

-- いいねの追加は認証済みユーザーのみ
CREATE POLICY "Users can add likes" ON comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- いいねの削除は自分のみ
CREATE POLICY "Users can delete own likes" ON comment_likes
  FOR DELETE USING (auth.uid() = user_id);

-- 返信の閲覧は誰でも可能
CREATE POLICY "Anyone can view replies" ON comment_replies
  FOR SELECT USING (true);

-- 返信の追加は認証済みユーザーのみ
CREATE POLICY "Users can add replies" ON comment_replies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 返信の削除は自分のみ
CREATE POLICY "Users can delete own replies" ON comment_replies
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 24-25シーズン削除
-- =====================================================
DELETE FROM match_events WHERE match_id IN (SELECT id FROM matches WHERE season_id = 'aaaaaaaa-0000-0000-0000-000000000001');
DELETE FROM match_players WHERE match_id IN (SELECT id FROM matches WHERE season_id = 'aaaaaaaa-0000-0000-0000-000000000001');
DELETE FROM ratings WHERE match_id IN (SELECT id FROM matches WHERE season_id = 'aaaaaaaa-0000-0000-0000-000000000001');
DELETE FROM matches WHERE season_id = 'aaaaaaaa-0000-0000-0000-000000000001';

-- インデックス追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_comment_likes_rating_id ON comment_likes(rating_id);
CREATE INDEX IF NOT EXISTS idx_comment_replies_rating_id ON comment_replies(rating_id);
