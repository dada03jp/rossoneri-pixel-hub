import { createClient } from '@/lib/supabase/server';
import { MatchCard } from '@/components/match-card';
import { PixelPlayer } from '@/components/pixel-player';
import { Calendar, Users, Star, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react';
import { MOCK_MATCHES, MOCK_PLAYERS } from '@/lib/mock-data';
import Link from 'next/link';
import { getTeamConfig } from '@/lib/team-config';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ team_id: string }>;
}

async function getMatches() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('matches')
            .select('*')
            .order('match_date', { ascending: true });

        if (error) {
            console.error('Supabase error:', error);
            return null;
        }
        return data;
    } catch (e) {
        console.error('Failed to fetch from Supabase:', e);
        return null;
    }
}

async function getPlayers() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('players')
            .select('*')
            .order('number', { ascending: true });

        if (error) {
            console.error('Supabase error:', error);
            return null;
        }
        return data;
    } catch (e) {
        console.error('Failed to fetch from Supabase:', e);
        return null;
    }
}

export default async function TeamHome({ params }: PageProps) {
    const { team_id } = await params;
    const teamConfig = getTeamConfig(team_id);
    if (!teamConfig) notFound();

    const supabaseMatches = await getMatches();
    const supabasePlayers = await getPlayers();

    const matches = supabaseMatches || MOCK_MATCHES;
    const players = supabasePlayers || MOCK_PLAYERS;
    const isUsingMockData = !supabaseMatches;

    const upcomingMatches = [...matches]
        .filter(m => m.status !== 'finished')
        .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());

    const finishedMatches = [...matches]
        .filter(m => m.status === 'finished')
        .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

    const nextMatches = upcomingMatches.slice(0, 4);
    const recentResults = finishedMatches.slice(0, 4);
    const displayPlayers = players.slice(0, 5);

    return (
        <div className="space-y-12">
            {isUsingMockData && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div>
                        <p className="text-sm text-yellow-800 font-medium">モックデータを使用中</p>
                        <p className="text-xs text-yellow-600">Supabaseに接続できません。データベーステーブルを作成してください。</p>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-muted/50 border border-border p-8">
                <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
                    <div
                        className="w-full h-full rounded-full blur-3xl"
                        style={{
                            background: `linear-gradient(135deg, ${teamConfig.colors.primary} 50%, ${teamConfig.colors.secondary} 50%)`,
                        }}
                    />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1 space-y-4">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                            <span style={{ color: teamConfig.colors.accent }}>{teamConfig.name.toUpperCase()}</span>
                            <br />
                            <span>PIXEL HUB</span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-md">
                            {teamConfig.shortName}ファンのためのコミュニティ。
                            試合ごとに選手を採点し、みんなの声を集めよう。
                        </p>
                        <div className="flex flex-wrap gap-4 pt-2">
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4" style={{ color: teamConfig.colors.accent }} />
                                <span>{matches.length}試合</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Users className="w-4 h-4" style={{ color: teamConfig.colors.accent }} />
                                <span>{players.length}選手</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Star className="w-4 h-4" style={{ color: teamConfig.colors.accent }} />
                                <span>リアルタイム採点</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-end gap-2">
                        {displayPlayers.map((player, index) => (
                            <div
                                key={player.id}
                                className="transform transition-transform hover:scale-110 hover:-translate-y-2"
                                style={{ transform: `translateY(${Math.abs(index - 2) * 4}px)` }}
                            >
                                {player.pixel_config && (
                                    <PixelPlayer
                                        config={player.pixel_config as any}
                                        number={player.number}
                                        size={index === 2 ? 80 : 64}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Recent Results */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" style={{ color: teamConfig.colors.accent }} />
                        <h2 className="text-2xl font-bold">試合結果</h2>
                        <span className="text-sm text-muted-foreground">- 選手採点受付中</span>
                    </div>
                    {finishedMatches.length > 4 && (
                        <Link
                            href={`/${team_id}/matches?filter=finished`}
                            className="flex items-center gap-1 text-sm hover:underline"
                            style={{ color: teamConfig.colors.accent }}
                        >
                            過去の試合一覧
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    )}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {recentResults.map(match => (
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
                            isFinished={match.status === 'finished'}
                            competition={match.competition || 'League'}
                            isHome={match.is_home ?? true}
                        />
                    ))}
                </div>
            </section>

            {/* Upcoming Matches */}
            {nextMatches.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" style={{ color: teamConfig.colors.accent }} />
                            <h2 className="text-2xl font-bold">今後の試合</h2>
                        </div>
                        {upcomingMatches.length > 4 && (
                            <Link
                                href={`/${team_id}/matches?filter=upcoming`}
                                className="flex items-center gap-1 text-sm hover:underline"
                                style={{ color: teamConfig.colors.accent }}
                            >
                                すべて見る
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        )}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        {nextMatches.map(match => (
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
                                isFinished={match.status === 'finished'}
                                competition={match.competition || 'League'}
                                isHome={match.is_home ?? true}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
