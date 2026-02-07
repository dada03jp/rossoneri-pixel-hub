'use client';

import { PixelPlayer, PixelConfig } from '@/components/pixel-player';
import { Trophy, TrendingUp, Medal } from 'lucide-react';
import { useMemo } from 'react';
import { Player } from '@/types/database';

interface PlayerRanking {
    player: Player & { pixel_config: PixelConfig };
    average: number;
    count: number;
    rank: number;
}

interface RankingCardProps {
    title: string;
    players: (Player & { pixel_config: PixelConfig })[];
    ratings: Record<string, { average: number; count: number }>;
    limit?: number;
}

export function RankingCard({ title, players, ratings, limit = 5 }: RankingCardProps) {
    const rankedPlayers = useMemo(() => {
        const playersWithRatings: PlayerRanking[] = players
            .filter(player => ratings[player.id])
            .map(player => ({
                player,
                average: ratings[player.id].average,
                count: ratings[player.id].count,
                rank: 0
            }))
            .sort((a, b) => b.average - a.average);

        // ランクを設定
        playersWithRatings.forEach((p, index) => {
            p.rank = index + 1;
        });

        return playersWithRatings.slice(0, limit);
    }, [players, ratings, limit]);

    const getMedalColor = (rank: number) => {
        switch (rank) {
            case 1: return 'text-yellow-500';
            case 2: return 'text-gray-400';
            case 3: return 'text-amber-600';
            default: return 'text-muted-foreground';
        }
    };

    const getRankBadge = (rank: number) => {
        if (rank <= 3) {
            return (
                <Medal className={`w-5 h-5 ${getMedalColor(rank)}`} />
            );
        }
        return (
            <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">
                {rank}
            </span>
        );
    };

    if (rankedPlayers.length === 0) {
        return null;
    }

    return (
        <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold">{title}</h3>
            </div>

            <div className="space-y-3">
                {rankedPlayers.map(({ player, average, count, rank }) => (
                    <div
                        key={player.id}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${rank === 1 ? 'bg-yellow-50 border border-yellow-200' : 'hover:bg-muted/50'
                            }`}
                    >
                        {getRankBadge(rank)}

                        {player.pixel_config && (
                            <PixelPlayer
                                config={player.pixel_config}
                                number={player.number}
                                size={40}
                            />
                        )}

                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{player.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {count}件の評価
                            </p>
                        </div>

                        <div className="text-right">
                            <p className={`text-xl font-bold ${average >= 7 ? 'text-green-600' :
                                average >= 5 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                {average.toFixed(1)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface TopRatedBannerProps {
    players: (Player & { pixel_config: PixelConfig })[];
    ratings: Record<string, { average: number; count: number }>;
}

interface TopPlayerData {
    player: Player & { pixel_config: PixelConfig };
    average: number;
    count: number;
}

export function TopRatedBanner({ players, ratings }: TopRatedBannerProps) {
    const topPlayer = useMemo((): TopPlayerData | null => {
        let best: TopPlayerData | null = null;

        players.forEach(player => {
            const rating = ratings[player.id];
            if (rating && (!best || rating.average > best.average)) {
                best = { player, average: rating.average, count: rating.count };
            }
        });

        return best;
    }, [players, ratings]);

    if (!topPlayer) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">今試合のMVP</span>
            </div>

            {topPlayer.player.pixel_config && (
                <PixelPlayer
                    config={topPlayer.player.pixel_config}
                    number={topPlayer.player.number}
                    size={48}
                />
            )}

            <div className="flex-1">
                <p className="font-bold text-lg">{topPlayer.player.name}</p>
                <p className="text-sm text-muted-foreground">{topPlayer.count}件の評価</p>
            </div>

            <div className="text-right">
                <p className="text-3xl font-bold text-yellow-600">{topPlayer.average.toFixed(1)}</p>
                <p className="text-xs text-yellow-600">平均評価</p>
            </div>
        </div>
    );
}

