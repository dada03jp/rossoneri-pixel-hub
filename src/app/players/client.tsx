'use client';

import { PlayerCard } from '@/components/players/PlayerCard';
import { Users, AlertCircle } from 'lucide-react';
import { useMemo } from 'react';
import type { PlayerWithStats } from './page';

interface PlayersPageClientProps {
    players: PlayerWithStats[];
    isUsingMockData: boolean;
}

const POSITION_ORDER = ['GK', 'DF', 'MF', 'FW'];
const POSITION_LABELS: Record<string, string> = {
    'GK': 'ゴールキーパー',
    'DF': 'ディフェンダー',
    'MF': 'ミッドフィルダー',
    'FW': 'フォワード'
};

export function PlayersPageClient({ players: initialPlayers, isUsingMockData }: PlayersPageClientProps) {
    // 選手重複の完全な排除
    const players = Array.from(new Map(initialPlayers.map(p => [p.id, p])).values());
    // Group players by position
    const playersByPosition = useMemo(() => {
        const grouped: Record<string, PlayerWithStats[]> = {};
        POSITION_ORDER.forEach(pos => {
            grouped[pos] = players
                .filter(p => p.position === pos)
                .sort((a, b) => a.number - b.number);
        });
        return grouped;
    }, [players]);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold">選手名鑑</h1>
                    <p className="text-muted-foreground">
                        25-26 シーズン • {players.length}名
                    </p>
                </div>
            </div>

            {isUsingMockData && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">モックデータを使用中</p>
                </div>
            )}

            {/* Players by Position */}
            {POSITION_ORDER.map(position => {
                const positionPlayers = playersByPosition[position];
                if (!positionPlayers || positionPlayers.length === 0) return null;

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
                                    id={player.id}
                                    name={player.name}
                                    number={player.number}
                                    position={player.position || ''}
                                    pixelConfig={player.pixel_config}
                                    avgRating={player.avg_rating}
                                    appearances={player.appearances}
                                    goals={player.goals}
                                    assists={player.assists}
                                    yellowCards={player.yellow_cards}
                                    redCards={player.red_cards}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}

            {players.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>選手データがありません</p>
                </div>
            )}
        </div>
    );
}
