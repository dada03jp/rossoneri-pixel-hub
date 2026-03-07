'use client';

import { BackHeader } from '@/components/header';
import { MatchRatingCard } from '@/components/players/MatchRatingCard';
import { PixelPlayer, PixelConfig } from '@/components/pixel-player';
import { RankingCard, TopRatedBanner } from '@/components/ranking-card';
import { PlayerCommentModal } from '@/components/PlayerCommentModal';
import { EventTimeline } from '@/components/event-timeline';
import { Calendar, Trophy, Users, Star, AlertCircle, LogIn, Wifi, WifiOff, Share2 } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Match, Player, MatchEvent, MatchLineup } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { getTeamColors } from '@/lib/team-colors';
import { User } from '@supabase/supabase-js';
import { useRealtimeRatings } from '@/hooks/use-realtime-ratings';
import { LoginModal } from '@/components/auth/login-modal';
import { useTeam } from '@/contexts/team-context';
import { RatingShareCard } from '@/components/rating-share-card';

interface MatchDetailClientProps {
    match: Match;
    players: (Player & { pixel_config: PixelConfig; is_starter?: boolean })[];
    ratings: Record<string, { average: number; count: number }>;
    isUsingMockData: boolean;
    events: MatchEvent[];
    lineups: MatchLineup[];
}

/** フォーメーション図上の選手表現 */
interface PitchPlayer {
    id: string;
    name: string;
    number: number;
    pixel_config?: PixelConfig | null;
    __role: string;
    __side: string;
    __positionRow?: number;
}

// フォーメーション座標計算ヘルパー（position_row + role + side 対応）
function getFormationPosition(
    role: string,
    side: string,
    formation: string,
    allStarters: PitchPlayer[],
    playerId: string,
    positionRow?: number
): { x: number; y: number } {
    // --- Y座標: position_row があればそれを使う、なければ role から推定 ---
    const rowYMap: Record<number, number> = {
        1: 90,  // GK
        2: 74,  // DF (CB, WB at DF row)
        3: 56,  // DM / WB (3-5-2 style)
        4: 38,  // CM / AM
        5: 18,  // FW / ST
    };
    const roleToRow: Record<string, number> = {
        GK: 1, CB: 2, DF: 2, WB: 3, DM: 3, CM: 4, MF: 4, AM: 4, ST: 5, FW: 5,
    };
    const effectiveRow = positionRow || roleToRow[role] || 3;
    const y = rowYMap[effectiveRow] ?? 50;

    // --- X座標: side ベース + 同 row 内での分散 ---
    // 同じ row の選手を抽出
    const sameRow = allStarters.filter(p => {
        const pRow = p.__positionRow || roleToRow[p.__role] || 3;
        return pRow === effectiveRow;
    });

    // Left/Right は固定位置（row に応じた微調整で WB と SB の重なりを回避）
    if (side === 'Left') {
        const xOffset = effectiveRow === 3 ? 12 : effectiveRow === 2 ? 16 : 20;
        return { x: xOffset, y };
    }
    if (side === 'Right') {
        const xOffset = effectiveRow === 3 ? 88 : effectiveRow === 2 ? 84 : 80;
        return { x: xOffset, y };
    }

    // Center: 同 row・同 side の選手をカウントして等間隔に配置
    const centersInRow = sameRow.filter(p => {
        const pSide = p.__side || 'Center';
        return pSide === 'Center';
    });
    const idx = centersInRow.findIndex(p => p.id === playerId);
    const count = Math.max(centersInRow.length, 1);
    if (count === 1) return { x: 50, y };
    // 動的スペーシング: 2人なら広め、3人以上なら詰める
    const maxSpread = count <= 2 ? 30 : 24;
    const startX = 50 - ((count - 1) * maxSpread) / 2;
    return { x: startX + idx * maxSpread, y };
}

