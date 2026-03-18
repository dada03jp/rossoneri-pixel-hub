import { createClient } from '@/lib/supabase/server';
import { PlayersPageClient } from './client';
import { MOCK_PLAYERS } from '@/lib/mock-data';
import { PixelConfig } from '@/components/pixel-player';

export const dynamic = 'force-dynamic';

export interface PlayerWithStats {
    id: string;
    name: string;
    number: number;
    position: string | null;
    is_active: boolean;
    pixel_config: PixelConfig;
    avg_rating: number;
    appearances: number;
    goals: number;
    assists: number;
    yellow_cards: number;
    red_cards: number;
    rated_matches: number;
    total_ratings: number;
}

export default async function PlayersPage({ params }: { params: Promise<{ team_id: string }> }) {
    const { team_id } = await params;
    const supabase = await createClient();

    // player_season_stats View から取得
    const { data: statsData, error } = await supabase
        .from('player_season_stats')
        .select('*')
        .order('number', { ascending: true });

    if (error || !statsData || statsData.length === 0) {
        console.log('Using mock data for players', error?.message);

        const mockPlayers: PlayerWithStats[] = MOCK_PLAYERS.map(p => ({
            ...p,
            avg_rating: 0,
            appearances: 0,
            goals: 0,
            assists: 0,
            yellow_cards: 0,
            red_cards: 0,
            rated_matches: 0,
            total_ratings: 0,
        }));

        return <PlayersPageClient players={mockPlayers} isUsingMockData={true} teamId={team_id} />;
    }

    const players: PlayerWithStats[] = statsData.map((p: Record<string, unknown>) => ({
        id: p.player_id as string,
        name: p.name as string,
        number: (p.number as number) || 0,
        position: (p.position as string) || null,
        is_active: (p.is_active as boolean) ?? true,
        pixel_config: (p.pixel_config || { skinTone: 'light', hairStyle: 'short', hairColor: 'brown' }) as PixelConfig,
        avg_rating: Number(p.avg_rating) || 0,
        appearances: Number(p.appearances) || 0,
        goals: Number(p.goals) || 0,
        assists: Number(p.assists) || 0,
        yellow_cards: Number(p.yellow_cards) || 0,
        red_cards: Number(p.red_cards) || 0,
        rated_matches: Number(p.rated_matches) || 0,
        total_ratings: Number(p.total_ratings) || 0,
    }));

    // 重複排除ロジック
    const uniquePlayers = [];
    const seenIds = new Set<string>();
    for (const player of players) {
        if (!seenIds.has(player.id)) {
            seenIds.add(player.id);
            uniquePlayers.push(player);
        }
    }

    return <PlayersPageClient players={uniquePlayers} isUsingMockData={false} teamId={team_id} />;
}
