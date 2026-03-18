'use client';

import { Trophy, Calendar, Star, Share2, Download } from 'lucide-react';
import { useTeam } from '@/contexts/team-context';
import { getTeamColors } from '@/lib/team-colors';
import { Match, MatchEvent } from '@/types/database';

interface MatchHeroProps {
    match: Match;
    events: MatchEvent[];
    matchAverageRating: number | null;
    userRatingsCount: number;
    onShareCard?: () => void;
}

export function MatchHero({ match, events, matchAverageRating, userRatingsCount, onShareCard }: MatchHeroProps) {
    const { team: teamConfig } = useTeam();

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const opponentColors = getTeamColors(match.opponent_name);

    // Badge component for result
    const getResultBadge = () => {
        if (match.status !== 'finished' || match.home_score === null || match.away_score === null) return null;
        const milanScore = match.is_home ? match.home_score : match.away_score;
        const opponentScore = match.is_home ? match.away_score : match.home_score;
        if (milanScore > opponentScore) return <span className="bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">勝利</span>;
        if (milanScore === opponentScore) return <span className="bg-amber-500/10 text-amber-600 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/20">引き分け</span>;
        return <span className="bg-red-500/10 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-500/20">敗北</span>;
    };

    const renderTeamBadge = (colors: { primary: string; secondary: string }, name: string) => (
        <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 md:w-18 md:h-18 rounded-full overflow-hidden flex shadow-sm border border-black/[0.06]">
                <div className="w-1/2 h-full" style={{ backgroundColor: colors.primary }} />
                <div className="w-1/2 h-full" style={{ backgroundColor: colors.secondary }} />
            </div>
            <p className="text-sm md:text-base font-bold text-foreground">{name}</p>
        </div>
    );

    const renderEvents = (isMilanSide: boolean) => {
        if (match.status !== 'finished' || events.length === 0) return null;
        const filtered = events
            .filter(e => ['goal', 'yellow_card', 'red_card'].includes(e.event_type))
            .filter(e => {
                const isMilanEvent = String(e.details?.is_milan) !== 'false';
                return match.is_home
                    ? (isMilanSide ? isMilanEvent : !isMilanEvent)
                    : (isMilanSide ? !isMilanEvent : isMilanEvent);
            })
            .sort((a, b) => a.minute - b.minute);
        if (filtered.length === 0) return null;
        return (
            <div className="mt-2 text-[11px] text-muted-foreground space-y-0.5">
                {filtered.map((e, i) => (
                    <div key={i}>
                        {e.event_type === 'goal' && '⚽ '}
                        {e.event_type === 'yellow_card' && '🟨 '}
                        {e.event_type === 'red_card' && '🟥 '}
                        {e.player_name.split(' ').pop()} {e.minute}&apos;
                        {e.event_type === 'goal' && String(e.details?.penalty) === 'true' && ' (PK)'}
                        {e.event_type === 'goal' && e.details?.assisted_by && (
                            <span className="text-muted-foreground/60"> (🅰️{String(e.details.assisted_by).split(' ').pop()})</span>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <section
            className="relative overflow-hidden rounded-[16px] border border-black/[0.06]"
            style={{
                background: `linear-gradient(145deg, #fafafa 0%, #f7f7f7 50%, color-mix(in srgb, ${teamConfig.colors.primary} 3%, #f5f5f5) 100%)`,
            }}
        >
            {/* Accent glow */}
            <div className="absolute -top-20 -right-20 w-[250px] h-[250px] opacity-[0.04] blur-[60px] rounded-full"
                style={{ backgroundColor: teamConfig.colors.accent }}
            />

            <div className="relative z-10 px-5 py-6 md:px-10 md:py-8">
                {/* Competition + Date */}
                <div className="text-center mb-5">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>{match.competition}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(match.match_date)}
                    </div>
                </div>

                {/* Teams + Score */}
                <div className="flex items-center justify-center gap-4 md:gap-8">
                    {/* Home side */}
                    <div className="flex-1 flex flex-col items-center">
                        {match.is_home
                            ? renderTeamBadge(teamConfig.colors, teamConfig.name)
                            : renderTeamBadge(opponentColors, match.opponent_name)
                        }
                        {renderEvents(true)}
                    </div>

                    {/* Score */}
                    <div className="flex flex-col items-center">
                        {match.status === 'finished' ? (
                            <>
                                <div className="flex items-center gap-3 text-4xl md:text-5xl font-bold tabular-nums">
                                    <span className={
                                        (match.is_home && match.home_score! > match.away_score!) ||
                                        (!match.is_home && match.away_score! > match.home_score!)
                                            ? 'text-foreground' : 'text-muted-foreground/50'
                                    }>
                                        {match.home_score}
                                    </span>
                                    <span className="text-muted-foreground/30 text-2xl">-</span>
                                    <span className={
                                        (!match.is_home && match.home_score! > match.away_score!) ||
                                        (match.is_home && match.away_score! > match.home_score!)
                                            ? 'text-foreground' : 'text-muted-foreground/50'
                                    }>
                                        {match.away_score}
                                    </span>
                                </div>
                                <div className="mt-2">{getResultBadge()}</div>
                            </>
                        ) : (
                            <div className="text-2xl font-bold text-muted-foreground/40">VS</div>
                        )}
                    </div>

                    {/* Away side */}
                    <div className="flex-1 flex flex-col items-center">
                        {!match.is_home
                            ? renderTeamBadge(teamConfig.colors, teamConfig.name)
                            : renderTeamBadge(opponentColors, match.opponent_name)
                        }
                        {renderEvents(false)}
                    </div>
                </div>

                {/* Footer: average rating + share */}
                <div className="flex items-center justify-center gap-6 mt-5 pt-4 border-t border-black/[0.04]">
                    {matchAverageRating && (
                        <div className="flex items-center gap-1.5 text-sm">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-muted-foreground">チーム平均</span>
                            <strong className="text-amber-600 tabular-nums">{matchAverageRating.toFixed(1)}</strong>
                        </div>
                    )}
                    {match.status === 'finished' && userRatingsCount > 0 && onShareCard && (
                        <button
                            onClick={onShareCard}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Download className="w-3.5 h-3.5" />
                            採点カードを保存
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}
