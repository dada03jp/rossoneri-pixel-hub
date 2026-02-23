'use client';

import { PixelPlayer, PixelConfig } from '@/components/pixel-player';
import { motion } from 'framer-motion';
import { Star, Target, Shield, Users, Calendar } from 'lucide-react';

interface PlayerStats {
    player_id: string;
    name: string;
    number: number;
    position: string;
    pixel_config: PixelConfig;
    avg_rating: number;
    appearances: number;
    goals: number;
    assists: number;
    yellow_cards: number;
    red_cards: number;
    rated_matches: number;
    total_ratings: number;
}

interface RatingWithMatch {
    id: string;
    score: number;
    comment: string | null;
    user_name: string | null;
    created_at: string;
    opponent_name: string;
    match_date: string;
    home_score: number;
    away_score: number;
    is_home: boolean;
    competition: string;
}

interface PlayerDetailClientProps {
    stats: PlayerStats;
    ratings: RatingWithMatch[];
}

const POSITION_LABELS: Record<string, string> = {
    'GK': 'ゴールキーパー', 'DF': 'ディフェンダー',
    'MF': 'ミッドフィルダー', 'FW': 'フォワード'
};

function getRatingColor(rating: number): string {
    if (rating >= 7.5) return 'text-green-600';
    if (rating >= 6.5) return 'text-yellow-600';
    if (rating >= 5.5) return 'text-orange-500';
    return 'text-red-500';
}

function getRatingBg(rating: number): string {
    if (rating >= 7.5) return 'bg-green-50 border-green-200';
    if (rating >= 6.5) return 'bg-yellow-50 border-yellow-200';
    if (rating >= 5.5) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
}

export function PlayerDetailClient({ stats, ratings }: PlayerDetailClientProps) {
    const formatDate = (d: string) => new Date(d).toLocaleDateString('ja-JP', {
        month: 'short', day: 'numeric'
    });

    return (
        <div className="space-y-8">
            {/* Hero */}
            <motion.div
                className="bg-white rounded-xl p-6 border-2 border-gray-200"
                style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.15)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Pixel Player Large */}
                    <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <PixelPlayer config={stats.pixel_config} number={stats.number} size={96} />
                    </motion.div>

                    {/* Info */}
                    <div className="text-center md:text-left flex-1">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                            <span className="text-4xl font-bold text-gray-200 font-mono">#{stats.number}</span>
                            <span className="text-xs font-bold text-white bg-primary px-2 py-0.5 rounded">
                                {POSITION_LABELS[stats.position] || stats.position}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold mb-2">{stats.name}</h1>
                        <p className="text-sm text-muted-foreground">
                            25-26 シーズン • {stats.total_ratings} 件の採点
                        </p>
                    </div>

                    {/* Avg Rating Large */}
                    {stats.avg_rating > 0 && (
                        <div className="bg-gray-50 rounded-xl px-6 py-4 text-center"
                            style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.1)' }}>
                            <span className="text-xs text-gray-400 block mb-1">平均点</span>
                            <span className={`text-4xl font-bold font-mono ${getRatingColor(stats.avg_rating)}`}>
                                {stats.avg_rating.toFixed(1)}
                            </span>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    { label: '出場', value: stats.appearances, icon: Users, color: 'text-blue-600' },
                    { label: 'ゴール', value: stats.goals, icon: Target, color: 'text-green-600', emoji: '⚽' },
                    { label: 'アシスト', value: stats.assists, icon: Star, color: 'text-purple-600', emoji: '🅰️' },
                    { label: 'イエロー', value: stats.yellow_cards, icon: Shield, color: 'text-yellow-600', emoji: '🟨' },
                    { label: 'レッド', value: stats.red_cards, icon: Shield, color: 'text-red-600', emoji: '🟥' },
                ].map((stat) => (
                    <motion.div
                        key={stat.label}
                        className="bg-white rounded-lg p-4 border-2 border-gray-200 text-center"
                        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.1)' }}
                        whileHover={{ y: -2 }}
                    >
                        <span className="text-xs text-gray-400 block mb-1">
                            {stat.emoji ? `${stat.emoji} ` : ''}{stat.label}
                        </span>
                        <span className={`text-2xl font-bold font-mono ${stat.color}`}>
                            {stat.value}
                        </span>
                    </motion.div>
                ))}
            </div>

            {/* Rating Timeline */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">採点履歴</h2>
                    <span className="text-sm text-muted-foreground">({ratings.length}件)</span>
                </div>

                {ratings.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-gray-50 rounded-lg">
                        <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>まだ採点データがありません</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {ratings.map((r, i) => (
                            <motion.div
                                key={r.id}
                                className={`bg-white rounded-lg p-4 border-2 ${getRatingBg(r.score)}`}
                                style={{ boxShadow: '3px 3px 0px rgba(0,0,0,0.08)' }}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {/* Score */}
                                        <span className={`text-2xl font-bold font-mono ${getRatingColor(r.score)}`}>
                                            {r.score.toFixed(1)}
                                        </span>
                                        {/* Match Info */}
                                        <div>
                                            <p className="text-sm font-medium">
                                                {r.is_home ? 'AC Milan' : r.opponent_name}
                                                {' '}{r.home_score}-{r.away_score}{' '}
                                                {r.is_home ? r.opponent_name : 'AC Milan'}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {r.competition} • {formatDate(r.match_date)}
                                            </p>
                                        </div>
                                    </div>
                                    {/* User */}
                                    <span className="text-xs text-gray-400">
                                        {r.user_name || '匿名'}
                                    </span>
                                </div>
                                {r.comment && (
                                    <p className="text-sm text-gray-600 mt-2 pl-14 border-l-2 border-gray-200">
                                        {r.comment}
                                    </p>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
