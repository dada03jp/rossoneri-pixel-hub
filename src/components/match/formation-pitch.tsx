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
    const rowYMap: Record<number, number> = { 1: 88, 2: 72, 3: 54, 4: 36, 5: 16 };
    const roleToRow: Record<string, number> = {
        GK: 1, CB: 2, DF: 2, WB: 3, DM: 3, CM: 4, MF: 4, AM: 4, ST: 5, FW: 5,
    };
    const effectiveRow = posRow || roleToRow[role] || 3;
    const y = rowYMap[effectiveRow] ?? 50;

    if (posCol && posCol >= 1 && posCol <= 5) {
        const colXMap: Record<number, number> = { 1: 12, 2: 28, 3: 50, 4: 72, 5: 88 };
        return { x: colXMap[posCol] ?? 50, y };
    }

    const sideXMap: Record<string, number> = {
        FarLeft: 12, Left: 28, Center: 50, Right: 72, FarRight: 88,
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
    const spacing = Math.min(20, 76 / Math.max(count - 1, 1));
    const totalWidth = spacing * (count - 1);
    const startX = 50 - totalWidth / 2;
    return { x: startX + idx * spacing, y };
}

// ── Name display helper ──
function getDisplayName(fullName: string): string {
    // "Rafael Leão" -> "Leão", "Theo Hernández" -> "Hernández"
    // But for single-word names like "Pulisic" -> "Pulisic"
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    // Use last name, max 8 chars
    const lastName = parts[parts.length - 1];
    return lastName.length > 8 ? lastName.slice(0, 7) + '…' : lastName;
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
            className="relative w-full rounded-[16px] border border-black/[0.08] overflow-hidden"
            style={{
                aspectRatio: '3 / 4',
                maxHeight: '600px',
                background: `
                    repeating-linear-gradient(
                        180deg,
                        rgba(255,255,255,0.02) 0px,
                        rgba(255,255,255,0.02) 2px,
                        transparent 2px,
                        transparent 28px
                    ),
                    linear-gradient(180deg, 
                        #3a9d5c 0%, 
                        #2e8b4a 15%,
                        #34944f 30%,
                        #2a8544 45%,
                        #30904c 60%,
                        #288240 75%,
                        #2d8b47 90%,
                        #257a3c 100%
                    )
                `,
            }}
        >
            {/* Pitch Lines — refined */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Center circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[15%] aspect-square border border-white/25 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/30 rounded-full" />
                {/* Halfway line */}
                <div className="absolute top-1/2 left-[5%] right-[5%] h-px bg-white/25" />
                {/* Penalty area top */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[14%] border border-t-0 border-white/20 rounded-b-sm" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[22%] h-[7%] border border-t-0 border-white/20 rounded-b-sm" />
                {/* Penalty area bottom */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[40%] h-[14%] border border-b-0 border-white/20 rounded-t-sm" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[22%] h-[7%] border border-b-0 border-white/20 rounded-t-sm" />
                {/* Touchlines */}
                <div className="absolute inset-[4%] border border-white/15 rounded-sm" />
                {/* Vignette for depth */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/[0.06] via-transparent to-black/[0.08]" />
            </div>

            {/* Players */}
            {players.map(player => {
                const pos = getFormationPosition(player.role, player.side, formation, players, player.id, player.positionRow, player.positionCol);
                const isMvp = player.id === mvpPlayerId;
                const isSelected = player.id === selectedPlayerId;

                let score: number | null = null;
                if (viewMode === 'mine') {
                    score = userRatings[player.id] ?? null;
                } else {
                    score = ratings[player.id]?.average ?? null;
                }
                const hasScore = score !== null;

                return (
                    <button
                        key={player.id}
                        className="absolute group transition-transform duration-150 active:scale-90 focus:outline-none"
                        style={{
                            left: `${pos.x}%`,
                            top: `${pos.y}%`,
                            transform: `translate(-50%, -50%) ${isSelected ? 'scale(1.1)' : ''}`,
                            zIndex: isSelected ? 30 : isMvp ? 20 : 10,
                            // Min tap target 44px
                            minWidth: '44px',
                            minHeight: '44px',
                        }}
                        onClick={() => onPlayerSelect(player.id)}
                    >
                        <div className="relative flex flex-col items-center">
                            {/* MVP crown */}
                            {isMvp && (
                                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] leading-none z-10">⭐</span>
                            )}

                            {/* Selection ring */}
                            {isSelected && (
                                <div className="absolute inset-0 -m-1 rounded-full ring-2 ring-white/80 animate-pulse pointer-events-none" style={{ width: 'calc(100% + 8px)', height: 'calc(100% + 8px)', top: '-4px', left: '-4px' }} />
                            )}

                            {/* Player icon — larger */}
                            <div className={`w-10 h-10 sm:w-14 sm:h-14 relative ${
                                isMvp ? 'drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]' : ''
                            }`}>
                                {player.pixel_config ? (
                                    <div className="w-full h-full" style={{ imageRendering: 'pixelated' as any }}>
                                        <PixelPlayer config={player.pixel_config as PixelConfig} number={player.number} size={56} kitColors={kitColors} />
                                    </div>
                                ) : (
                                    <div className="w-full h-full rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                                        {player.number}
                                    </div>
                                )}
                            </div>

                            {/* Name label */}
                            <span className={`mt-0.5 whitespace-nowrap text-[9px] sm:text-[11px] font-semibold px-1.5 py-px rounded-sm leading-tight ${
                                isMvp ? 'bg-amber-400/90 text-black' : 'bg-black/70 text-white'
                            }`}>
                                {getDisplayName(player.name)}
                            </span>

                            {/* Score badge */}
                            <span className={`mt-px text-[9px] sm:text-[11px] font-bold px-1.5 py-px rounded-sm leading-tight tabular-nums ${
                                    hasScore
                                        ? isMvp
                                            ? 'bg-amber-400 text-black'
                                            : score! >= 7
                                                ? 'bg-emerald-500/90 text-white'
                                                : score! >= 5
                                                    ? 'bg-white/90 text-gray-800'
                                                    : 'bg-red-500/90 text-white'
                                        : 'bg-white/15 text-white/60'
                                }`}
                            >
                                {hasScore ? score!.toFixed(1) : '–'}
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
