import { MatchCard } from '@/components/match-card';
import { Zap } from 'lucide-react';

interface NextMatchCardProps {
    match: {
        id: string;
        opponent_name: string;
        match_date: string;
        home_score: number | null;
        away_score: number | null;
        competition: string | null;
        is_home: boolean | null;
    };
    teamId: string;
    teamName: string;
    teamKit: {
        home: { primary: string; secondary: string; stripe: boolean };
        away: { primary: string; secondary: string; stripe: boolean };
    };
    status: 'finished' | 'live' | 'upcoming' | 'pending';
    accentColor: string;
    isLive?: boolean;
}

export function NextMatchCard({
    match,
    teamId,
    teamName,
    teamKit,
    status,
    accentColor,
    isLive = false,
}: NextMatchCardProps) {
    return (
        <section className="space-y-4">
            <div className="flex items-center gap-2.5">
                {isLive ? (
                    <>
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                        </span>
                        <h2 className="text-lg font-bold tracking-tight text-red-600">LIVE NOW</h2>
                    </>
                ) : (
                    <>
                        <Zap className="w-5 h-5" style={{ color: accentColor }} />
                        <h2 className="text-lg font-bold tracking-tight">NEXT MATCH</h2>
                    </>
                )}
            </div>
            <div
                className="rounded-[14px] overflow-hidden transition-all duration-200 hover:shadow-lg"
                style={{
                    border: `2px solid color-mix(in srgb, ${isLive ? '#ef4444' : accentColor} 20%, transparent)`,
                    background: `linear-gradient(135deg, white 0%, color-mix(in srgb, ${isLive ? '#ef4444' : accentColor} 3%, white) 100%)`,
                }}
            >
                <MatchCard
                    id={match.id}
                    teamId={teamId}
                    teamName={teamName}
                    teamKit={teamKit}
                    opponentName={match.opponent_name}
                    matchDate={match.match_date}
                    homeScore={match.home_score}
                    awayScore={match.away_score}
                    status={status}
                    competition={match.competition || 'League'}
                    isHome={match.is_home ?? true}
                    variant="premium"
                />
            </div>
        </section>
    );
}
