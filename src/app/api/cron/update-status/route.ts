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

    // upcoming → live: キックオフ時刻を過ぎた試合を自動更新
    const { data, error } = await supabase
        .from('matches')
        .update({ status: 'live' })
        .eq('status', 'upcoming')
        .lte('match_date', new Date().toISOString())
        .select('id, opponent_name, match_date');

    if (error) {
        console.error('Cron update-status error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        ok: true,
        updated: data?.length || 0,
        matches: data || [],
        timestamp: new Date().toISOString(),
    });
}
