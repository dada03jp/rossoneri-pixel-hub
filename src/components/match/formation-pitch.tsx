'use client';

import { PixelPlayer, PixelConfig } from '@/components/pixel-player';
import { useTeam } from '@/contexts/team-context';
import { useMemo } from 'react';

// ── Types ──

export interface PitchPlayer {
    id: string;
    name: string;
    number: number;
    pixel_config?: PixelConfig | null;
    role: string;
    side: string;
    positionRow?: number;
    positionCol?: number;
}

interface FormationPitchProps {
    players: PitchPlayer[];
    formation: string;
    ratings: Record<string, { average: number; count: number }>;
    userRatings: Record<string, number>;
    viewMode: 'mine' | 'all';
    mvpPlayerId: string | null;
    selectedPlayerId: string | null;
    isHome: boolean;
    onPlayerSelect: (playerId: string) => void;
}

// ── Formation position helper ──

function getFormationPosition(
    role: string, side: string, formation: string,
    allPlayers: PitchPlayer[], playerId: string,
    posRow?: number, posCol?: number
): { x: number; y: number } {
    const rowYMap: Record<number, number> = { 1: 90, 2: 74, 3: 56, 4: 38, 5: 18 };
    const roleToRow: Record<string, number> = {
        GK: 1, CB: 2, DF: 2, WB: 3, DM: 3, CM: 4, MF: 4, AM: 4, ST: 5, FW: 5,
    };
    const effectiveRow = posRow || roleToRow[role] || 3;
    const y = rowYMap[effectiveRow] ?? 50;

    if (posCol && posCol >= 1 && posCol <= 5) {
        const colXMap: Record<number, number> = { 1: 10, 2: 28, 3: 50, 4: 72, 5: 90 };
        return { x: colXMap[posCol] ?? 50, y };
    }

    const sideXMap: Record<string, number> = {
        FarLeft: 10, Left: 28, Center: 50, Right: 72, FarRight: 90,
    };
    if (sideXMap[side] !== undefined) return { x: sideXMap[side], y };

    // Spread centers
    const sameRow = allPlayers.filter(p => {
        const pRow = p.positionRow || roleToRow[p.role] || 3;
        return pRow === effectiveRow;
    });
    const centersInRow = sameRow.filter(p => !p.side || p.side === 'Center');
    const idx = centersInRow.findIndex(p => p.id === playerId);
    const count = Math.max(centersInRow.length, 1);
    if (count === 1) return { x: 50, y };
    const spacing = Math.min(20, 80 / Math.max(count - 1, 1));
    const totalWidth = spacing * (count - 1);
    const startX = 50 - totalWidth / 2;
    return { x: startX + idx * spacing, y };
}

// ── Component ──

export function FormationPitch({
    players, formation, ratings, userRatings, viewMode,
    mvpPlayerId, selectedPlayerId, isHome, onPlayerSelect,
}: FormationPitchProps) {
    const { team: teamConfig } = useTeam();

    const kitColors = useMemo(() => {
        return isHome
            ? { primary: teamConfig.kit.home.primary, secondary: teamConfig.kit.home.secondary }
            : { primary: teamConfig.kit.away.primary, secondary: teamConfig.kit.away.secondary };
    }, [isHome, teamConfig]);

    return (
        <div
            className="relative w-full aspect-[2/3] sm:aspect-[3/2] rounded-[16px] overflow-hidden border border-black/[0.08]"
            style={{
                background: 'linear-gradient(180deg, #2d8a4e 0%, #1e7a3e 50%, #1a6b35 100%)',
                minHeight: '320px',
            }}
        >
            {/* Pitch Lines */}
            <div className="absolute inset-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white/20 rounded-full" />
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-12 border-2 border-t-0 border-white/20" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-12 border-2 border-b-0 border-white/20" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 border-2 border-t-0 border-white/20" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-20 border-2 border-b-0 border-white/20" />
            </div>

            {/* Tap hint overlay — only when no player is selected */}
            {!selectedPlayerId && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 bg-black/50 backdrop-blur-sm text-white text-[11px] px-3 py-1.5 rounded-full">
                    選手をタップして採点
                </div>
            )}

            {/* Players */}
            {players.map(player => {
                const pos = getFormationPosition(player.role, player.side, formation, players, player.id, player.positionRow, player.positionCol);

                const isMvp = player.id === mvpPlayerId;
                const isSelected = player.id === selectedPlayerId;

                // Score display
                let score: number | null = null;
                if (viewMode === 'mine') {
                    score = userRatings[player.id] ?? null;
                } else {
                    score = ratings[player.id]?.average ?? null;
                }

                const hasScore = score !== null;
                const dynamicZ = Math.round(100 - pos.y) + (isMvp ? 50 : 0) + (isSelected ? 100 : 0);

                return (
                    <div
                        key={player.id}
                        className={`absolute group cursor-pointer transition-all duration-200 ${isSelected ? 'scale-115' : 'hover:scale-110 active:scale-95'}`}
                        style={{
                            left: `${pos.x}%`,
                            top: `${pos.y}%`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: dynamicZ,
                        }}
                        onClick={() => onPlayerSelect(player.id)}
                    >
                        <div className="relative">
                            {/* MVP crown */}
                            {isMvp && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] sm:text-xs leading-none">⭐</span>
                            )}

                            {/* Player icon */}
                            <div className={`w-7 h-7 sm:w-12 sm:h-12 transition-all duration-200 ${
                                isMvp ? 'ring-2 ring-amber-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.4)]' : ''
                            } ${isSelected ? 'ring-2 ring-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.5)]' : ''}`}>
                                {player.pixel_config && (
                                    <div className="w-7 h-7 sm:w-12 sm:h-12" style={{ imageRendering: 'pixelated' as any }}>
                                        <PixelPlayer config={player.pixel_config as PixelConfig} number={player.number} size={48} kitColors={kitColors} />
                                    </div>
                                )}
                            </div>

                            {/* Name label */}
                            <span
                                className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] sm:text-[11px] font-bold px-1 py-px rounded text-center leading-none ${
                                    isMvp ? 'bg-amber-400 text-black' : 'bg-black/80 text-white'
                                }`}
                                style={{ top: '100%', marginTop: '1px' }}
                            >
                                {player.name.split(' ').pop()?.slice(0, 6) || ''}
                            </span>

                            {/* Score badge */}
                            <span
                                className={`absolute left-1/2 -translate-x-1/2 text-[8px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded leading-none tabular-nums transition-all duration-200 ${
                                    hasScore
                                        ? isMvp
                                            ? 'bg-amber-400 text-black border border-amber-500'
                                            : score! >= 7
                                                ? 'bg-emerald-500 text-white'
                                                : score! >= 5
                                                    ? 'bg-white text-black border border-white/30'
                                                    : 'bg-red-500 text-white'
                                        : 'bg-white/20 text-white/70 border border-white/10'
                                }`}
                                style={{ top: '100%', marginTop: '14px' }}
                            >
                                {hasScore ? score!.toFixed(1) : '—'}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
