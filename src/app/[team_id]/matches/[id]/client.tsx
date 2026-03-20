'use client';

import { BackHeader } from '@/components/header';
import { PixelConfig } from '@/components/pixel-player';
import { TopRatedBanner } from '@/components/ranking-card';
import { RankingCard } from '@/components/ranking-card';
import { MatchHero } from '@/components/match/match-hero';
import { FormationPitch, PitchPlayer } from '@/components/match/formation-pitch';
import { PlayerRatingSheet } from '@/components/match/player-rating-sheet';
import { SubstituteChips } from '@/components/match/substitute-chips';
import { SectionHeader } from '@/components/home/section-header';
import { AlertCircle, LogIn, Wifi, WifiOff, Users, ArrowRight, Star } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Match, Player, MatchEvent, MatchLineup } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRealtimeRatings } from '@/hooks/use-realtime-ratings';
import { LoginModal } from '@/components/auth/login-modal';
import { useTeam } from '@/contexts/team-context';
import { RatingShareCard } from '@/components/rating-share-card';
import { PixelToastContainer } from '@/components/pixel-effects';
import Link from 'next/link';

// ── Types ──

interface NearbyMatch {
    id: string;
    opponent_name: string;
    match_date: string;
    status: string;
    home_score: number | null;
    away_score: number | null;
    is_home: boolean;
    competition: string;
}

interface MatchDetailClientProps {
    match: Match;
    players: (Player & { pixel_config: PixelConfig; is_starter?: boolean })[];
    ratings: Record<string, { average: number; count: number }>;
    isUsingMockData: boolean;
    events: MatchEvent[];
    lineups: MatchLineup[];
    nearbyMatches: NearbyMatch[];
}

// ── Component ──

