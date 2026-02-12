'use client';

import { PlayerCard } from '@/components/players/PlayerCard';
import { PixelPlayer, PixelConfig } from '@/components/pixel-player';
import { useSeason } from '@/contexts/season-context';
import { Player, Season } from '@/types/database';
import { Users, Star, AlertCircle, Filter } from 'lucide-react';
import { useMemo, useState } from 'react';
import Link from 'next/link';

interface PlayerWithSeasons extends Player {
    pixel_config: PixelConfig;
    player_seasons: {
        season_id: string;
        jersey_number: number;
        is_active: boolean;
    }[];
}

interface PlayersPageClientProps {
    players: PlayerWithSeasons[];
    seasons: Season[];
    isUsingMockData: boolean;
}

const POSITION_ORDER = ['GK', 'DF', 'MF', 'FW'];
const POSITION_LABELS: Record<string, string> = {
    'GK': 'ゴールキーパー',
    'DF': 'ディフェンダー',
    'MF': 'ミッドフィルダー',
    'FW': 'フォワード'
};

export function PlayersPageClient({ players, seasons, isUsingMockData }: PlayersPageClientProps) {
    const { selectedSeason } = useSeason();
    const [showInactive, setShowInactive] = useState(false);

    // Filter players by selected season
    const filteredPlayers = useMemo(() => {
        if (!selectedSeason) return players.map(p => ({ ...p, is_active: true }));

        return players.filter(player => {
            const seasonData = player.player_seasons?.find(
                ps => ps.season_id === selectedSeason.id
            );

            if (!seasonData) return false;
            if (!showInactive && !seasonData.is_active) return false;

            return true;
        }).map(player => {
            const seasonData = player.player_seasons?.find(
                ps => ps.season_id === selectedSeason.id
            );
            return {
                ...player,
                number: seasonData?.jersey_number || player.number,
                is_active: seasonData?.is_active ?? true
            };
        });
    }, [players, selectedSeason, showInactive]);

    // Group players by position
    const playersByPosition = useMemo(() => {
        const grouped: Record<string, typeof filteredPlayers> = {};

        POSITION_ORDER.forEach(pos => {
            grouped[pos] = filteredPlayers
                .filter(p => p.position === pos)
                .sort((a, b) => a.number - b.number);
        });

        return grouped;
    }, [filteredPlayers]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold">選手一覧</h1>
                        <p className="text-muted-foreground">
                            {selectedSeason?.name || '25-26'} シーズン • {filteredPlayers.length}名
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setShowInactive(!showInactive)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${showInactive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80'
                        }`}
                >
                    <Filter className="w-4 h-4" />
                    {showInactive ? '全選手表示中' : '現所属選手のみ'}
                </button>
            </div>

            {/* Debug Banner */}
            {isUsingMockData && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">
                        モックデータを使用中
                    </p>
                </div>
            )}

            {/* Players by Position */}
            {POSITION_ORDER.map(position => {
                const positionPlayers = playersByPosition[position];
                if (positionPlayers.length === 0) return null;

                return (
                    <div key={position} className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <h2 className="text-xl font-bold">{POSITION_LABELS[position]}</h2>
                            <span className="text-sm text-muted-foreground">
                                ({positionPlayers.length}名)
                            </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {positionPlayers.map(player => (
                                <PlayerCard
                                    key={player.id}
                                    name={player.name}
                                    number={player.number}
                                    position={player.position || ''}
                                    pixelConfig={player.pixel_config}
                                    averageRating={null}
                                    recentRatings={[]}
                                    className={`${player.is_active === false ? 'opacity-60 grayscale' : ''}`}
                                    isInteractive={true}
                                    onSubmit={async (rating, comment) => {
                                        console.log(`Submitted for ${player.name}:`, rating, comment);
                                        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}

            {filteredPlayers.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>このシーズンの選手データがありません</p>
                </div>
            )}
        </div>
    );
}


