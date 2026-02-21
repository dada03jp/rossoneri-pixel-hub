import { createClient } from '@/lib/supabase/server';
import { MatchCard } from '@/components/match-card';
import { Calendar, TrendingUp, Filter } from 'lucide-react';
import { MOCK_MATCHES } from '@/lib/mock-data';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface MatchesPageProps {
    searchParams: Promise<{ filter?: string }>;
}

export default async function MatchesPage({ searchParams }: MatchesPageProps) {
    const params = await searchParams;
    const filter = params.filter || 'all';

    const supabase = await createClient();
    const { data: matches, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true });

    const allMatches = matches || MOCK_MATCHES;

    // Filter and sort matches appropriately
    // 今後 = 昇順（近い順）、結果 = 降順（最新順）
    const finishedMatches = [...allMatches]
        .filter(m => m.status === 'finished')
        .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime()); // 降順

    const upcomingMatches = [...allMatches]
        .filter(m => m.status !== 'finished')
        .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()); // 昇順

    // "all" の場合は今後を先に、次に結果を表示
    const displayMatches = filter === 'finished'
        ? finishedMatches
        : filter === 'upcoming'
            ? upcomingMatches
            : [...upcomingMatches, ...finishedMatches];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold">試合一覧</h1>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                    <Link
                        href="/matches?filter=all"
                        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${filter === 'all' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                            }`}
                    >
                        すべて ({allMatches.length})
                    </Link>
                    <Link
                        href="/matches?filter=upcoming"
                        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${filter === 'upcoming' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                            }`}
                    >
                        今後 ({upcomingMatches.length})
                    </Link>
                    <Link
                        href="/matches?filter=finished"
                        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${filter === 'finished' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                            }`}
                    >
                        結果 ({finishedMatches.length})
                    </Link>
                </div>
            </div>

            {/* Matches Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                {displayMatches.map(match => (
                    <MatchCard
                        key={match.id}
                        id={match.id}
                        opponentName={match.opponent_name}
                        matchDate={match.match_date}
                        homeScore={match.home_score}
                        awayScore={match.away_score}
                        isFinished={match.status === 'finished'}
                        competition={match.competition || 'Serie A'}
                        isHome={match.is_home ?? true}
                    />
                ))}
            </div>

            {displayMatches.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>試合データがありません</p>
                </div>
            )}
        </div>
    );
}