export function MatchDetailClient({
    match,
    players: initialPlayers,
    ratings: initialRatings,
    isUsingMockData,
    events,
    lineups
}: MatchDetailClientProps) {
    // DB側に同名の別UUIDレコードが存在するケースを考慮し、nameで重複を完全排除
    const players = Array.from(new Map(initialPlayers.map(p => [p.name || p.id, p])).values());
    // リアルタイム採点更新
    const { ratings, comments, isConnected, optimisticSubmit } = useRealtimeRatings({
        matchId: match.id,
        initialRatings
    });
    const [userRatings, setUserRatings] = useState<Record<string, { score: number; comment: string }>>({});
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [showShareCard, setShowShareCard] = useState(false);

    // チーム情報
    const { team: teamConfig } = useTeam();

    // Get current user and their existing ratings
    useEffect(() => {
        const supabase = createClient();

        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            setLoading(false);

            // If logged in, fetch their existing ratings for this match
            if (user) {
                supabase
                    .from('ratings')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('match_id', match.id)
                    .then(({ data }) => {
                        if (data) {
                            const existingRatings: Record<string, { score: number; comment: string }> = {};
                            data.forEach((r: any) => {
                                existingRatings[r.player_id] = {
                                    score: r.score,
                                    comment: r.comment || ''
                                };
                            });
                            setUserRatings(existingRatings);
                        }
                    });
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => subscription.unsubscribe();
    }, [match.id]);

    // Separate starters and substitutes
    const { starters, substitutes } = useMemo(() => {
        // player.id ベースで重複排除
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

    // Group players by position for starters only
    const playersByPosition = useMemo(() => {
        const groups: Record<string, typeof players> = {
            GK: [],
            DF: [],
            MF: [],
            FW: [],
        };

        starters.forEach(player => {
            const pos = player.position || 'MF';
            if (groups[pos]) {
                groups[pos].push(player);
            }
        });

        return groups;
    }, [starters]);

    const handleSubmitRating = async (playerId: string, score: number, comment: string) => {
        if (!user) {
            setIsLoginModalOpen(true);
            return;
        }

        // 楽観的更新: UIを即時反映
        const tempId = crypto.randomUUID();
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'ファン';
        optimisticSubmit(tempId, playerId, score, comment, userName, user.id);

        const supabase = createClient();

        const { error } = await supabase
            .from('ratings')
            .upsert({
                user_id: user.id,
                match_id: match.id,
                player_id: playerId,
                score,
                comment: comment || null,
                user_name: userName,
            } as Record<string, unknown>, {
                onConflict: 'user_id,match_id,player_id'
            });

        if (error) {
            console.error('Error submitting rating:', error);
            alert('採点の保存に失敗しました');
            return;
        }

        setUserRatings(prev => ({
            ...prev,
            [playerId]: { score, comment }
        }));
    };

    const handleSignIn = async () => {
        setIsLoginModalOpen(true);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getResultBadge = () => {
        if (match.status !== 'finished' || match.home_score === null || match.away_score === null) {
            return null;
        }

        const isWin = match.home_score > match.away_score;
        const isDraw = match.home_score === match.away_score;

        if (isWin) {
            return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">勝利</span>;
        }
        if (isDraw) {
            return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">引き分け</span>;
        }
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">敗北</span>;
    };

    // Calculate average of all ratings
    const matchAverageRating = useMemo(() => {
        const ratingValues = Object.values(ratings);
        if (ratingValues.length === 0) return null;
        const sum = ratingValues.reduce((acc, r) => acc + r.average, 0);
        return sum / ratingValues.length;
    }, [ratings]);

    return (
        <div className="-mt-8 -mx-4">
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
            />
            {/* Player Comment Modal */}
            {selectedPlayerId && (() => {
                const player = players.find(p => p.id === selectedPlayerId);
                if (!player) return null;
                const playerRating = ratings[selectedPlayerId];
                return (
                    <PlayerCommentModal
                        isOpen={true}
                        onClose={() => setSelectedPlayerId(null)}
                        playerId={selectedPlayerId}
                        matchId={match.id}
                        playerName={player.name}
                        playerNumber={player.number}
                        playerPosition={player.position || 'MF'}
                        pixelConfig={player.pixel_config}
                        averageRating={playerRating?.average || null}
                        totalRatings={playerRating?.count || 0}
                        user={user}
                        onAuthAction={handleSignIn}
                    />
                );
            })()}
            {/* Custom Header for this page */}
            <BackHeader
                title={`${teamConfig.name} vs ${match.opponent_name}`}
                subtitle={match.competition || undefined}
            />

            <div className="container mx-auto px-4 py-8 space-y-8">
                {/* Realtime Connection Indicator */}
                {match.status === 'finished' && !isUsingMockData && (
                    <div className={`flex items-center gap-2 text-xs ${isConnected ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {isConnected ? (
                            <>
                                <Wifi className="w-4 h-4" />
                                <span>リアルタイム更新中</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-4 h-4" />
                                <span>接続中...</span>
                            </>
                        )}
                    </div>
                )}

                {/* Debug Banner */}
                {isUsingMockData && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        <div>
                            <p className="text-sm text-yellow-800 font-medium">
                                モックデータを使用中
                            </p>
                            <p className="text-xs text-yellow-600">
                                Supabaseに接続できません。データベーステーブルを作成してください。
                            </p>
                        </div>
                    </div>
                )}

                {/* MVP Banner - show only for finished matches with ratings */}
                {match.status === 'finished' && Object.keys(ratings).length > 0 && (
                    <TopRatedBanner players={players} ratings={ratings} />
                )}

                {/* Match Summary Card - Home team always on left, Away on right */}
                <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-6 md:p-8 text-white">
                    {/* Competition and Date Header */}
                    <div className="text-center mb-4">
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                            <Trophy className="w-4 h-4" />
                            <span>{match.competition}</span>
                        </div>
                        <div className="text-sm text-slate-400 mt-1">
                            {formatDate(match.match_date)}
                        </div>
                    </div>

                    {/* Teams and Score */}
                    <div className="flex items-center justify-center gap-4 md:gap-8">
                        {/* Home Team (Left Side) */}
                        <div className="flex-1 flex flex-col items-center text-center">
                            {match.is_home ? (
                                <>
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full shadow-lg mb-2 overflow-hidden flex">
                                        <div className="w-1/2 h-full" style={{ backgroundColor: teamConfig.colors.primary }} />
                                        <div className="w-1/2 h-full" style={{ backgroundColor: teamConfig.colors.secondary }} />
                                    </div>
                                    <p className="text-lg md:text-xl font-bold">{teamConfig.name}</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden flex shadow-lg mb-2">
                                        <div className="w-1/2 h-full" style={{ backgroundColor: getTeamColors(match.opponent_name).primary }} />
                                        <div className="w-1/2 h-full" style={{ backgroundColor: getTeamColors(match.opponent_name).secondary }} />
                                    </div>
                                    <p className="text-lg md:text-xl font-bold">{match.opponent_name}</p>
                                </>
                            )}
                            {/* Home Team Events (Goals & Cards) */}
                            {match.status === 'finished' && events.length > 0 && (
                                <div className="mt-2 text-xs text-slate-400 space-y-0.5">
                                    {events
                                        .filter(e => ['goal', 'yellow_card', 'red_card'].includes(e.event_type))
                                        .filter(e => {
                                            // is_milan defaults to true for admin-created events
                                            const isMilanEvent = String(e.details?.is_milan) !== 'false';
                                            // Home side shows: Milan events if is_home, opponent events if !is_home
                                            return match.is_home ? isMilanEvent : !isMilanEvent;
                                        })
                                        .sort((a, b) => a.minute - b.minute)
                                        .map((e, i) => (
                                            <div key={i}>
                                                {e.event_type === 'goal' && '⚽ '}
                                                {e.event_type === 'yellow_card' && '🟨 '}
                                                {e.event_type === 'red_card' && '🟥 '}
                                                {e.player_name.split(' ').pop()} {e.minute}&apos;
                                                {e.event_type === 'goal' && String(e.details?.penalty) === 'true' && ' (PK)'}
                                                {e.event_type === 'goal' && e.details?.assisted_by && (
                                                    <span className="text-slate-500"> (🅰️{String(e.details.assisted_by).split(' ').pop()})</span>
                                                )}
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                        </div>

                        {/* Score */}
                        <div className="flex flex-col items-center">
                            {match.status === 'finished' ? (
                                <>
                                    <div className="flex items-center gap-3 text-4xl md:text-5xl font-bold">
                                        <span className={
                                            (match.is_home && match.home_score! > match.away_score!) ||
                                                (!match.is_home && match.away_score! > match.home_score!)
                                                ? 'text-red-500' : 'text-white'
                                        }>
                                            {match.home_score}
                                        </span>
                                        <span className="text-slate-500 text-2xl">-</span>
                                        <span className={
                                            (!match.is_home && match.home_score! > match.away_score!) ||
                                                (match.is_home && match.away_score! > match.home_score!)
                                                ? 'text-red-500' : 'text-white'
                                        }>
                                            {match.away_score}
                                        </span>
                                    </div>
                                    <div className="mt-2">
                                        {(() => {
                                            const milanScore = match.is_home ? match.home_score! : match.away_score!;
                                            const opponentScore = match.is_home ? match.away_score! : match.home_score!;
                                            if (milanScore > opponentScore) {
                                                return <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">勝利</span>;
                                            } else if (milanScore === opponentScore) {
                                                return <span className="bg-yellow-600 text-white px-3 py-1 rounded-full text-xs font-bold">引き分け</span>;
                                            } else {
                                                return <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">敗北</span>;
                                            }
                                        })()}
                                    </div>
                                </>
                            ) : (
                                <div className="text-3xl font-bold text-slate-400">VS</div>
                            )}
                        </div>

                        {/* Away Team (Right Side) */}
                        <div className="flex-1 flex flex-col items-center text-center">
                            {!match.is_home ? (
                                <>
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full shadow-lg mb-2 overflow-hidden flex">
                                        <div className="w-1/2 h-full" style={{ backgroundColor: teamConfig.colors.primary }} />
                                        <div className="w-1/2 h-full" style={{ backgroundColor: teamConfig.colors.secondary }} />
                                    </div>
                                    <p className="text-lg md:text-xl font-bold">{teamConfig.name}</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden flex shadow-lg mb-2">
                                        <div className="w-1/2 h-full" style={{ backgroundColor: getTeamColors(match.opponent_name).primary }} />
                                        <div className="w-1/2 h-full" style={{ backgroundColor: getTeamColors(match.opponent_name).secondary }} />
                                    </div>
                                    <p className="text-lg md:text-xl font-bold">{match.opponent_name}</p>
                                </>
                            )}
                            {/* Away Team Events (Goals & Cards) */}
                            {match.status === 'finished' && events.length > 0 && (
                                <div className="mt-2 text-xs text-slate-400 space-y-0.5">
                                    {events
                                        .filter(e => ['goal', 'yellow_card', 'red_card'].includes(e.event_type))
                                        .filter(e => {
                                            const isMilanEvent = String(e.details?.is_milan) !== 'false';
                                            // Away side shows: Milan events if !is_home, opponent events if is_home
                                            return match.is_home ? !isMilanEvent : isMilanEvent;
                                        })
                                        .sort((a, b) => a.minute - b.minute)
                                        .map((e, i) => (
                                            <div key={i}>
                                                {e.event_type === 'goal' && '⚽ '}
                                                {e.event_type === 'yellow_card' && '🟨 '}
                                                {e.event_type === 'red_card' && '🟥 '}
                                                {e.player_name.split(' ').pop()} {e.minute}&apos;
                                                {e.event_type === 'goal' && String(e.details?.penalty) === 'true' && ' (PK)'}
                                                {e.event_type === 'goal' && e.details?.assisted_by && (
                                                    <span className="text-slate-500"> (🅰️{String(e.details.assisted_by).split(' ').pop()})</span>
                                                )}
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Team Average Rating */}
                    {matchAverageRating && (
                        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-slate-700 text-sm">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-slate-400">チーム平均:</span>
                            <strong className="text-yellow-500">{matchAverageRating.toFixed(1)}</strong>
                        </div>
                    )}
                </div>

                {/* Player Ratings Section */}
                {match.status === 'finished' ? (
                    <div className="space-y-8">
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            <h2 className="text-2xl font-bold">選手採点</h2>
                            <span className="text-sm text-muted-foreground ml-2">
                                スライダーで1.0〜10.0の間で評価してください
                            </span>
                        </div>

                        {/* Login Prompt for non-authenticated users */}
                        {!loading && !user && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <LogIn className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm text-blue-800 font-medium">
                                            ログインして採点に参加しよう
                                        </p>
                                        <p className="text-xs text-blue-600">
                                            Googleアカウントで簡単にログインできます
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSignIn}
                                    className="flex items-center gap-2 text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                                >
                                    <LogIn className="w-4 h-4" />
                                    ログイン
                                </button>
                            </div>
                        )}


                        {/* MVP Banner */}
                        {Object.keys(ratings).length > 0 && (
                            <div className="mb-6">
                                <TopRatedBanner
                                    players={players}
                                    ratings={ratings}
                                    topComment={(() => {
                                        // MVP選手を特定
                                        let bestPlayer: Player | null = null;
                                        let bestRating = -1;

                                        players.forEach(p => {
                                            const r = ratings[p.id];
                                            if (r && r.average > bestRating) {
                                                bestRating = r.average;
                                                bestPlayer = p;
                                            }
                                        });

                                        if (!bestPlayer) return null;

                                        // MVPのコメントを取得
                                        // useRealtimeRatingsで取得したcommentsデータを使用
                                        const bp = bestPlayer as Player;
                                        const playerComments = comments[bp.id] || [];
                                        if (playerComments.length === 0) return null;

                                        // いいね順 -> 新着順でソート
                                        // 現在はlikesCountが未実装(0)なので実質新着順になるが、ロジックとしては正しい
                                        const sorted = [...playerComments].sort((a, b) => {
                                            if (b.likesCount !== a.likesCount) return b.likesCount - a.likesCount;
                                            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                                        });

                                        const top = sorted[0];
                                        return {
                                            userName: top.userName, // 匿名/ミラニスタ
                                            comment: top.comment,
                                            score: top.score
                                        };
                                    })()}
                                    onShowComments={() => {
                                        // 当該選手のカードまでスクロールするなどの処理があれば尚良し
                                        // 今は単純に表示のみ
                                    }}
                                    totalComments={(() => {
                                        let bestPlayerId = '';
                                        let bestRating = -1;
                                        players.forEach(p => {
                                            const r = ratings[p.id];
                                            if (r && r.average > bestRating) {
                                                bestRating = r.average;
                                                bestPlayerId = p.id;
                                            }
                                        });
                                        return bestPlayerId ? (comments[bestPlayerId]?.length || 0) : 0;
                                    })()}
                                />
                            </div>
                        )}

                        {/* ======= フォーメーション図＋交代選手一覧（表示のみ） ======= */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* LEFT: Formation Pitch */}
                            <div className="lg:col-span-2 space-y-2">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    ⚽ フォーメーション{match.formation ? ` (${match.formation})` : ''}
                                </h3>
                                <div className="relative w-full aspect-[3/2] bg-gradient-to-b from-green-600 to-green-700 rounded-xl overflow-hidden border-2 border-black"
                                    style={{ boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)', minHeight: '280px' }}>
                                    {/* Pitch Lines */}
                                    <div className="absolute inset-0">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white/30 rounded-full" />
                                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30" />
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-12 border-2 border-t-0 border-white/30" />
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-12 border-2 border-b-0 border-white/30" />
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 border-2 border-t-0 border-white/30" />
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-20 border-2 border-b-0 border-white/30" />
                                    </div>

                                    {/* Players on Pitch */}
                                    {(() => {
                                        const lineupStarters = lineups.filter(l => l.is_starter);
                                        // player_id での重複排除
                                        const seenIds = new Set<string>();
                                        const pitchPlayers = lineupStarters.length > 0
                                            ? lineupStarters.filter(lu => {
                                                if (!lu.player_id || seenIds.has(lu.player_id)) return false;
                                                seenIds.add(lu.player_id);
                                                return true;
                                            }).map(lu => {
                                                const p = players.find((pl: any) => pl.id === lu.player_id);
                                                return {
                                                    id: lu.player_id || '',
                                                    name: lu.player_name || p?.name || '',
                                                    number: lu.jersey_number || p?.number || 0,
                                                    pixel_config: p?.pixel_config,
                                                    __role: lu.role || lu.position_role || p?.position || 'MF',
                                                    __side: lu.position_side || 'Center',
                                                    __positionRow: lu.position_row || undefined,
                                                };
                                            })
                                            : starters.map(player => ({
                                                ...player,
                                                __role: player.position || 'MF',
                                                __side: 'Center' as string,
                                                __positionRow: undefined as number | undefined,
                                            }));

                                        // Ensure unique players for display on pitch
                                        const uniquePitchPlayers = pitchPlayers.filter((p, i, self) =>
                                            self.findIndex(sp => sp.id === p.id) === i
                                        );

                                        return uniquePitchPlayers.map(player => {
                                            const pos = getFormationPosition(player.__role, player.__side, match.formation || '4-3-3', pitchPlayers, player.id, player.__positionRow);
                                            const playerRating = ratings[player.id];
                                            return (
                                                <div
                                                    key={player.id}
                                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 group cursor-pointer transition-transform hover:scale-110 active:scale-95"
                                                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                                                    onClick={() => setSelectedPlayerId(player.id)}
                                                >
                                                    <div className="relative flex items-center justify-center w-[56px] h-[56px]">
                                                        {player.pixel_config && (
                                                            <div style={{ imageRendering: 'pixelated' as any, width: 56, height: 56 }}>
                                                                <PixelPlayer config={player.pixel_config as PixelConfig} number={player.number} size={56} />
                                                            </div>
                                                        )}
                                                        {playerRating && (
                                                            <span className="absolute -bottom-1 -right-1 bg-white text-[10px] font-bold px-1 rounded border border-black">
                                                                {playerRating.average.toFixed(1)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] font-medium text-white bg-black/60 px-1 py-0.5 rounded whitespace-nowrap">
                                                        {player.name.split(' ').pop()}
                                                    </span>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>

                            {/* RIGHT: Substitutes (read-only) */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    🔄 交代出場 ({substitutes.length}人)
                                </h3>
                                <div className="bg-gradient-to-b from-blue-900/10 to-blue-800/5 rounded-xl p-4 border border-blue-800/20 space-y-2">
                                    {substitutes.map(player => {
                                        const playerRating = ratings[player.id];
                                        return (
                                            <div key={player.id} className="flex items-center gap-3 py-1">
                                                {player.pixel_config && (
                                                    <div style={{ imageRendering: 'pixelated' as any, width: 48, height: 48 }}>
                                                        <PixelPlayer config={player.pixel_config} number={player.number} size={48} />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{player.name}</p>
                                                    <p className="text-xs text-gray-400">#{player.number} {player.position}</p>
                                                </div>
                                                {playerRating && (
                                                    <span className="text-sm font-bold font-mono text-primary">
                                                        {playerRating.average.toFixed(1)}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {substitutes.length === 0 && (
                                        <p className="text-sm text-muted-foreground text-center py-4">交代出場なし</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ======= 選手採点カード（スターター・ポジション別） ======= */}
                        {Object.entries(playersByPosition).map(([position, posPlayers]) => {
                            if (posPlayers.length === 0) return null;
                            const positionLabels: Record<string, string> = {
                                GK: 'ゴールキーパー', DF: 'ディフェンダー', MF: 'ミッドフィールダー', FW: 'フォワード',
                            };
                            return (
                                <div key={position} className="space-y-3">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-primary" />
                                        {positionLabels[position]}
                                    </h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {posPlayers.map(player => {
                                            const playerRating = ratings[player.id];
                                            const userRating = userRatings[player.id];
                                            return (
                                                <MatchRatingCard
                                                    key={player.id}
                                                    name={player.name}
                                                    number={player.number}
                                                    position={player.position || 'MF'}
                                                    pixelConfig={player.pixel_config}
                                                    averageRating={playerRating?.average || null}
                                                    totalRatings={playerRating?.count || 0}
                                                    initialRating={userRating?.score ?? 6.0}
                                                    initialComment={userRating?.comment}
                                                    isInteractive={true}
                                                    isLoading={loading}
                                                    isGuest={!user}
                                                    onAuthAction={handleSignIn}
                                                    onSubmit={(score: number, comment: string) => handleSubmitRating(player.id, score, comment)}
                                                    className="w-full"
                                                    comments={comments[player.id] || []}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {/* 交代出場選手の採点カード */}
                        {substitutes.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                    🔄 交代出場の採点
                                </h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {(() => {
                                        const uniqueSubstitutes = substitutes.filter((p, i, self) =>
                                            self.findIndex(sp => sp.id === p.id) === i
                                        );
                                        return uniqueSubstitutes.map(player => {
                                            const playerRating = ratings[player.id];
                                            const userRating = userRatings[player.id];
                                            return (
                                                <MatchRatingCard
                                                    key={player.id}
                                                    name={player.name}
                                                    number={player.number}
                                                    position={player.position || 'MF'}
                                                    pixelConfig={player.pixel_config}
                                                    averageRating={playerRating?.average || null}
                                                    totalRatings={playerRating?.count || 0}
                                                    initialRating={userRating?.score ?? 6.0}
                                                    initialComment={userRating?.comment}
                                                    isInteractive={true}
                                                    isLoading={loading}
                                                    isGuest={!user}
                                                    onAuthAction={handleSignIn}
                                                    onSubmit={(score: number, comment: string) => handleSubmitRating(player.id, score, comment)}
                                                    className="w-full"
                                                    comments={comments[player.id] || []}
                                                />
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* Share & Ranking */}
                        {Object.keys(ratings).length > 0 && Object.keys(userRatings).length > 0 && (
                            <button
                                onClick={() => setShowShareCard(true)}
                                className="w-full flex items-center justify-center gap-2 bg-black text-white font-bold py-3 rounded-lg border-2 border-black text-sm hover:bg-gray-900 transition-colors mb-4"
                                style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.3)', fontFamily: 'monospace' }}
                            >
                                <Share2 className="w-4 h-4" />
                                📸 採点カードを画像で保存
                            </button>
                        )}
                        {Object.keys(ratings).length > 0 && (
                            <RankingCard
                                title="今試合の評価ランキング"
                                players={players}
                                ratings={ratings}
                                limit={5}
                            />
                        )}
                    </div>
                ) : (
                    <div className="bg-muted/50 rounded-xl p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">試合終了後に採点できます</h3>
                        <p className="text-muted-foreground">
                            この試合はまだ行われていません。試合終了後に選手の採点が可能になります。
                        </p>
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
                    ? `${match.home_score} - ${match.away_score}`
                    : 'vs'}
                playerRatings={Object.entries(userRatings).map(([pid, r]) => {
                    const p = players.find(pl => pl.id === pid);
                    return {
                        name: p?.name || 'Unknown',
                        number: p?.number || 0,
                        position: p?.position || 'MF',
                        score: r.score,
                    };
                }).sort((a, b) => b.score - a.score)}
            />
        </div>
    );
}
