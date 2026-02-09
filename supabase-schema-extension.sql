-- AC MILAN PIXEL HUB - 公式サイトデータ用スキーマ拡張
-- 
-- ⚠️ Supabaseで実行してください

-- ステップ1: match_events テーブル作成（ゴール、アシスト、カード）
CREATE TABLE IF NOT EXISTS match_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('goal', 'assist', 'yellow_card', 'red_card', 'substitution_in', 'substitution_out')),
    player_id UUID REFERENCES players(id) ON DELETE SET NULL,
    player_name TEXT, -- プレイヤーが登録されていない場合のフォールバック
    minute INTEGER NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ステップ2: match_lineups テーブル作成（スタメン、出場選手）
CREATE TABLE IF NOT EXISTS match_lineups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE SET NULL,
    player_name TEXT, -- プレイヤーが登録されていない場合のフォールバック
    jersey_number INTEGER,
    is_starter BOOLEAN DEFAULT FALSE,
    position_role TEXT CHECK (position_role IN ('GK', 'DF', 'MF', 'FW')),
    position_x INTEGER DEFAULT 50 CHECK (position_x >= 0 AND position_x <= 100),
    position_y INTEGER DEFAULT 50 CHECK (position_y >= 0 AND position_y <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(match_id, player_id)
);

-- ステップ3: matches テーブルにフォーメーションカラム追加
ALTER TABLE matches ADD COLUMN IF NOT EXISTS formation TEXT;

-- ステップ4: is_home カラムも追加（まだなければ）
ALTER TABLE matches ADD COLUMN IF NOT EXISTS is_home BOOLEAN DEFAULT TRUE;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_match_events_match_id ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_match_events_player_id ON match_events(player_id);
CREATE INDEX IF NOT EXISTS idx_match_lineups_match_id ON match_lineups(match_id);
CREATE INDEX IF NOT EXISTS idx_match_lineups_player_id ON match_lineups(player_id);

-- RLS（Row Level Security）ポリシー
ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_lineups ENABLE ROW LEVEL SECURITY;

-- 読み取りは全員可能
CREATE POLICY "match_events_read_all" ON match_events FOR SELECT USING (true);
CREATE POLICY "match_lineups_read_all" ON match_lineups FOR SELECT USING (true);

-- 確認クエリ
SELECT 'match_events table created' AS status;
SELECT 'match_lineups table created' AS status;
