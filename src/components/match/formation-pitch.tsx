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

// ── Position calculation ──

function getFormationPosition(
    role: string, side: string, formation: string,
    allPlayers: PitchPlayer[], playerId: string,
    posRow?: number, posCol?: number
): { x: number; y: number } {
    const rowYMap: Record<number, number> = { 1: 87, 2: 70, 3: 52, 4: 34, 5: 14 };
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

    const sameRow = allPlayers.filter(p => {
        const pRow = p.positionRow || roleToRow[p.role] || 3;
        return pRow === effectiveRow;
    });
    const centersInRow = sameRow.filter(p => !p.side || p.side === 'Center');
    const idx = centersInRow.findIndex(p => p.id === playerId);
    const count = Math.max(centersInRow.length, 1);
    if (count === 1) return { x: 50, y };
    const spacing = Math.min(22, 76 / Math.max(count - 1, 1));
    const totalWidth = spacing * (count - 1);
    const startX = 50 - totalWidth / 2;
    return { x: startX + idx * spacing, y };
}

// ── Name helper — smart abbreviation ──
function getDisplayName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].length > 9 ? parts[0].slice(0, 8) + '.' : parts[0];
    }
    const lastName = parts[parts.length - 1];
    return lastName.length > 9 ? lastName.slice(0, 8) + '.' : lastName;
}

// ── Score color ──
function getScoreBadgeStyle(score: number): string {
    if (score >= 7) return 'bg-emerald-500 text-white';
    if (score >= 5) return 'bg-white text-gray-800 border border-white/30';
    return 'bg-red-500 text-white';
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
        <div className="relative w-full" style={{ maxWidth: '600px', margin: '0 auto' }}>
            {/* Pitch container */}
            <div
                className="relative w-full rounded-[18px] border border-black/10 overflow-hidden shadow-lg"
                style={{
                    aspectRatio: '3 / 4',
                    background: `
                        repeating-linear-gradient(
                            180deg,
                            rgba(255,255,255,0.025) 0px,
                            rgba(255,255,255,0.025) 2px,
                            transparent 2px,
                            transparent 30px
                        ),
                        linear-gradient(180deg, 
                            #3da85e 0%, 
                            #389d54 12%,
                            #35964f 24%,
                            #329048 36%,
                            #358e50 48%,
                            #30884a 60%,
                            #2d8345 72%,
                            #2a7e40 84%,
                            #27793b 100%
                        )
                    `,
                }}
            >
                {/* Pitch markings */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Touchlines */}
                    <div className="absolute inset-[4.5%] border border-white/[0.18] rounded-sm" />
                    {/* Halfway line */}
                    <div className="absolute top-1/2 left-[4.5%] right-[4.5%] h-px bg-white/[0.18]" />
                    {/* Center circle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[16%] aspect-square border border-white/[0.18] rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/[0.22] rounded-full" />
                    {/* Top penalty box */}
                    <div className="absolute top-[4.5%] left-1/2 -translate-x-1/2 w-[42%] h-[13%] border border-t-0 border-white/[0.15] rounded-b-sm" />
                    <div className="absolute top-[4.5%] left-1/2 -translate-x-1/2 w-[24%] h-[6.5%] border border-t-0 border-white/[0.15] rounded-b-sm" />
                    {/* Bottom penalty box */}
                    <div className="absolute bottom-[4.5%] left-1/2 -translate-x-1/2 w-[42%] h-[13%] border border-b-0 border-white/[0.15] rounded-t-sm" />
                    <div className="absolute bottom-[4.5%] left-1/2 -translate-x-1/2 w-[24%] h-[6.5%] border border-b-0 border-white/[0.15] rounded-t-sm" />
                    {/* Subtle corner arcs */}
                    <div className="absolute top-[4.5%] left-[4.5%] w-3 h-3 border-b border-r border-white/[0.12] rounded-br-full" />
                    <div className="absolute top-[4.5%] right-[4.5%] w-3 h-3 border-b border-l border-white/[0.12] rounded-bl-full" />
                    <div className="absolute bottom-[4.5%] left-[4.5%] w-3 h-3 border-t border-r border-white/[0.12] rounded-tr-full" />
                    <div className="absolute bottom-[4.5%] right-[4.5%] w-3 h-3 border-t border-l border-white/[0.12] rounded-tl-full" />
                    {/* Top-to-bottom vignette for depth */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/[0.05] via-transparent to-black/[0.07] rounded-[18px]" />
                    {/* Inner glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/[0.03] via-transparent to-black/[0.03]" />
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
                            className={`absolute group focus:outline-none
                                transition-transform duration-200 ease-out
                                hover:-translate-y-1 hover:scale-105
                                active:scale-95
                            `}
                            style={{
                                left: `${pos.x}%`,
                                top: `${pos.y}%`,
                                transform: `translate(-50%, -50%)`,
                                zIndex: isSelected ? 25 : isMvp ? 15 : 10,
                                minWidth: '48px',
                                minHeight: '48px',
                            }}
                            onClick={() => onPlayerSelect(player.id)}
                        >
                            <div className="relative flex flex-col items-center gap-0">
                                {/* MVP indicator */}
                                {isMvp && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs leading-none z-10 drop-shadow-sm">⭐</span>
                                )}

                                {/* Selection ring */}
                                {isSelected && (
                                    <div className="absolute -inset-1.5 rounded-full border-2 border-white/70 animate-pulse pointer-events-none" />
                                )}

                                {/* Player icon */}
                                <div className={`w-12 h-12 sm:w-16 sm:h-16 relative ${
                                    isMvp ? 'drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]'
                                }`}>
                                    {player.pixel_config ? (
                                        <div className="w-full h-full" style={{ imageRendering: 'pixelated' as any }}>
                                            <PixelPlayer config={player.pixel_config as PixelConfig} number={player.number} size={64} kitColors={kitColors} />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-white/25 flex items-center justify-center text-white text-sm font-bold shadow-inner">
                                            {player.number}
                                        </div>
                                    )}
                                </div>

                                {/* Name label — compact pill */}
                                <span className={`whitespace-nowrap text-[10px] sm:text-[11px] font-semibold px-1.5 py-[1px] rounded leading-tight mt-px ${
                                    isMvp
                                        ? 'bg-amber-400/95 text-black shadow-sm'
                                        : 'bg-black/75 text-white'
                                }`}>
                                    {getDisplayName(player.name)}
                                </span>

                                {/* Score badge */}
                                <span className={`text-[10px] sm:text-[11px] font-bold px-1.5 py-[1px] rounded leading-tight tabular-nums mt-px ${
                                    hasScore
                                        ? isMvp
                                            ? 'bg-amber-400 text-black shadow-sm'
                                            : getScoreBadgeStyle(score!)
                                        : 'bg-white/20 text-white/70 border border-white/10'
                                }`}>
                                    {hasScore ? score!.toFixed(1) : '· · ·'}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
