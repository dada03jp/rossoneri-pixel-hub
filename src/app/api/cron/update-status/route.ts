import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Vercel Cron Jobs から5分ごとに呼び出される
// vercel.json で設定: { "crons": [{ "path": "/api/cron/update-status", "schedule": "*/5 * * * *" }] }

export async function GET(request: Request) {
    // Vercel Cron認証チェック
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Service role key を使用（RLSをバイパス）
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. upcoming → live: キックオフ時刻を過ぎた試合を自動更新
    const { data: toLive, error: toLiveError } = await supabase
        .from('matches')
        .update({ status: 'live' })
        .eq('status', 'upcoming')
        .lte('match_date', new Date().toISOString())
        .select('id, opponent_name, match_date');

    if (toLiveError) {
        console.error('Cron update-status (upcoming→live) error:', toLiveError);
    }

    // 2. live → finished: キックオフから3時間以上経過した試合を暫定的にfinishedに移行
    // TODO: 将来的に外部試合結果データ連携（例: football-data.org API）に置き換え。
    // 現在は試合終了を自動検知する手段がないため、時間経過による暫定処理として実装。
    // 管理画面からの手動ステータス更新も併用。
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const { data: toFinished, error: toFinishedError } = await supabase
        .from('matches')
        .update({ status: 'finished' })
        .eq('status', 'live')
        .lte('match_date', threeHoursAgo)
        .select('id, opponent_name, match_date');

    if (toFinishedError) {
        console.error('Cron update-status (live→finished) error:', toFinishedError);
    }

    return NextResponse.json({
        ok: true,
        updatedToLive: toLive?.length || 0,
        updatedToFinished: toFinished?.length || 0,
        matchesToLive: toLive || [],
        matchesToFinished: toFinished || [],
        timestamp: new Date().toISOString(),
    });
}
