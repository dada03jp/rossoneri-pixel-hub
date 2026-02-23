import { createClient } from '@/lib/supabase/server';
import { PlayerDetailClient } from './client';
import { notFound } from 'next/navigation';
import { BackHeader } from '@/components/header';
import { PixelConfig } from '@/components/pixel-player';

export const dynamic = 'force-dynamic';

export default async function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // 選手の成績取得
    const { data: statsRaw } = await supabase
        .from('player_season_stats' as any)
        .select('*')
        .eq('player_id', id)
        .single();

    const stats = statsRaw as Record<string, unknown> | null;
    if (!stats) return notFound();

    // その選手の全採点データ（試合情報つき）
    const { data: ratingsData } = await supabase
        .from('ratings')
        .select('*, matches!inner(opponent_name, match_date, home_score, away_score, is_home, competition)')
        .eq('player_id', id)
        .order('created_at', { ascending: false });

    return (
        <>
            <BackHeader title={stats.name as string} subtitle="選手詳細" />
            <div className="max-w-4xl mx-auto px-4 py-6">
                <PlayerDetailClient
                    stats={{
                        player_id: stats.player_id as string,
                        name: stats.name as string,
                        number: Number(stats.number) || 0,
                        position: (stats.position as string) || '',
                        pixel_config: (stats.pixel_config || { skinTone: 'light', hairStyle: 'short', hairColor: 'brown' }) as any,
                        avg_rating: Number(stats.avg_rating) || 0,
                        appearances: Number(stats.appearances) || 0,
                        goals: Number(stats.goals) || 0,
                        assists: Number(stats.assists) || 0,
                        yellow_cards: Number(stats.yellow_cards) || 0,
                        red_cards: Number(stats.red_cards) || 0,
                        rated_matches: Number(stats.rated_matches) || 0,
                        total_ratings: Number(stats.total_ratings) || 0,
                    }}
                    ratings={(ratingsData || []).map((r: any) => ({
                        id: r.id,
                        score: r.score,
                        comment: r.comment,
                        user_name: r.user_name,
                        created_at: r.created_at,
                        opponent_name: r.matches?.opponent_name,
                        match_date: r.matches?.match_date,
                        home_score: r.matches?.home_score,
                        away_score: r.matches?.away_score,
                        is_home: r.matches?.is_home,
                        competition: r.matches?.competition,
                    }))}
                />
            </div>
        </>
    );
}
