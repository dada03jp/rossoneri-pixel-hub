import Link from 'next/link';
import { Calendar, Trophy } from 'lucide-react';
import { getTeamColors } from '@/lib/team-colors';

interface TeamKit {
    home: { primary: string; secondary: string; stripe: boolean };
    away: { primary: string; secondary: string; stripe: boolean };
}

type MatchStatus = 'finished' | 'live' | 'upcoming' | 'pending';

interface MatchCardProps {
    id: string;
    teamId: string;
    teamName?: string;
    teamKit?: TeamKit;
    opponentName: string;
    matchDate: string;
    homeScore: number | null;
    awayScore: number | null;
    status: MatchStatus;
    competition: string;
    isHome?: boolean;
}

export function MatchCard({
    id,
    teamId,
    teamName = 'AC Milan',
    teamKit,
    opponentName,
    matchDate,
    homeScore,
    awayScore,
    status,
    competition,
    isHome = true,
}: MatchCardProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const isFinished = status === 'finished';
    const myScore = isHome ? homeScore : awayScore;
    const opponentScore = isHome ? awayScore : homeScore;

    const getResultStyle = () => {
        if (!isFinished || myScore === null || opponentScore === null) return '';
        if (myScore > opponentScore) return 'text-green-600 bg-green-50';
        if (myScore < opponentScore) return 'text-red-600 bg-red-50';
        return 'text-yellow-600 bg-yellow-50';
    };

    const getResultLabel = () => {
        if (!isFinished || myScore === null || opponentScore === null) return null;
        if (myScore > opponentScore) return 'WIN';
        if (myScore < opponentScore) return 'LOSE';
        return 'DRAW';
    };

    const getStatusBadge = () => {
        if (status === 'live') {
            return (
                <span className="ml-auto flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    LIVE
                </span>
            );
        }
        if (status === 'pending') {
            return (
                <span className="ml-auto flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    結果待ち
                </span>
            );
        }
        if (getResultLabel()) {
            return (
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded ${getResultStyle()}`}>
                    {getResultLabel()}
                </span>
            );
        }
        return null;
    };

    const opponentColors = getTeamColors(opponentName);

    // チームキット色（デフォルトはミランの色）
    const kit = teamKit || {
        home: { primary: '#AB0920', secondary: '#000000', stripe: true },
        away: { primary: '#FFFFFF', secondary: '#FAFAFF', stripe: false },
    };
    const myKit = isHome ? kit.home : kit.away;

    return (
        <Link href={`/${teamId}/matches/${id}`}>
            <div className="group relative bg-card border border-border rounded-lg p-4 hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer">
                {/* Competition Badge + Status */}
                <div className="flex items-center gap-2 mb-3">
                    <Trophy className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {competition}
                    </span>
                    {getStatusBadge()}
                </div>

                {/* Match Info */}
                <div className="flex items-center justify-between mb-3">
                    {/* Home Team */}
                    <div className="flex items-center gap-3 flex-1">
                        {isHome ? (
                            <>
                                <div className="w-10 h-10 rounded-sm overflow-hidden flex border border-black shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
                                    <div className="w-1/2 h-full" style={{ backgroundColor: myKit.primary }} />
                                    <div className="w-1/2 h-full" style={{ backgroundColor: myKit.secondary }} />
                                </div>
                                <div>
                                    <p className="font-semibold text-lg">{teamName}</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-10 h-10 rounded-sm overflow-hidden flex border border-black shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
                                    <div className="w-1/2 h-full" style={{ backgroundColor: opponentColors.primary }} />
                                    <div className="w-1/2 h-full" style={{ backgroundColor: opponentColors.secondary }} />
                                </div>
                                <div>
                                    <p className="font-semibold text-lg">{opponentName}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-2 px-4">
                        {isFinished ? (
                            <div className="flex items-center gap-2 text-2xl font-bold">
                                <span className={homeScore !== null && awayScore !== null && homeScore > awayScore ? 'text-primary' : ''}>
                                    {homeScore ?? '-'}
                                </span>
                                <span className="text-muted-foreground">-</span>
                                <span className={homeScore !== null && awayScore !== null && awayScore > homeScore ? 'text-primary' : ''}>
                                    {awayScore ?? '-'}
                                </span>
                            </div>
                        ) : status === 'pending' ? (
                            <div className="text-sm font-medium text-orange-600">結果待ち</div>
                        ) : (
                            <div className="text-lg font-medium text-muted-foreground">VS</div>
                        )}
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center gap-3 flex-1 justify-end">
                        {!isHome ? (
                            <>
                                <div className="text-right">
                                    <p className="font-semibold text-lg">{teamName}</p>
                                </div>
                                <div className="w-10 h-10 rounded-sm overflow-hidden flex border border-black shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
                                    <div className="w-1/2 h-full" style={{ backgroundColor: kit.away.primary }} />
                                    <div className="w-1/2 h-full" style={{ backgroundColor: kit.away.secondary }} />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-right">
                                    <p className="font-semibold text-lg">{opponentName}</p>
                                </div>
                                <div className="w-10 h-10 rounded-sm overflow-hidden flex border border-black shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
                                    <div className="w-1/2 h-full" style={{ backgroundColor: opponentColors.primary }} />
                                    <div className="w-1/2 h-full" style={{ backgroundColor: opponentColors.secondary }} />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(matchDate)}</span>
                </div>

                {/* Hover Indicator */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-b-lg" />
            </div>
        </Link>
    );
}

export default MatchCard;
