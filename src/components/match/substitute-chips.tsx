'use client';

import { PixelPlayer, PixelConfig } from '@/components/pixel-player';
import { useTeam } from '@/contexts/team-context';
import { useMemo } from 'react';

interface SubstitutePlayer {
    id: string;
    name: string;
    number: number;
    position: string;
    pixel_config?: PixelConfig | null;
}

interface SubstituteChipsProps {
    players: SubstitutePlayer[];
    ratings: Record<string, { average: number; count: number }>;
    userRatings: Record<string, number>;
    viewMode: 'mine' | 'all';
    isHome: boolean;
    onPlayerSelect: (playerId: string) => void;
}

function getScoreChipStyle(value: number) {
    if (value >= 7) return 'bg-emerald-500 text-white';
    if (value >= 5) return 'bg-white text-foreground border border-black/[0.08]';
    return 'bg-red-500 text-white';
}

export function SubstituteChips({
    players, ratings, userRatings, viewMode, isHome, onPlayerSelect,
}: SubstituteChipsProps) {
    const { team: teamConfig } = useTeam();

    const kitColors = useMemo(() => {
        return isHome
            ? { primary: teamConfig.kit.home.primary, secondary: teamConfig.kit.home.secondary }
            : { primary: teamConfig.kit.away.primary, secondary: teamConfig.kit.away.secondary };
    }, [isHome, teamConfig]);

    if (players.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2">
            {players.map(player => {
                let score: number | null = null;
                if (viewMode === 'mine') {
                    score = userRatings[player.id] ?? null;
                } else {
                    score = ratings[player.id]?.average ?? null;
                }

                return (
                    <button
                        key={player.id}
                        onClick={() => onPlayerSelect(player.id)}
                        className="group flex items-center gap-2 bg-white border border-black/[0.06] rounded-[12px] px-3 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                    >
                        {player.pixel_config && (
                            <div className="w-9 h-9 flex-shrink-0" style={{ imageRendering: 'pixelated' as any }}>
                                <PixelPlayer config={player.pixel_config as PixelConfig} number={player.number} size={36} kitColors={kitColors} />
                            </div>
                        )}
                        <div className="text-left min-w-0">
                            <p className="text-xs font-medium truncate max-w-[80px]">{player.name.split(' ').pop()}</p>
                            <p className="text-[10px] text-muted-foreground">#{player.number}</p>
                        </div>
                        {score !== null ? (
                            <span className={`text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded-md ${getScoreChipStyle(score)}`}>
                                {score.toFixed(1)}
                            </span>
                        ) : (
                            <span className="text-[11px] text-muted-foreground/40 px-1.5 py-0.5">· · ·</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
