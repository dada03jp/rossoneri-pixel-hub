import Link from 'next/link';
import { Calendar, Trophy } from 'lucide-react';

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

    const getResultStyle = () => {
        if (!isFinished || homeScore === null || awayScore === null) return '';
        if (homeScore > awayScore) return 'text-green-600 bg-green-50';
        if (homeScore < awayScore) return 'text-red-600 bg-red-50';
        return 'text-yellow-600 bg-yellow-50';
    };

    const getResultLabel = () => {
        if (!isFinished || homeScore === null || awayScore === null) return null;
        if (homeScore > awayScore) return 'WIN';
        if (homeScore < awayScore) return 'LOSE';
        return 'DRAW';
    };

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

                {/* Match Info */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        {/* Milan Logo Placeholder (Pixel Style) */}
                        <div className="w-10 h-10 milan-stripes rounded" />

                        <div>
                            <p className="text-sm text-muted-foreground">
                                {isHome ? 'HOME' : 'AWAY'}
                            </p>
                            <p className="font-semibold text-lg">AC Milan</p>
                        </div>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-2">
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

                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                                {isHome ? 'AWAY' : 'HOME'}
                            </p>
                            <p className="font-semibold text-lg">{opponentName}</p>
                        </div>

                        {/* Opponent Logo Placeholder */}
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                            <span className="text-xs font-bold text-muted-foreground">
                                {opponentName.slice(0, 2).toUpperCase()}
                            </span>
                        </div>
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