export function MatchDetailClient({
    match,
    players: initialPlayers,
    ratings: initialRatings,
    isUsingMockData,
    events,
    lineups,
    nearbyMatches,
}: MatchDetailClientProps) {
    // Dedup players
    const players = Array.from(new Map(initialPlayers.map(p => [p.name || p.id, p])).values());

    // Realtime ratings
    const { ratings, comments, isConnected, optimisticSubmit, getUserRatings } = useRealtimeRatings({
        matchId: match.id,
        initialRatings,
    });

    const [userRatings, setUserRatings] = useState<Record<string, { score: number; comment: string }>>({});
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    // ★ CTA source of truth: auth確認 + DB fetch完了フラグ
    const [authLoaded, setAuthLoaded] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [showShareCard, setShowShareCard] = useState(false);
    const [ratingViewMode, setRatingViewMode] = useState<'mine' | 'all'>('mine');

    const { team: teamConfig } = useTeam();

    // Auth + existing ratings
    useEffect(() => {
        const supabase = createClient();

        // ★ ユーザーのratingsを取得してauthLoadedを設定する共通関数
        const fetchUserRatings = async (currentUser: User | null) => {
            if (currentUser) {
                try {
                    const { data } = await supabase.from('ratings').select('*')
                        .eq('user_id', currentUser.id).eq('match_id', match.id);
                    if (data) {
                        const existing: Record<string, { score: number; comment: string }> = {};
                        data.forEach((r: any) => {
                            existing[r.player_id] = { score: r.score, comment: r.comment || '' };
                        });
                        setUserRatings(existing);
                    } else {
                        setUserRatings({});
                    }
                } catch {
                    setUserRatings({});
                }
            } else {
                setUserRatings({});
            }
            setAuthLoaded(true);
        };

        // 初回: authチェック + ratings fetch
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            setLoading(false);
            fetchUserRatings(user);
        });

        // ★ ログイン/ログアウト時にも再fetch
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const newUser = session?.user ?? null;
            setUser(newUser);
            setAuthLoaded(false); // 一旦非表示にして再fetchを待つ
            fetchUserRatings(newUser);
        });
        return () => subscription.unsubscribe();
    }, [match.id]);

    // Separate starters / substitutes
    const { starters, substitutes } = useMemo(() => {
        const seen = new Set<string>();
        const starterList: typeof players = [];
        const subList: typeof players = [];
        players.forEach(p => {
            if (seen.has(p.id)) return;
            seen.add(p.id);
            if (p.is_starter === true) starterList.push(p);
            else subList.push(p);
        });
        return { starters: starterList, substitutes: subList };
    }, [players]);

    // Build PitchPlayer array from lineups
    const pitchPlayers: PitchPlayer[] = useMemo(() => {
        const lineupStarters = lineups.filter(l => l.is_starter);
        const seenIds = new Set<string>();

        if (lineupStarters.length > 0) {
            return lineupStarters.filter(lu => {
                if (!lu.player_id || seenIds.has(lu.player_id)) return false;
                seenIds.add(lu.player_id);
                return true;
            }).map(lu => {
                const p = players.find(pl => pl.id === lu.player_id);
                return {
                    id: lu.player_id || '',
                    name: lu.player_name || p?.name || '',
                    number: lu.jersey_number || p?.number || 0,
                    pixel_config: p?.pixel_config,
                    role: lu.role || lu.position_role || p?.position || 'MF',
                    side: lu.position_side || 'Center',
                    positionRow: lu.position_row || undefined,
                    positionCol: lu.position_col || undefined,
                };
            });
        }

        return starters.map(player => ({
            id: player.id,
            name: player.name,
            number: player.number,
            pixel_config: player.pixel_config,
            role: player.position || 'MF',
            side: 'Center',
        }));
    }, [lineups, players, starters]);

    // All players list for sequential nav (starters + subs)
    const allPlayersForNav = useMemo(() => {
        const starterPlayers = pitchPlayers.map(pp => {
            const p = players.find(pl => pl.id === pp.id);
            return {
                id: pp.id,
                name: pp.name,
                number: pp.number,
                position: p?.position || 'MF',
                pixel_config: pp.pixel_config,
            };
        });
        const subPlayers = substitutes.map(p => ({
            id: p.id,
            name: p.name,
            number: p.number,
            position: p.position || 'MF',
            pixel_config: p.pixel_config,
        }));
        return [...starterPlayers, ...subPlayers];
    }, [pitchPlayers, substitutes, players]);

    // MVP
    const mvpPlayerId = useMemo(() => {
        const myRatings = user ? getUserRatings(user.id) : {};
        const entries = pitchPlayers.map(p => {
            const score = ratingViewMode === 'all'
                ? (ratings[p.id]?.average ?? null)
                : (myRatings[p.id] ?? null);
            return { id: p.id, score };
        }).filter(r => r.score !== null);
        if (entries.length === 0) return null;
        return entries.reduce((best, cur) => (cur.score! > best.score! ? cur : best)).id;
    }, [pitchPlayers, ratings, ratingViewMode, user, getUserRatings]);

    // User scores flat map — merge realtime store + local optimistic state
    const userScoresMap = useMemo(() => {
        if (!user) return {};
        const fromStore = getUserRatings(user.id);
        // ★ FIX #4: Merge local userRatings (from submit) into map too
        const merged = { ...fromStore };
        for (const [playerId, rating] of Object.entries(userRatings)) {
            merged[playerId] = rating.score;
        }
        return merged;
    }, [user, getUserRatings, userRatings]);

    // Match average
    const matchAverageRating = useMemo(() => {
        const vals = Object.values(ratings);
        if (vals.length === 0) return null;
        return vals.reduce((acc, r) => acc + r.average, 0) / vals.length;
    }, [ratings]);

    // Submit handler
    const handleSubmitRating = async (playerId: string, score: number, comment: string) => {
        if (!user) {
            setIsLoginModalOpen(true);
            return;
        }
        const tempId = crypto.randomUUID();
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'ファン';
        optimisticSubmit(tempId, playerId, score, comment, userName, user.id);

        const supabase = createClient();

        // ★ 採点: ratings テーブル (score のみ、comment は分離)
        const { data: ratingData, error } = await supabase.from('ratings').upsert({
            user_id: user.id,
            match_id: match.id,
            player_id: playerId,
            score,
            user_name: userName,
        } as Record<string, unknown>, { onConflict: 'user_id,match_id,player_id' }).select('id').single();

        if (error || !ratingData) {
            console.error('Error submitting rating:', error);
            alert('採点の保存に失敗しました');
            return;
        }

        // ★ コメント: rating_comments テーブルに分離書き込み
        if (comment && comment.trim()) {
            // 既存 root comment があれば update、なければ insert
            const { data: existingComment } = await supabase
                .from('rating_comments')
                .select('id')
                .eq('rating_id', ratingData.id)
                .is('parent_comment_id', null)
                .maybeSingle();

            if (existingComment) {
                await supabase.from('rating_comments').update({
                    comment: comment.trim(),
                    user_name: userName,
                    is_deleted: false,
                    is_edited: true,
                    edited_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }).eq('id', existingComment.id);
            } else {
                await supabase.from('rating_comments').insert({
                    rating_id: ratingData.id,
                    user_id: user.id,
                    user_name: userName,
                    comment: comment.trim(),
                });
            }
        }

        setUserRatings(prev => ({ ...prev, [playerId]: { score, comment } }));
    };

    // Nearby matches — 採点可能(finished)のみ表示
    const sortedNearbyMatches = useMemo(() => {
        return nearbyMatches
            .filter(m => m.status === 'finished')
            .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())
            .slice(0, 4);
    }, [nearbyMatches]);

    // Selected player info for sheet
    const selectedPlayer = selectedPlayerId
        ? allPlayersForNav.find(p => p.id === selectedPlayerId) || null
        : null;

    return (
        <div className="-mt-8 -mx-4">
            <PixelToastContainer />
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

            {/* Player Rating Card — centered modal */}
            <PlayerRatingSheet
                isOpen={!!selectedPlayerId && match.status === 'finished'}
                onClose={() => setSelectedPlayerId(null)}
                player={selectedPlayer}
                matchId={match.id}
                allPlayers={allPlayersForNav}
                user={user}
                onAuthAction={() => setIsLoginModalOpen(true)}
                onSubmitRating={handleSubmitRating}
                existingRating={selectedPlayerId ? userRatings[selectedPlayerId] : null}
                averageRating={selectedPlayerId ? (ratings[selectedPlayerId]?.average ?? null) : null}
                totalRatings={selectedPlayerId ? (ratings[selectedPlayerId]?.count ?? 0) : 0}
                onNavigate={(id) => setSelectedPlayerId(id)}
                isHome={match.is_home ?? true}
            />

            {/* Header */}
            <BackHeader
                title={`${teamConfig.name} vs ${match.opponent_name}`}
                subtitle={match.competition || undefined}
            />

            <div className="container mx-auto px-4 py-6 space-y-10 md:space-y-12">
                {/* Realtime indicator */}
                {match.status === 'finished' && !isUsingMockData && (
                    <div className={`flex items-center gap-2 text-xs ${isConnected ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                        {isConnected
                            ? <><Wifi className="w-3.5 h-3.5" /><span>リアルタイム更新中</span></>
                            : <><WifiOff className="w-3.5 h-3.5" /><span>接続中...</span></>
                        }
                    </div>
                )}

                {/* Mock data banner */}
                {isUsingMockData && (
                    <div className="bg-amber-50 border border-amber-200/50 rounded-[14px] p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <div>
                            <p className="text-sm text-amber-800 font-medium">モックデータを使用中</p>
                            <p className="text-xs text-amber-600">Supabaseに接続できません。</p>
                        </div>
                    </div>
                )}

                {/* ── 1. Match Hero ── */}
                <MatchHero
                    match={match}
                    events={events}
                    matchAverageRating={matchAverageRating}
                    userRatingsCount={Object.keys(userRatings).length}
                    onShareCard={() => setShowShareCard(true)}
                />

                {/* ── 2. Rating section (only for finished matches) ── */}
                {match.status === 'finished' ? (
                    <div className="space-y-10 md:space-y-12">
                        {/* Login prompt */}
                        {!loading && !user && (
                            <button
                                onClick={() => setIsLoginModalOpen(true)}
                                className="w-full flex items-center justify-between bg-white border border-black/[0.06] rounded-[14px] p-4 hover:bg-black/[0.01] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <LogIn className="w-5 h-5 text-muted-foreground" />
                                    <div className="text-left">
                                        <p className="text-sm font-medium">ログインして採点に参加</p>
                                        <p className="text-xs text-muted-foreground">Googleアカウントで簡単ログイン</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            </button>
                        )}

                        {/* View mode toggle */}
                        <div className="flex items-center justify-between">
                            <SectionHeader
                                icon={Users}
                                title="選手採点"
                                accentColor={teamConfig.colors.accent}
                            />
                            <div className="flex bg-black/[0.03] rounded-[10px] p-0.5 text-xs">
                                <button
                                    onClick={() => setRatingViewMode('mine')}
                                    className={`px-3 py-1.5 rounded-[8px] font-medium transition-all ${
                                        ratingViewMode === 'mine'
                                            ? 'bg-white shadow-sm text-foreground'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    あなたの評価
                                </button>
                                <button
                                    onClick={() => setRatingViewMode('all')}
                                    className={`px-3 py-1.5 rounded-[8px] font-medium transition-all ${
                                        ratingViewMode === 'all'
                                            ? 'bg-white shadow-sm text-foreground'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    みんなの評価
                                </button>
                            </div>
                        </div>

                        {/* ── 3. Formation Pitch (main) ── */}
                        <div className="relative z-0">
                            {/* ★ CTA: authLoaded + userRatings が source of truth
                                - authLoaded=false → 非表示
                                - match未完了 → 非表示
                                - ログイン済+採点済 → 非表示
                                - それ以外 → CTA表示
                            */}
                            {(() => {
                                if (!authLoaded) return null;
                                if (match.status !== 'finished') return null;
                                if (user && Object.keys(userRatings).length > 0) return null;
                                return (
                                    <div className="text-center mb-3 py-2 px-4 bg-emerald-50 border border-emerald-200/50 rounded-[12px]">
                                        <p className="text-sm font-medium text-emerald-700 flex items-center justify-center gap-2">
                                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            {user ? '選手をタップして採点を始めよう' : 'ログインして選手を採点しよう'}
                                        </p>
                                    </div>
                                );
                            })()}
                            <p className="text-xs text-muted-foreground mb-2 text-center">
                                {match.formation ? `フォーメーション ${match.formation}` : 'フォーメーション'}
                            </p>
                            <div className="overflow-clip rounded-[16px]">
                                <FormationPitch
                                    players={pitchPlayers}
                                    formation={match.formation || '4-3-3'}
                                    ratings={ratings}
                                    userRatings={userScoresMap}
                                    viewMode={ratingViewMode}
                                    mvpPlayerId={mvpPlayerId}
                                    selectedPlayerId={selectedPlayerId}
                                    isHome={match.is_home ?? true}
                                    onPlayerSelect={(id) => setSelectedPlayerId(id)}
                                />
                            </div>
                        </div>

                        {/* ── 4. Substitute Chips ── */}
                        {substitutes.length > 0 && (
                            <div>
                                <SectionHeader
                                    icon={Users}
                                    title="途中交代"
                                    badge={`${substitutes.length}人`}
                                    accentColor={teamConfig.colors.accent}
                                />
                                <div className="mt-3">
                                    <SubstituteChips
                                        players={substitutes.map(p => ({
                                            id: p.id,
                                            name: p.name,
                                            number: p.number,
                                            position: p.position || 'MF',
                                            pixel_config: p.pixel_config,
                                        }))}
                                        ratings={ratings}
                                        userRatings={userScoresMap}
                                        viewMode={ratingViewMode}
                                        isHome={match.is_home ?? true}
                                        onPlayerSelect={(id) => setSelectedPlayerId(id)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* ── 5. MVP Banner ── */}
                        {Object.keys(ratings).length > 0 && (
                            <TopRatedBanner
                                players={players}
                                ratings={ratings}
                                isHome={match.is_home ?? true}
                                topComment={(() => {
                                    let bestPlayer: Player | null = null;
                                    let bestRating = -1;
                                    players.forEach(p => {
                                        const r = ratings[p.id];
                                        if (r && r.average > bestRating) { bestRating = r.average; bestPlayer = p; }
                                    });
                                    if (!bestPlayer) return null;
                                    const bp = bestPlayer as Player;
                                    const playerComments = comments[bp.id] || [];
                                    if (playerComments.length === 0) return null;
                                    const sorted = [...playerComments].sort((a, b) => b.likesCount - a.likesCount || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                                    const top = sorted[0];
                                    return { userName: top.userName, comment: top.comment, score: top.score };
                                })()}
                                onShowComments={() => {
                                    let bestPlayerId = '';
                                    let bestRating = -1;
                                    players.forEach(p => {
                                        const r = ratings[p.id];
                                        if (r && r.average > bestRating) { bestRating = r.average; bestPlayerId = p.id; }
                                    });
                                    if (bestPlayerId) setSelectedPlayerId(bestPlayerId);
                                }}
                                totalComments={(() => {
                                    let bestPlayerId = '';
                                    let bestRating = -1;
                                    players.forEach(p => {
                                        const r = ratings[p.id];
                                        if (r && r.average > bestRating) { bestRating = r.average; bestPlayerId = p.id; }
                                    });
                                    return bestPlayerId ? (comments[bestPlayerId]?.length || 0) : 0;
                                })()}
                            />
                        )}

                        {/* ── 6. Ranking ── */}
                        {Object.keys(ratings).length > 0 && (
                            <RankingCard title="今試合の評価ランキング" players={players} ratings={ratings} limit={5} isHome={match.is_home ?? true} />
                        )}
                    </div>
                ) : (
                    <div className="bg-black/[0.02] rounded-[16px] p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-bold mb-2">試合終了後に採点できます</h3>
                        <p className="text-sm text-muted-foreground">
                            この試合はまだ行われていません。試合終了後に選手の採点が可能になります。
                        </p>
                    </div>
                )}

                {/* ── 7. Recirculation — nearby matches ── */}
                {sortedNearbyMatches.length > 0 && (
                    <div>
                        <SectionHeader
                            icon={Star}
                            title="他の試合も採点してみる？"
                            accentColor={teamConfig.colors.accent}
                        />
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {sortedNearbyMatches.slice(0, 4).map(m => {
                                const isFinished = m.status === 'finished';
                                const dateStr = new Date(m.match_date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
                                const opponentName = m.opponent_name;
                                return (
                                    <Link
                                        key={m.id}
                                        href={`/${teamConfig.id}/matches/${m.id}`}
                                        className="group relative bg-white border border-black/[0.06] rounded-[14px] p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg overflow-hidden"
                                    >
                                        {/* Accent stripe */}
                                        <div
                                            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[14px]"
                                            style={{ backgroundColor: isFinished ? teamConfig.colors.accent : '#e5e5e5' }}
                                        />
                                        <div className="pl-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold truncate">vs {opponentName}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[11px] text-muted-foreground">{dateStr}</span>
                                                        <span className="text-[11px] text-muted-foreground">{m.competition}</span>
                                                    </div>
                                                </div>
                                                {isFinished && m.home_score !== null ? (
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-lg font-bold tabular-nums leading-none">{m.home_score} - {m.away_score}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-muted-foreground bg-black/[0.03] px-2 py-0.5 rounded-full flex-shrink-0">予定</span>
                                                )}
                                            </div>
                                            {isFinished && (
                                                <div className="mt-2 flex items-center gap-1">
                                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20 transition-colors">
                                                        採点する →
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Share Card Modal */}
            <RatingShareCard
                show={showShareCard}
                onClose={() => setShowShareCard(false)}
                matchTitle={`${teamConfig.name} vs ${match.opponent_name}`}
                matchDate={match.match_date}
                competition={match.competition || 'Match'}
                resultText={match.home_score !== null && match.away_score !== null
                    ? `${match.home_score} - ${match.away_score}` : 'vs'}
                playerRatings={Object.entries(userRatings).map(([pid, r]) => {
                    const p = players.find(pl => pl.id === pid);
                    return { name: p?.name || 'Unknown', number: p?.number || 0, position: p?.position || 'MF', score: r.score };
                }).sort((a, b) => b.score - a.score)}
                formation={match.formation || '4-3-3'}
                userName={user?.user_metadata?.username || user?.email?.split('@')[0] || 'ミラニスタ'}
                formationPlayers={(() => {
                    const lineupStarters = lineups.filter(l => l.is_starter);
                    if (lineupStarters.length === 0) return undefined;
                    const roleToRow: Record<string, number> = { GK: 1, CB: 2, DF: 2, WB: 3, DM: 3, CM: 4, MF: 4, AM: 4, ST: 5, FW: 5 };
                    const rowYMap: Record<number, number> = { 1: 90, 2: 74, 3: 56, 4: 38, 5: 18 };
                    const colXMap: Record<number, number> = { 1: 12, 2: 30, 3: 50, 4: 70, 5: 88 };
                    const seenIds = new Set<string>();
                    const startersFiltered = lineupStarters.filter(lu => {
                        if (!lu.player_id || seenIds.has(lu.player_id)) return false;
                        seenIds.add(lu.player_id);
                        return true;
                    });
                    const pitchData = startersFiltered.map(lu => ({
                        id: lu.player_id || '',
                        __role: lu.role || lu.position_role || 'MF',
                        __side: lu.position_side || 'Center',
                        __positionRow: lu.position_row,
                        __positionCol: lu.position_col,
                    }));
                    return startersFiltered.map(lu => {
                        const p = players.find(pl => pl.id === lu.player_id);
                        const row = lu.position_row || roleToRow[lu.role || lu.position_role || 'MF'] || 3;
                        const y = rowYMap[row] ?? 50;
                        let x: number;
                        if (lu.position_col && lu.position_col >= 1 && lu.position_col <= 5) {
                            x = colXMap[lu.position_col];
                        } else {
                            const sideXMap: Record<string, number> = { FarLeft: 10, Left: 28, Center: 50, Right: 72, FarRight: 90 };
                            if (lu.position_side && sideXMap[lu.position_side] !== undefined) {
                                x = sideXMap[lu.position_side];
                            } else {
                                const centersInRow = pitchData.filter(pd => {
                                    const pRow = pd.__positionRow || roleToRow[pd.__role] || 3;
                                    return pRow === row && (!pd.__side || pd.__side === 'Center');
                                });
                                const idx = centersInRow.findIndex(pd => pd.id === lu.player_id);
                                const count = Math.max(centersInRow.length, 1);
                                if (count === 1) { x = 50; }
                                else {
                                    const spacing = Math.min(20, 80 / Math.max(count - 1, 1));
                                    x = 50 - (spacing * (count - 1)) / 2 + idx * spacing;
                                }
                            }
                        }
                        const myScore = userRatings[lu.player_id || ''];
                        return {
                            id: lu.player_id || '',
                            name: lu.player_name || p?.name || '',
                            number: lu.jersey_number || p?.number || 0,
                            score: myScore ? myScore.score : null,
                            x, y,
                            pixel_config: p?.pixel_config || null,
                        };
                    });
                })()}
            />
        </div>
    );
}
