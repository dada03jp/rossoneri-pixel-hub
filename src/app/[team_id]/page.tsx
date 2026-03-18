import { createClient } from '@/lib/supabase/server';
import { MatchCard } from '@/components/match-card';
import { PixelPlayer } from '@/components/pixel-player';
import { Calendar, Users, Star, TrendingUp, AlertCircle, ChevronRight, Clock } from 'lucide-react';
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

/**
 * 試合を3区分に相互排他的に振り分ける
 * - finished: status === 'finished'
 * - pending: status !== 'finished' かつ match_date < now（結果待ち）
 * - upcoming: status !== 'finished' かつ match_date >= now（今後の試合）
 */
function classifyMatch(match: { status: string; match_date: string }): 'finished' | 'pending' | 'upcoming' {
    if (match.status === 'finished') return 'finished';
    const matchTime = new Date(match.match_date).getTime();
    const now = Date.now();
    return matchTime < now ? 'pending' : 'upcoming';
}

/**
 * MatchCard用のstatus propを算出
 * DB statusを尊重しつつ、UI側で日時照合して破綻防止
 */
function getDisplayStatus(match: { status: string; match_date: string }): 'finished' | 'live' | 'upcoming' | 'pending' {
    if (match.status === 'finished') return 'finished';
    const matchTime = new Date(match.match_date).getTime();
    const now = Date.now();
    // 過去日時の未finished試合は常に「結果待ち」を優先（DB statusがliveでも）
    if (matchTime < now) return 'pending';
    // 未来日時でDB statusがliveの場合のみLIVE表示
    if (match.status === 'live') return 'live';
    return 'upcoming';
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

    // 3区分に相互排他的に振り分け
    const finishedMatches = [...matches]
        .filter(m => classifyMatch(m) === 'finished')
        .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

    const pendingMatches = [...matches]
        .filter(m => classifyMatch(m) === 'pending')
        .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

    const upcomingMatches = [...matches]
        .filter(m => classifyMatch(m) === 'upcoming')
        .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());

    const recentResults = finishedMatches.slice(0, 4);
    const nextMatches = upcomingMatches.slice(0, 4);
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
                {recentResults.length > 0 ? (
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
                                status={getDisplayStatus(match)}
                                competition={match.competition || 'League'}
                                isHome={match.is_home ?? true}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
                        <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-muted-foreground font-medium">まだ試合結果がありません</p>
                        <p className="text-sm text-muted-foreground/70 mt-1">試合が終了すると、ここに結果が表示されます</p>
                    </div>
                )}
            </section>

            {/* Pending Matches (結果待ち) */}
            {pendingMatches.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-500" />
                        <h2 className="text-2xl font-bold">結果待ち</h2>
                        <span className="text-sm text-muted-foreground">- キックオフ済み・結果反映待ち</span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        {pendingMatches.map(match => (
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
                                competition={match.competition || 'League'}
                                isHome={match.is_home ?? true}
                            />
                        ))}
                    </div>
                </section>
            )}

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
                                status={getDisplayStatus(match)}
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
