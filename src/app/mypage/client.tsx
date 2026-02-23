'use client';

import { motion } from 'framer-motion';
import { User, Crown, Star, Lock, Calendar, Trophy, ArrowRight, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface UserInfo {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    plan_type: 'free' | 'premium';
}

interface HighlightEntry {
    score: number;
    player_name: string;
    player_number: number;
    opponent_name: string;
    match_date: string;
    comment: string | null;
}

interface UserHighlights {
    top: HighlightEntry | null;
    worst: HighlightEntry | null;
}

interface UserStats {
    total_ratings: number;
    matches_rated: number;
    favorite_player: {
        name: string;
        number: number;
        avg_score: number;
        count: number;
    } | null;
    recent_ratings: {
        score: number;
        comment: string | null;
        created_at: string;
        opponent_name: string;
        match_date: string;
        is_home: boolean;
        player_name: string;
        player_number: number;
    }[];
    rated_matches: {
        id: string;
        opponent_name: string;
        match_date: string;
        home_score: number;
        away_score: number;
        is_home: boolean;
        competition: string;
        player_count: number;
        avg_given: number;
    }[];
}

interface MyPageClientProps {
    user: UserInfo;
    stats: UserStats;
    highlights: UserHighlights;
}

function getRatingColor(r: number) {
    if (r >= 7.5) return 'text-green-600';
    if (r >= 6.5) return 'text-yellow-600';
    return 'text-orange-500';
}

const FREE_MATCH_LIMIT = 2;
const PIXEL_SHADOW = '4px 4px 0px 0px rgba(0,0,0,1)';
const PIXEL_SHADOW_SM = '3px 3px 0px 0px rgba(0,0,0,1)';

export function MyPageClient({ user, stats, highlights }: MyPageClientProps) {
    const [upgrading, setUpgrading] = useState(false);
    const formatDate = (d: string) => new Date(d).toLocaleDateString('ja-JP', {
        month: 'short', day: 'numeric'
    });

    const isFree = user.plan_type === 'free';

    const handleUpgrade = async () => {
        setUpgrading(true);
        try {
            const res = await fetch('/api/stripe/checkout', { method: 'POST' });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('Stripe Checkout は現在準備中です。');
            }
        } catch {
            alert('エラーが発生しました');
        } finally {
            setUpgrading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Profile Header */}
            <motion.div
                className="bg-white rounded-xl p-6 border-2 border-black"
                style={{
                    boxShadow: PIXEL_SHADOW,
                    backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)',
                    backgroundSize: '8px 8px',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center gap-4">
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-16 h-16 rounded-full border-3 border-primary" style={{ imageRendering: 'pixelated' as any }} />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-8 h-8 text-primary" />
                        </div>
                    )}
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">{user.name}</h1>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    {/* Plan Badge — Free はクリックで Stripe へ */}
                    {isFree ? (
                        <button
                            onClick={handleUpgrade}
                            disabled={upgrading}
                            className="px-4 py-2 rounded-lg text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gradient-to-r hover:from-yellow-400 hover:to-amber-500 hover:text-white transition-all cursor-pointer relative group"
                            style={{ boxShadow: PIXEL_SHADOW_SM }}
                        >
                            <span className="flex items-center gap-1">
                                <User className="w-4 h-4" /> Free
                            </span>
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                ⬆️ Premium にアップグレード
                            </span>
                        </button>
                    ) : (
                        <div className="px-4 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-white"
                            style={{ boxShadow: PIXEL_SHADOW_SM }}>
                            <span className="flex items-center gap-1"><Crown className="w-4 h-4" /> Premium</span>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: '採点総数', value: stats.total_ratings, color: 'text-primary' },
                    { label: '試合数', value: stats.matches_rated, color: 'text-blue-600' },
                ].map((s) => (
                    <motion.div
                        key={s.label}
                        className="bg-white rounded-lg p-4 border-2 border-black text-center"
                        style={{ boxShadow: PIXEL_SHADOW_SM }}
                        whileHover={{ y: -3 }}
                    >
                        <span className="text-xs text-gray-400 block mb-1">{s.label}</span>
                        <span className={`text-3xl font-bold font-mono ${s.color}`}>{s.value}</span>
                    </motion.div>
                ))}
                <motion.div
                    className="bg-white rounded-lg p-4 border-2 border-black text-center"
                    style={{ boxShadow: PIXEL_SHADOW_SM }}
                    whileHover={{ y: -3 }}
                >
                    <span className="text-xs text-gray-400 block mb-1">推し選手</span>
                    {stats.favorite_player ? (
                        <div>
                            <span className="text-lg font-bold block truncate">{stats.favorite_player.name.split(' ').pop()}</span>
                            <span className={`text-sm font-mono ${getRatingColor(stats.favorite_player.avg_score)}`}>
                                avg {stats.favorite_player.avg_score}
                            </span>
                        </div>
                    ) : (
                        <span className="text-xl text-gray-300">-</span>
                    )}
                </motion.div>
            </div>

            {/* Highlights: Top & Worst */}
            {(highlights.top || highlights.worst) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {highlights.top && (
                        <motion.div
                            className="bg-green-50 rounded-lg p-4 border-2 border-green-400"
                            style={{ boxShadow: '4px 4px 0px 0px rgba(34,197,94,0.5)' }}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                                <h3 className="text-sm font-bold text-green-700">🏆 トップ採点</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-3xl font-bold font-mono text-green-600">{highlights.top.score.toFixed(1)}</span>
                                <div>
                                    <p className="text-sm font-medium">#{highlights.top.player_number} {highlights.top.player_name}</p>
                                    <p className="text-xs text-gray-400">vs {highlights.top.opponent_name} • {formatDate(highlights.top.match_date)}</p>
                                </div>
                            </div>
                            {highlights.top.comment && (
                                <p className="text-xs text-gray-500 mt-2 border-l-2 border-green-300 pl-2">&ldquo;{highlights.top.comment}&rdquo;</p>
                            )}
                        </motion.div>
                    )}
                    {highlights.worst && (
                        <motion.div
                            className="bg-red-50 rounded-lg p-4 border-2 border-red-300"
                            style={{ boxShadow: '4px 4px 0px 0px rgba(239,68,68,0.4)' }}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingDown className="w-5 h-5 text-red-500" />
                                <h3 className="text-sm font-bold text-red-600">😤 ワースト採点</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-3xl font-bold font-mono text-red-500">{highlights.worst.score.toFixed(1)}</span>
                                <div>
                                    <p className="text-sm font-medium">#{highlights.worst.player_number} {highlights.worst.player_name}</p>
                                    <p className="text-xs text-gray-400">vs {highlights.worst.opponent_name} • {formatDate(highlights.worst.match_date)}</p>
                                </div>
                            </div>
                            {highlights.worst.comment && (
                                <p className="text-xs text-gray-500 mt-2 border-l-2 border-red-300 pl-2">&ldquo;{highlights.worst.comment}&rdquo;</p>
                            )}
                        </motion.div>
                    )}
                </div>
            )}

            {/* Rated Matches */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">採点した試合</h2>
                </div>

                {stats.rated_matches.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-gray-50 rounded-lg border-2 border-black"
                        style={{ boxShadow: PIXEL_SHADOW_SM }}>
                        <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>まだ試合を採点していません</p>
                        <Link href="/" className="text-primary text-sm mt-2 inline-block">
                            試合一覧へ <ArrowRight className="w-3 h-3 inline" />
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {stats.rated_matches.map((match, i) => {
                            const isLocked = isFree && i >= FREE_MATCH_LIMIT;

                            return (
                                <motion.div
                                    key={match.id}
                                    className="relative"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Link href={isLocked ? '#' : `/matches/${match.id}`}>
                                        <div className={`bg-white rounded-lg p-4 border-2 border-black flex items-center justify-between ${isLocked ? 'opacity-50 pointer-events-none' : 'hover:translate-y-[-2px]'
                                            } transition-transform`}
                                            style={{ boxShadow: PIXEL_SHADOW_SM }}>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-gray-400 w-16">
                                                    {formatDate(match.match_date)}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {match.is_home ? 'AC Milan' : match.opponent_name}
                                                        {' '}{match.home_score}-{match.away_score}{' '}
                                                        {match.is_home ? match.opponent_name : 'AC Milan'}
                                                    </p>
                                                    <p className="text-xs text-gray-400">{match.competition}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-lg font-bold font-mono ${getRatingColor(match.avg_given)}`}>
                                                    {match.avg_given}
                                                </span>
                                                <span className="text-xs text-gray-400 block">{match.player_count}名採点</span>
                                            </div>
                                        </div>
                                    </Link>

                                    {/* Lock Overlay */}
                                    {isLocked && (
                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-lg flex items-center justify-center">
                                            <button
                                                onClick={handleUpgrade}
                                                className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-700 transition-colors cursor-pointer"
                                                style={{ boxShadow: PIXEL_SHADOW_SM }}
                                            >
                                                <Lock className="w-4 h-4" />
                                                Premium で開放
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Recent Ratings Timeline */}
            {stats.recent_ratings.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Star className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-bold">最近の採点</h2>
                    </div>
                    <div className="space-y-2">
                        {stats.recent_ratings.map((r, i) => (
                            <motion.div
                                key={i}
                                className="bg-white rounded-lg p-3 border-2 border-black flex items-center gap-3"
                                style={{ boxShadow: '2px 2px 0px 0px rgba(0,0,0,0.8)' }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.03 }}
                            >
                                <span className={`text-xl font-bold font-mono w-12 text-center ${getRatingColor(r.score)}`}>
                                    {r.score.toFixed(1)}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        #{r.player_number} {r.player_name}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                        vs {r.opponent_name} • {formatDate(r.match_date)}
                                    </p>
                                </div>
                                {r.comment && (
                                    <p className="text-xs text-gray-500 max-w-[150px] truncate hidden md:block">
                                        &ldquo;{r.comment}&rdquo;
                                    </p>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
