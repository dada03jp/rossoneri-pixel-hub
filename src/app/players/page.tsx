import { createClient } from '@/lib/supabase/server';
import { PlayersPageClient } from './client';
import { MOCK_PLAYERS } from '@/lib/mock-data';
import { PixelConfig } from '@/components/pixel-player';
import { Player } from '@/types/database';

interface PlayerWithSeasons extends Player {
    pixel_config: PixelConfig;
    player_seasons: {
        season_id: string;
        jersey_number: number;
        is_active: boolean;
    }[];
}

export default async function PlayersPage() {
    const supabase = await createClient();

    // Fetch players with their season data
    const { data: playersData, error } = await supabase
        .from('players')
        .select(`
            *,
            player_seasons (
                season_id,
                jersey_number,
                is_active
            )
        `)
        .order('number', { ascending: true });

    // Fetch seasons
    const { data: seasons } = await supabase
        .from('seasons')
        .select('*')
        .order('start_year', { ascending: false });

    if (error || !playersData || playersData.length === 0) {
        console.log('Using mock data for players');

        const mockPlayers: PlayerWithSeasons[] = MOCK_PLAYERS.map(p => ({
            ...p,
            player_seasons: [{ season_id: 'mock-25-26', jersey_number: p.number, is_active: true }]
        }));

        return (
            <PlayersPageClient
                players={mockPlayers}
                seasons={[
                    { id: 'mock-25-26', name: '25-26', start_year: 2025, end_year: 2026, is_current: true },
                    { id: 'mock-24-25', name: '24-25', start_year: 2024, end_year: 2025, is_current: false }
                ]}
                isUsingMockData={true}
            />
        );
    }

    // Transform players data with proper typing
    const players: PlayerWithSeasons[] = playersData.map((player: Record<string, unknown>) => ({
        id: player.id as string,
        name: player.name as string,
        number: player.number as number,
        position: player.position as string | null,
        pixel_config: (player.pixel_config || { skinTone: 'light', hairStyle: 'short', hairColor: 'brown' }) as PixelConfig,
        player_seasons: ((player.player_seasons as Array<{
            season_id: string;
            jersey_number: number;
            is_active: boolean;
        }>) || [])
    }));

    return (
        <PlayersPageClient
            players={players}
            seasons={seasons || []}
            isUsingMockData={false}
        />
    );
}
