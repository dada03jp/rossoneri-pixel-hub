# DB 手動更新ルール

> **適用範囲**: Supabase REST API / SQL / 管理画面外のスクリプトによる直接データ更新すべて

## 必須ルール

1. **非一意キーで更新しない**
   - `opponent_name`, 部分一致(`ilike`), あいまいな `match_date` での更新は禁止
   - 同一対戦相手・同一日時の複数レコードが存在しうるため

2. **更新前に SELECT で対象レコードを確認する**
   ```
   GET /rest/v1/matches?id=eq.{target_id}&select=id,opponent_name,match_date,status
   ```
   - 意図した1件のみが返ることを確認してから更新する

3. **更新は必ず `id` 指定で行う**
   ```
   PATCH /rest/v1/matches?id=eq.{target_id}
   ```
   - `id` が不明な場合は先に SELECT で特定する

4. **実行後に対象1件だけ更新されたことを確認する**
   - `Prefer: return=representation` で更新後データを取得
   - 返却レコード数が1件であることを確認

## 背景

2026-03-18 に `opponent_name ilike '%Cagliari%'` で更新した際、意図した5/24の1件だけでなく1/3の別試合も巻き込み、finished → upcoming に誤更新する事故が発生。
