'use client';

import { BackHeader } from '@/components/header';
import { PlayerRatingCard } from '@/components/player-rating-card';
import { PixelPlayer, PixelConfig } from '@/components/pixel-player';
import { RankingCard, TopRatedBanner } from '@/components/ranking-card';
import { FormationDisplay } from '@/components/formation-display';
import { EventTimeline } from '@/components/event-timeline';
import { Calendar, Trophy, Users, Star, AlertCircle, LogIn, Wifi, WifiOff } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Match, Player, MatchEvent, MatchLineup } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import { getTeamColors } from '@/lib/team-colors';
import { User } from '@supabase/supabase-js';
import { useRealtimeRatings } from '@/hooks/use-realtime-ratings';

interface MatchDetailClientProps {
    match: Match;
    players: (Player & { pixel_config: PixelConfig })[];
    ratings: Record<string, { average: number; count: number }>;
    isUsingMockData: boolean;
    events: MatchEvent[];
    lineups: MatchLineup[];
}

export function MatchDetailClient({
    match,
    players,
    ratings: initialRatings,
    isUsingMockData,
    events,
    lineups
}: MatchDetailClientProps) {
    // リアルタイム採点更新
    const { ratings, comments, isConnected } = useRealtimeRatings({
        matchId: match.id,
        initialRatings
    });
    const [userRatings, setUserRatings] = useState<Record<string, { score: number; comment: string }>>({});
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

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
        const starterList = players.filter((p: any) => p.is_starter === true);
        const subList = players.filter((p: any) => p.is_starter === false);
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
            alert('採点するにはログインが必要です');
            return;
        }

        const supabase = createClient();

        const { error } = await supabase
            .from('ratings')
            .upsert({
                user_id: user.id,
                match_id: match.id,
                player_id: playerId,
                score,
                comment: comment || null
            } as any, {
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
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=${window.location.pathname}`,
            },
        });
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
        if (!match.is_finished || match.home_score === null || match.away_score === null) {
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
            {/* Custom Header for this page */}
            <BackHeader
                title={`AC Milan vs ${match.opponent_name}`}
                subtitle={match.competition || undefined}
            />

            <div className="container mx-auto px-4 py-8 space-y-8">
                {/* Realtime Connection Indicator */}
                {match.is_finished && !isUsingMockData && (
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
                {match.is_finished && Object.keys(ratings).length > 0 && (
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
                                    <div className="w-16 h-16 md:w-20 md:h-20 milan-stripes rounded-full shadow-lg mb-2" />
                                    <p className="text-lg md:text-xl font-bold">AC Milan</p>
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
                            {/* Home Goals */}
                            {match.is_finished && events.filter(e => e.event_type === 'goal').length > 0 && (
                                <div className="mt-2 text-xs text-slate-400 space-y-0.5">
                                    {events
                                        .filter(e => e.event_type === 'goal')
                                        .filter(e => {
                                            // Match is_home: true = Milan is home team
                                            // Home side shows: Milan goals if is_home, opponent goals if !is_home
                                            const isMilanGoal = String(e.details?.is_milan) === 'true';
                                            return match.is_home ? isMilanGoal : !isMilanGoal;
                                        })
                                        .map((e, i) => (
                                            <div key={i}>
                                                {e.player_name.split(' ').pop()} {e.minute}&apos;
                                                {String(e.details?.penalty) === 'true' && ' (PK)'}
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                        </div>

                        {/* Score */}
                        <div className="flex flex-col items-center">
                            {match.is_finished ? (
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
                                    <div className="w-16 h-16 md:w-20 md:h-20 milan-stripes rounded-full shadow-lg mb-2" />
                                    <p className="text-lg md:text-xl font-bold">AC Milan</p>
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
                            {/* Away Goals - Right side shows away team goals */}
                            {match.is_finished && events.filter(e => e.event_type === 'goal').length > 0 && (
                                <div className="mt-2 text-xs text-slate-400 space-y-0.5">
                                    {events
                                        .filter(e => e.event_type === 'goal')
                                        .filter(e => {
                                            // Away side shows: Milan goals if !is_home, opponent goals if is_home
                                            const isMilanGoal = String(e.details?.is_milan) === 'true';
                                            return match.is_home ? !isMilanGoal : isMilanGoal;
                                        })
                                        .map((e, i) => (
                                            <div key={i}>
                                                {e.player_name.split(' ').pop()} {e.minute}&apos;
                                                {String(e.details?.penalty) === 'true' && ' (PK)'}
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
                {match.is_finished ? (
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

                        {/* Formation Display */}
                        {lineups.length > 0 && match.formation && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    ⚽ スターティングラインナップ
                                </h3>
                                <FormationDisplay
                                    lineup={lineups}
                                    formation={match.formation}
                                    isHome={match.is_home ?? true}
                                />
                            </div>
                        )}

                        {/* Player Lineup Cards - Starters */}
                        {(lineups.length === 0 || !match.formation) && starters.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg">⚽ スターティングメンバー ({starters.length}人)</h3>
                                <div className="bg-gradient-to-b from-green-900/20 to-green-800/10 rounded-xl p-6 border border-green-800/20">
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {starters.map(player => {
                                            const playerRating = ratings[player.id];
                                            return (
                                                <div
                                                    key={player.id}
                                                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                                                    title={`${player.name} - ${playerRating?.average.toFixed(1) || 'N/A'}`}
                                                >
                                                    {player.pixel_config && (
                                                        <PixelPlayer
                                                            config={player.pixel_config}
                                                            number={player.number}
                                                            size={48}
                                                        />
                                                    )}
                                                    <span className="text-xs text-center font-medium max-w-[60px] truncate">
                                                        {player.name.split(' ').pop()}
                                                    </span>
                                                    {playerRating && (
                                                        <span className="text-xs font-bold text-primary">
                                                            {playerRating.average.toFixed(1)}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Player Lineup Cards - Substitutes */}
                        {(lineups.length === 0 || !match.formation) && substitutes.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg">🔄 交代出場 ({substitutes.length}人)</h3>
                                <div className="bg-gradient-to-b from-blue-900/20 to-blue-800/10 rounded-xl p-6 border border-blue-800/20">
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {substitutes.map(player => {
                                            const playerRating = ratings[player.id];
                                            return (
                                                <div
                                                    key={player.id}
                                                    className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                                                    title={`${player.name} - ${playerRating?.average.toFixed(1) || 'N/A'}`}
                                                >
                                                    {player.pixel_config && (
                                                        <PixelPlayer
                                                            config={player.pixel_config}
                                                            number={player.number}
                                                            size={48}
                                                        />
                                                    )}
                                                    <span className="text-xs text-center font-medium max-w-[60px] truncate">
                                                        {player.name.split(' ').pop()}
                                                    </span>
                                                    {playerRating && (
                                                        <span className="text-xs font-bold text-primary">
                                                            {playerRating.average.toFixed(1)}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Rating Cards by Position (Starters) */}
                        {Object.entries(playersByPosition).map(([position, posPlayers]) => {
                            if (posPlayers.length === 0) return null;

                            const positionLabels: Record<string, string> = {
                                GK: 'ゴールキーパー',
                                DF: 'ディフェンダー',
                                MF: 'ミッドフィールダー',
                                FW: 'フォワード',
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
                                                <PlayerRatingCard
                                                    key={player.id}
                                                    playerId={player.id}
                                                    playerName={player.name}
                                                    playerNumber={player.number}
                                                    position={player.position || 'MF'}
                                                    pixelConfig={player.pixel_config}
                                                    averageRating={playerRating?.average}
                                                    totalRatings={playerRating?.count}
                                                    userRating={userRating?.score}
                                                    userComment={userRating?.comment}
                                                    onSubmitRating={handleSubmitRating}
                                                    disabled={loading}
                                                    comments={comments[player.id] || []}
                                                    onLikeComment={() => { }} // TODO: いいね機能
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Rating Cards for Substitutes */}
                        {substitutes.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                    🔄 交代出場
                                </h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {substitutes.map(player => {
                                        const playerRating = ratings[player.id];
                                        const userRating = userRatings[player.id];

                                        return (
                                            <PlayerRatingCard
                                                key={player.id}
                                                playerId={player.id}
                                                playerName={player.name}
                                                playerNumber={player.number}
                                                position={player.position || 'MF'}
                                                pixelConfig={player.pixel_config}
                                                averageRating={playerRating?.average}
                                                totalRatings={playerRating?.count}
                                                userRating={userRating?.score}
                                                userComment={userRating?.comment}
                                                onSubmitRating={handleSubmitRating}
                                                disabled={loading}
                                                comments={comments[player.id] || []}
                                                onLikeComment={() => { }} // TODO: いいね機能
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Ranking Card */}
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
        </div>
    );
}
