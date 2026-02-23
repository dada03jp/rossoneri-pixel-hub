-- =====================================================================
-- ROSSONERI PIXEL HUB - Formation V2 Migration
-- position_row 追加、formation_templates テーブル新設
-- ⚠️ Supabase SQL Editorで実行してください
-- =====================================================================

-- 1. match_lineups: position_row 追加
ALTER TABLE match_lineups ADD COLUMN IF NOT EXISTS position_row INTEGER DEFAULT 2;

-- 2. role カラムの値を詳細化（既存データは互換性維持）
-- GK, CB, WB, DM, CM, AM, ST が利用可能に（TEXT型なので制約不要）

-- 3. formation_templates テーブル新設
CREATE TABLE IF NOT EXISTS formation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    formation_type TEXT NOT NULL,
    positions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE formation_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "formation_templates_select" ON formation_templates FOR SELECT USING (true);
CREATE POLICY "formation_templates_admin" ON formation_templates FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND plan_type = 'premium')
);

-- 4. 初期テンプレートデータ（4-2-3-1 / 3-5-2）
INSERT INTO formation_templates (name, formation_type, positions) VALUES
('4-2-3-1 Standard', '4-2-3-1', '[
  {"role":"GK","position_row":1,"position_side":"Center"},
  {"role":"CB","position_row":2,"position_side":"Left"},
  {"role":"CB","position_row":2,"position_side":"Right"},
  {"role":"CB","position_row":2,"position_side":"Center"},
  {"role":"CB","position_row":2,"position_side":"Center"},
  {"role":"DM","position_row":3,"position_side":"Left"},
  {"role":"DM","position_row":3,"position_side":"Right"},
  {"role":"AM","position_row":4,"position_side":"Left"},
  {"role":"AM","position_row":4,"position_side":"Center"},
  {"role":"AM","position_row":4,"position_side":"Right"},
  {"role":"ST","position_row":5,"position_side":"Center"}
]'::jsonb),
('3-5-2 Standard', '3-5-2', '[
  {"role":"GK","position_row":1,"position_side":"Center"},
  {"role":"CB","position_row":2,"position_side":"Left"},
  {"role":"CB","position_row":2,"position_side":"Center"},
  {"role":"CB","position_row":2,"position_side":"Right"},
  {"role":"WB","position_row":3,"position_side":"Left"},
  {"role":"DM","position_row":3,"position_side":"Left"},
  {"role":"DM","position_row":3,"position_side":"Right"},
  {"role":"WB","position_row":3,"position_side":"Right"},
  {"role":"AM","position_row":4,"position_side":"Center"},
  {"role":"ST","position_row":5,"position_side":"Left"},
  {"role":"ST","position_row":5,"position_side":"Right"}
]'::jsonb)
ON CONFLICT DO NOTHING;

-- 5. comment_likes / comment_replies テーブル（コミュニティ機能）
CREATE TABLE IF NOT EXISTS comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rating_id UUID NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(rating_id, user_id)
);

CREATE TABLE IF NOT EXISTS comment_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rating_id UUID NOT NULL REFERENCES ratings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for comment_likes
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes_select" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete" ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS for comment_replies
ALTER TABLE comment_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "replies_select" ON comment_replies FOR SELECT USING (true);
CREATE POLICY "replies_insert" ON comment_replies FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Stripe webhook 用: profiles テーブルに stripe_customer_id 追加
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
