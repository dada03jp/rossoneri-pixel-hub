import Link from 'next/link';
import { Calendar, Trophy } from 'lucide-react';
import { getTeamColors, MILAN_COLORS } from '@/lib/team-colors';

interface MatchCardProps {
    id: string;
    opponentName: string;
    matchDate: string;
    homeScore: number | null;
    awayScore: number | null;
    isFinished: boolean;
    competition: string;
    isHome?: boolean;
}

export function MatchCard({
    id,
    opponentName,
    matchDate,
    homeScore,
    awayScore,
    isFinished,
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

    // ミランのスコアと相手のスコアを取得
    const milanScore = isHome ? homeScore : awayScore;
    const opponentScore = isHome ? awayScore : homeScore;

    const getResultStyle = () => {
        if (!isFinished || milanScore === null || opponentScore === null) return '';
        if (milanScore > opponentScore) return 'text-green-600 bg-green-50';
        if (milanScore < opponentScore) return 'text-red-600 bg-red-50';
        return 'text-yellow-600 bg-yellow-50';
    };

    const getResultLabel = () => {
        if (!isFinished || milanScore === null || opponentScore === null) return null;
        if (milanScore > opponentScore) return 'WIN';
        if (milanScore < opponentScore) return 'LOSE';
        return 'DRAW';
    };

    const opponentColors = getTeamColors(opponentName);
    const milanKit = isHome ? MILAN_COLORS.home : MILAN_COLORS.away;

    return (
        <Link href={`/matches/${id}`}>
            <div className="group relative bg-card border border-border rounded-lg p-4 hover:border-primary hover:shadow-lg transition-all duration-200 cursor-pointer">
                {/* Competition Badge */}
                <div className="flex items-center gap-2 mb-3">
                    <Trophy className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {competition}
                    </span>
                    {getResultLabel() && (
                        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded ${getResultStyle()}`}>
                            {getResultLabel()}
                        </span>
                    )}
                </div>

                {/* Match Info - Home team on left, Away team on right */}
                <div className="flex items-center justify-between mb-3">
                    {/* Home Team (Left Side) */}
                    <div className="flex items-center gap-3 flex-1">
                        {isHome ? (
                            <>
                                {/* Milan is Home */}
                                <div className="w-10 h-10 rounded overflow-hidden flex">
                                    <div className="w-1/2 h-full bg-[#AB0920]" />
                                    <div className="w-1/2 h-full bg-black" />
                                </div>
                                <div>
                                    <p className="font-semibold text-lg">AC Milan</p>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Opponent is Home - 2 color stripes */}
                                <div className="w-10 h-10 rounded overflow-hidden flex">
                                    <div className="w-1/2 h-full" style={{ backgroundColor: opponentColors.primary }} />
                                    <div className="w-1/2 h-full" style={{ backgroundColor: opponentColors.secondary }} />
                                </div>
                                <div>
                                    <p className="font-semibold text-lg">{opponentName}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Score - always home_score - away_score */}
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
                        ) : (
                            <div className="text-lg font-medium text-muted-foreground">
                                VS
                            </div>
                        )}
                    </div>

                    {/* Away Team (Right Side) */}
                    <div className="flex items-center gap-3 flex-1 justify-end">
                        {!isHome ? (
                            <>
                                {/* Milan is Away */}
                                <div className="text-right">
                                    <p className="font-semibold text-lg">AC Milan</p>
                                </div>
                                <div className="w-10 h-10 rounded overflow-hidden border border-gray-200">
                                    <div className="w-full h-full bg-white" />
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Opponent is Away - 2 color stripes */}
                                <div className="text-right">
                                    <p className="font-semibold text-lg">{opponentName}</p>
                                </div>
                                <div className="w-10 h-10 rounded overflow-hidden flex">
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
