import { createClient } from '@/lib/supabase/server';
import { MatchCard } from '@/components/match-card';
import { Calendar, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { MOCK_MATCHES, MOCK_PLAYERS } from '@/lib/mock-data';
import { getTeamConfig } from '@/lib/team-config';
import { notFound } from 'next/navigation';

// Home components
import { HeroSection } from '@/components/home/hero-section';
import { NextMatchCard } from '@/components/home/next-match-card';
import { FeatureCards } from '@/components/home/feature-cards';
import { SectionHeader } from '@/components/home/section-header';

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
 * 試合を4区分に相互排他的に振り分ける
 * - finished: status === 'finished' かつ match_date <= now
 * - pending: status !== 'finished' かつ match_date < now（結果待ち）
 * - upcoming: status !== 'finished' かつ match_date >= now（今後の試合）
 * - anomaly: match_date > now かつ status === 'finished'（異常データ）
 *
 * anomaly は全セクションから除外される。
 * TODO: 将来的に管理画面のダッシュボードで異常データを一覧表示する
 */
function classifyMatch(match: { status: string; match_date: string; id?: string; opponent_name?: string }): 'finished' | 'pending' | 'upcoming' | 'anomaly' {
    const matchTime = new Date(match.match_date).getTime();
    const now = Date.now();

    if (match.status === 'finished') {
        if (matchTime > now) {
            console.warn(
                `[ANOMALY] Match id=${match.id ?? 'unknown'} opponent=${match.opponent_name ?? ''} match_date=${match.match_date} status=finished — future date with finished status. Excluded from all sections.`
            );
            return 'anomaly';
        }
        return 'finished';
    }
    return matchTime < now ? 'pending' : 'upcoming';
}

/**
 * MatchCard用のstatus propを算出
 * DB statusを尊重しつつ、UI側で日時照合して破綻防止
 */
function getDisplayStatus(match: { status: string; match_date: string }): 'finished' | 'live' | 'upcoming' | 'pending' {
    const matchTime = new Date(match.match_date).getTime();
    const now = Date.now();

    if (match.status === 'finished') {
        if (matchTime > now) return 'upcoming';
        return 'finished';
    }
    if (matchTime < now) return 'pending';
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

    // 4区分に相互排他的に振り分け（anomalyは自動除外）
    const finishedMatches = [...matches]
        .filter(m => classifyMatch(m) === 'finished')
        .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

    const pendingMatches = [...matches]
        .filter(m => classifyMatch(m) === 'pending')
        .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

    const upcomingMatches = [...matches]
        .filter(m => classifyMatch(m) === 'upcoming')
        .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());

    // LIVE試合の検出
    const liveMatches = [...matches]
        .filter(m => m.status === 'live' && new Date(m.match_date).getTime() > Date.now());

    const recentResults = finishedMatches.slice(0, 4);
    const nextMatch = upcomingMatches[0] || null;
    const remainingUpcoming = upcomingMatches.slice(1, 5);
    const displayPlayers = players.filter(p => p.pixel_config).slice(0, 5);

    // CTA用: 最新finished試合 or フォールバック先
    const latestFinished = finishedMatches[0];
    const primaryCtaHref = latestFinished
        ? `/${team_id}/matches/${latestFinished.id}`
        : `/${team_id}/matches`;

    const accent = teamConfig.colors.accent;

    return (
        <div className="space-y-12 md:space-y-16">
            {isUsingMockData && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-[12px] p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div>
                        <p className="text-sm text-yellow-800 font-medium">モックデータを使用中</p>
                        <p className="text-xs text-yellow-600">Supabaseに接続できません。</p>
                    </div>
                </div>
            )}

            {/* ===== Hero ===== */}
            <HeroSection
                teamName={teamConfig.name}
                teamShortName={teamConfig.shortName}
                accentColor={accent}
                primaryColor={teamConfig.colors.primary}
                primaryCtaHref={primaryCtaHref}
                secondaryCtaHref={`/${team_id}/matches`}
                displayPlayers={displayPlayers}
            />

            {/* ===== LIVE / NEXT MATCH ===== */}
            {liveMatches.length > 0 ? (
                liveMatches.map(match => (
                    <NextMatchCard
                        key={match.id}
                        match={match}
                        teamId={team_id}
                        teamName={teamConfig.name}
                        teamKit={teamConfig.kit}
                        status="live"
                        accentColor={accent}
                        isLive
                    />
                ))
            ) : nextMatch ? (
                <NextMatchCard
                    match={nextMatch}
                    teamId={team_id}
                    teamName={teamConfig.name}
                    teamKit={teamConfig.kit}
                    status={getDisplayStatus(nextMatch)}
                    accentColor={accent}
                />
            ) : null}

            {/* ===== Features ===== */}
            <FeatureCards accentColor={accent} />

            {/* ===== Recent Results ===== */}
            <section className="space-y-5">
                <SectionHeader
                    icon={Calendar}
                    accentColor={accent}
                    title="試合結果"
                    badge="採点受付中"
                    badgeColor={accent}
                    viewAllHref={finishedMatches.length > 4 ? `/${team_id}/matches?filter=finished` : undefined}
                />
                {recentResults.length > 0 ? (
                    <div className="grid gap-4 md:gap-5 md:grid-cols-2">
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
                                variant="premium"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-14 bg-muted/20 rounded-[14px] border border-black/[0.04]">
                        <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                        <p className="text-muted-foreground font-medium text-sm">まだ試合結果がありません</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">試合が終了すると、ここに結果が表示されます</p>
                    </div>
                )}
            </section>

            {/* ===== Pending ===== */}
            {pendingMatches.length > 0 && (
                <section className="space-y-5">
                    <SectionHeader
                        icon={Clock}
                        iconColor="#f97316"
                        title="結果待ち"
                        badge="キックオフ済み"
                        badgeColor="#f97316"
                    />
                    <div className="grid gap-4 md:gap-5 md:grid-cols-2">
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
                                variant="premium"
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* ===== Upcoming ===== */}
            {remainingUpcoming.length > 0 && (
                <section className="space-y-5">
                    <SectionHeader
                        icon={TrendingUp}
                        accentColor={accent}
                        title="今後の試合"
                        viewAllHref={upcomingMatches.length > 5 ? `/${team_id}/matches?filter=upcoming` : undefined}
                    />
                    <div className="grid gap-4 md:gap-5 md:grid-cols-2">
                        {remainingUpcoming.map(match => (
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
                                variant="premium"
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
