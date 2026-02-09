-- ROSSONERI PIXEL HUB - Fix 25-26 Season Departed Players
-- 
-- ⚠️ 実行方法: 新規SQLとして実行（既存のエディタ内容を消してペースト）
--
-- このSQLは25-26シーズンにいない選手を非アクティブにします

-- ============================================
-- 25-26シーズンから退団した選手を非アクティブに設定
-- ============================================

-- Theo Hernández - 25-26シーズンで退団
UPDATE player_seasons 
SET is_active = FALSE, left_date = '2025-07-01'
WHERE player_id = '55555555-5555-5555-5555-555555555555' 
  AND season_id = 'aaaaaaaa-0000-0000-0000-000000000002';

-- Tijjani Reijnders - 25-26シーズンで退団  
UPDATE player_seasons 
SET is_active = FALSE, left_date = '2025-07-01'
WHERE player_id = '77777777-7777-7777-7777-777777777777' 
  AND season_id = 'aaaaaaaa-0000-0000-0000-000000000002';

-- Ismaël Bennacer - 25-26シーズンで退団
UPDATE player_seasons 
SET is_active = FALSE, left_date = '2025-07-01'
WHERE player_id = '66666666-6666-6666-6666-666666666666' 
  AND season_id = 'aaaaaaaa-0000-0000-0000-000000000002';

-- Davide Calabria - 25-26シーズンで退団
UPDATE player_seasons 
SET is_active = FALSE, left_date = '2025-07-01'
WHERE player_id = '22222222-2222-2222-2222-222222222222' 
  AND season_id = 'aaaaaaaa-0000-0000-0000-000000000002';

-- Malick Thiaw - 25-26シーズンで退団
UPDATE player_seasons 
SET is_active = FALSE, left_date = '2025-07-01'
WHERE player_id = '44444444-4444-4444-4444-444444444444' 
  AND season_id = 'aaaaaaaa-0000-0000-0000-000000000002';

-- Álvaro Morata - 25-26シーズンで退団
UPDATE player_seasons 
SET is_active = FALSE, left_date = '2025-07-01'
WHERE player_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' 
  AND season_id = 'aaaaaaaa-0000-0000-0000-000000000002';

-- Samuel Chukwueze - 25-26シーズンで退団
UPDATE player_seasons 
SET is_active = FALSE, left_date = '2025-07-01'
WHERE player_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' 
  AND season_id = 'aaaaaaaa-0000-0000-0000-000000000002';
