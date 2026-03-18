import { createClient } from '@/lib/supabase/server';
import { MatchCard } from '@/components/match-card';
import { Calendar, Clock } from 'lucide-react';
import { MOCK_MATCHES } from '@/lib/mock-data';
import Link from 'next/link';
import { getTeamConfig } from '@/lib/team-config';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface MatchesPageProps {
    params: Promise<{ team_id: string }>;
    searchParams: Promise<{ filter?: string }>;
}

/**
 * MatchCard用のstatus propを算出
 * DB statusを尊重しつつ、UI側で日時照合して破綻防止
 */
function getDisplayStatus(match: { status: string; match_date: string }): 'finished' | 'live' | 'upcoming' | 'pending' {
    if (match.status === 'finished') return 'finished';
    if (match.status === 'live') return 'live';
    const matchTime = new Date(match.match_date).getTime();
    const now = Date.now();
    if (matchTime < now) return 'pending';
    return 'upcoming';
}

/**
 * 3区分の相互排他振り分け
 */
function classifyMatch(match: { status: string; match_date: string }): 'finished' | 'pending' | 'upcoming' {
    if (match.status === 'finished') return 'finished';
    const matchTime = new Date(match.match_date).getTime();
    const now = Date.now();
    return matchTime < now ? 'pending' : 'upcoming';
}

export default async function MatchesPage({ params, searchParams }: MatchesPageProps) {
    const { team_id } = await params;
    const teamConfig = getTeamConfig(team_id);
    if (!teamConfig) notFound();

    const sp = await searchParams;
    const filter = sp.filter || 'all';

    const supabase = await createClient();
    const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: true });

    const allMatches = matches || MOCK_MATCHES;

    // 3区分に相互排他的に振り分け
    const finishedMatches = [...allMatches]
        .filter(m => classifyMatch(m) === 'finished')
        .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

    const pendingMatches = [...allMatches]
        .filter(m => classifyMatch(m) === 'pending')
        .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

    const upcomingMatches = [...allMatches]
        .filter(m => classifyMatch(m) === 'upcoming')
        .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());

    // フィルタに応じた表示
    const displayMatches = filter === 'finished'
        ? finishedMatches
        : filter === 'upcoming'
            ? [...pendingMatches, ...upcomingMatches]
            : [...pendingMatches, ...upcomingMatches, ...finishedMatches];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold">試合一覧</h1>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                    <Link
                        href={`/${team_id}/matches?filter=all`}
                        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${filter === 'all' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                            }`}
                    >
                        すべて ({allMatches.length})
                    </Link>
                    <Link
                        href={`/${team_id}/matches?filter=upcoming`}
                        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${filter === 'upcoming' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                            }`}
                    >
                        今後 ({upcomingMatches.length + pendingMatches.length})
                    </Link>
                    <Link
                        href={`/${team_id}/matches?filter=finished`}
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
                        teamId={team_id}
                        teamName={teamConfig.name}
                        teamKit={teamConfig.kit}
                        opponentName={match.opponent_name}
                        matchDate={match.match_date}
                        homeScore={match.home_score}
                        awayScore={match.away_score}
                        status={getDisplayStatus(match)}
                        competition={match.competition || 'Serie A'}
                        isHome={match.is_home ?? true}
                    />
                ))}
            </div>

            {displayMatches.length === 0 && (
                <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
                    <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground font-medium">試合データがありません</p>
                </div>
            )}
        </div>
    );
}
