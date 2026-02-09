---
description: 試合データの更新フロー（公式サイトからデータ取得→SQL生成→DB更新）
---

# AC Milan 試合データ更新ワークフロー

このワークフローは、公式AC Milanサイトから試合データを取得し、データベースを更新する手順です。

## 前提条件
- `supabase-schema-extension.sql`がSupabaseで実行済み
- 試合が終了している（スコアが確定している）

## 手順

### 1. 公式サイトで試合情報を確認
- https://www.acmilan.com/en/season/active/schedule/all にアクセス
- 更新したい試合の「MATCHCENTER」をクリック

### 2. MATCHCENTERからデータを抽出
以下の情報を収集:
- **スコア**: 最終スコア
- **フォーメーション**: AC Milanのフォーメーション（例: 4-3-3）
- **ゴール**: 選手名、分、アシスト選手
- **カード**: イエロー/レッド、選手名、分
- **ラインアップ**: 先発11人の選手名、背番号、ポジション

### 3. matches テーブルを更新

```sql
UPDATE matches SET
  formation = '4-3-3',  -- 実際のフォーメーション
  is_home = true        -- HOME=true, AWAY=false
WHERE id = 'MATCH_ID';
```

### 4. match_events を追加

```sql
INSERT INTO match_events (match_id, event_type, player_name, minute, details) VALUES
('MATCH_ID', 'goal', 'Christian Pulisic', 45, '{"assisted_by": "Rafael Leão"}'),
('MATCH_ID', 'yellow_card', 'Fikayo Tomori', 67, '{}');
```

イベントタイプ:
- `goal` - ゴール
- `assist` - アシスト（通常はゴールのdetailsに含める）
- `yellow_card` - イエローカード
- `red_card` - レッドカード
- `substitution_in` - 交代（IN）
- `substitution_out` - 交代（OUT）

### 5. match_lineups を追加

```sql
INSERT INTO match_lineups (match_id, player_name, jersey_number, is_starter, position_role, position_x, position_y) VALUES
-- GK
('MATCH_ID', 'Mike Maignan', 16, true, 'GK', 50, 90),
-- DF
('MATCH_ID', 'Davide Calabria', 2, true, 'DF', 85, 70),
('MATCH_ID', 'Fikayo Tomori', 23, true, 'DF', 65, 75),
-- ... 続く
```

ポジション座標:
- x: 0-100 (左-右)
- y: 0-100 (上-下、0=相手ゴール側)

### 6. 確認
- アプリを開いて試合詳細ページでフォーメーションとイベントが表示されることを確認

## 自動化の提案

将来的には、公式サイトのMATCHCENTERページからデータをスクレイピングし、自動でSQL生成するスクリプトを作成することで、この手順を簡略化できます。
