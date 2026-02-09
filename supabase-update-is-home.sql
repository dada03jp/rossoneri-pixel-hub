-- 25-26シーズン試合のis_homeカラムを更新
-- ホーム試合 = true, アウェイ試合 = false

-- ボローニャ戦 (2026-02-04) - Away
UPDATE matches SET is_home = false WHERE id = '25260123-0123-0123-0123-000000000123';

-- ローマ戦 (2026-01-26) - Away
UPDATE matches SET is_home = false WHERE id = '25260122-0122-0122-0122-000000000122';

-- レッチェ戦 (2026-01-19) - Home
UPDATE matches SET is_home = true WHERE id = '25260121-0121-0121-0121-000000000121';

-- インテル戦 (2025-11-24) - Away
UPDATE matches SET is_home = false WHERE id = '25260112-0112-0112-0112-000000000112';

-- ナポリ戦 (2025-09-29) - Home
UPDATE matches SET is_home = true WHERE id = '25260105-0105-0105-0105-000000000105';

-- ユベントス戦 (2025-10-06) - Away
UPDATE matches SET is_home = false WHERE id = '25260106-0106-0106-0106-000000000106';

-- ラツィオ戦 (2025-11-30) - Home
UPDATE matches SET is_home = true WHERE id = '25260113-0113-0113-0113-000000000113';
