import { createClient } from '@/lib/supabase/server';
import { MatchCard } from '@/components/match-card';
import { PixelPlayer } from '@/components/pixel-player';
import { Calendar, Users, Star, TrendingUp, AlertCircle, ChevronRight, Clock, MessageSquare, Trophy, Zap } from 'lucide-react';
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
        // 異常データ保護: 未来日時の finished は upcoming 扱い
        if (matchTime > now) return 'upcoming';
        return 'finished';
    }
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
    const secondaryCtaHref = `/${team_id}/matches`;

    return (
        <div className="space-y-10">
            {isUsingMockData && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <div>
                        <p className="text-sm text-yellow-800 font-medium">モックデータを使用中</p>
                        <p className="text-xs text-yellow-600">Supabaseに接続できません。データベーステーブルを作成してください。</p>
                    </div>
                </div>
            )}

            {/* ===== Hero Section ===== */}
            <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-muted/30">
                {/* Background accent */}
                <div className="absolute top-0 right-0 w-80 h-80 opacity-[0.07]">
                    <div
                        className="w-full h-full rounded-full blur-3xl"
                        style={{
                            background: `radial-gradient(circle, ${teamConfig.colors.primary} 0%, ${teamConfig.colors.accent} 100%)`,
                        }}
                    />
                </div>
                <div className="absolute bottom-0 left-0 w-40 h-40 opacity-[0.05]">
                    <div
                        className="w-full h-full rounded-full blur-2xl"
                        style={{ backgroundColor: teamConfig.colors.accent }}
                    />
                </div>

                <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row items-center gap-8">
                    {/* Left: Copy + CTA */}
                    <div className="flex-1 space-y-5 text-center md:text-left">
                        <div className="space-y-2">
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                                <span style={{ color: teamConfig.colors.accent }}>{teamConfig.shortName.toUpperCase()}</span>
                                {' '}
                                <span className="text-foreground">PIXEL HUB</span>
                            </h1>
                            <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto md:mx-0">
                                試合後の感情を、採点で残そう。
                                <br className="hidden sm:block" />
                                {teamConfig.shortName}ファンのための選手採点コミュニティ。
                            </p>
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                            <Link
                                href={primaryCtaHref}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-semibold text-sm transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.98] shadow-md"
                                style={{ backgroundColor: teamConfig.colors.accent }}
                            >
                                <Star className="w-4 h-4" />
                                最新試合を採点する
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href={secondaryCtaHref}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                            >
                                <Calendar className="w-4 h-4" />
                                試合一覧を見る
                            </Link>
                        </div>
                    </div>

                    {/* Right: PixelPlayer decoration */}
                    <div className="flex items-end gap-1.5 md:gap-2">
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

            {/* ===== LIVE Match (if any) ===== */}
            {liveMatches.length > 0 && (
                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                        </span>
                        <h2 className="text-xl font-bold text-red-600">LIVE NOW</h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        {liveMatches.map(match => (
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
                                status="live"
                                competition={match.competition || 'League'}
                                isHome={match.is_home ?? true}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* ===== NEXT MATCH Highlight ===== */}
            {nextMatch && liveMatches.length === 0 && (
                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5" style={{ color: teamConfig.colors.accent }} />
                        <h2 className="text-xl font-bold">NEXT MATCH</h2>
                    </div>
                    <div
                        className="rounded-xl border-2 overflow-hidden transition-shadow hover:shadow-lg"
                        style={{ borderColor: `${teamConfig.colors.accent}30` }}
                    >
                        <MatchCard
                            id={nextMatch.id}
                            teamId={team_id}
                            teamName={teamConfig.name}
                            teamKit={teamConfig.kit}
                            opponentName={nextMatch.opponent_name}
                            matchDate={nextMatch.match_date}
                            homeScore={nextMatch.home_score}
                            awayScore={nextMatch.away_score}
                            status={getDisplayStatus(nextMatch)}
                            competition={nextMatch.competition || 'League'}
                            isHome={nextMatch.is_home ?? true}
                        />
                    </div>
                </section>
            )}

            {/* ===== Features Block: できること ===== */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-5 space-y-2 text-center">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto"
                        style={{ backgroundColor: `${teamConfig.colors.accent}15` }}
                    >
                        <Star className="w-5 h-5" style={{ color: teamConfig.colors.accent }} />
                    </div>
                    <h3 className="font-semibold text-sm">10点満点で選手採点</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        試合ごとに全選手をファン目線で評価。あなたの採点が反映されます。
                    </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5 space-y-2 text-center">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto"
                        style={{ backgroundColor: `${teamConfig.colors.accent}15` }}
                    >
                        <MessageSquare className="w-5 h-5" style={{ color: teamConfig.colors.accent }} />
                    </div>
                    <h3 className="font-semibold text-sm">コメントで感想を残せる</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        選手ごとに感想や意見をシェア。試合の振り返りがもっと楽しくなります。
                    </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5 space-y-2 text-center">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto"
                        style={{ backgroundColor: `${teamConfig.colors.accent}15` }}
                    >
                        <Trophy className="w-5 h-5" style={{ color: teamConfig.colors.accent }} />
                    </div>
                    <h3 className="font-semibold text-sm">みんなの採点でMVPが見える</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        ファンの投票結果から、その試合のMVPが分かります。
                    </p>
                </div>
            </section>

            {/* ===== Recent Results ===== */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" style={{ color: teamConfig.colors.accent }} />
                        <h2 className="text-xl font-bold">試合結果</h2>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">採点受付中</span>
                    </div>
                    {finishedMatches.length > 4 && (
                        <Link
                            href={`/${team_id}/matches?filter=finished`}
                            className="flex items-center gap-1 text-sm hover:underline"
                            style={{ color: teamConfig.colors.accent }}
                        >
                            すべて見る
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
                    <div className="text-center py-12 bg-muted/30 rounded-xl border border-border">
                        <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                        <p className="text-muted-foreground font-medium text-sm">まだ試合結果がありません</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">試合が終了すると、ここに結果が表示されます</p>
                    </div>
                )}
            </section>

            {/* ===== Pending Matches ===== */}
            {pendingMatches.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-orange-500" />
                        <h2 className="text-xl font-bold">結果待ち</h2>
                        <span className="text-xs text-muted-foreground bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">キックオフ済み</span>
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

            {/* ===== Upcoming Matches (remaining) ===== */}
            {remainingUpcoming.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" style={{ color: teamConfig.colors.accent }} />
                            <h2 className="text-xl font-bold">今後の試合</h2>
                        </div>
                        {upcomingMatches.length > 5 && (
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
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
