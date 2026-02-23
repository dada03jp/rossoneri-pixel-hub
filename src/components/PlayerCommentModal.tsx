'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Heart, MessageCircle, ArrowUpDown, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PixelPlayer, PixelConfig } from '@/components/pixel-player';
import { User } from '@supabase/supabase-js';

interface Comment {
    id: string;
    user_name: string;
    score: number;
    comment: string;
    created_at: string;
    likes_count: number;
    user_has_liked: boolean;
    replies: {
        id: string;
        user_name: string;
        content: string;
        created_at: string;
    }[];
}

interface PlayerCommentModalProps {
    isOpen: boolean;
    onClose: () => void;
    playerId: string;
    matchId: string;
    playerName: string;
    playerNumber: number;
    playerPosition: string;
    pixelConfig?: PixelConfig | null;
    averageRating: number | null;
    totalRatings: number;
    user: User | null;
    onAuthAction: () => void;
}

export function PlayerCommentModal({
    isOpen,
    onClose,
    playerId,
    matchId,
    playerName,
    playerNumber,
    playerPosition,
    pixelConfig,
    averageRating,
    totalRatings,
    user,
    onAuthAction,
}: PlayerCommentModalProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'likes' | 'newest'>('likes');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // コメントデータの取得
    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);

        const fetchComments = async () => {
            const supabase = createClient();

            // ratings + replies + likes
            const { data: ratings } = await supabase
                .from('ratings')
                .select('*')
                .eq('match_id', matchId)
                .eq('player_id', playerId)
                .not('comment', 'is', null);

            if (!ratings) {
                setComments([]);
                setLoading(false);
                return;
            }

            // likes count per rating
            const ratingIds = ratings.map(r => r.id);

            let likesMap: Record<string, number> = {};
            let userLikedSet = new Set<string>();
            let repliesMap: Record<string, Comment['replies']> = {};

            if (ratingIds.length > 0) {
                // Get likes
                const { data: likes } = await supabase
                    .from('comment_likes')
                    .select('*')
                    .in('rating_id', ratingIds);

                if (likes) {
                    likes.forEach(l => {
                        likesMap[l.rating_id] = (likesMap[l.rating_id] || 0) + 1;
                        if (user && l.user_id === user.id) {
                            userLikedSet.add(l.rating_id);
                        }
                    });
                }

                // Get replies
                const { data: replies } = await supabase
                    .from('comment_replies')
                    .select('*')
                    .in('rating_id', ratingIds)
                    .order('created_at', { ascending: true });

                if (replies) {
                    replies.forEach(r => {
                        if (!repliesMap[r.rating_id]) repliesMap[r.rating_id] = [];
                        repliesMap[r.rating_id].push({
                            id: r.id,
                            user_name: r.user_name || 'ミラニスタ',
                            content: r.content,
                            created_at: r.created_at,
                        });
                    });
                }
            }

            const mapped: Comment[] = ratings
                .filter(r => r.comment && r.comment.trim().length > 0)
                .map(r => ({
                    id: r.id,
                    user_name: r.user_name || 'ミラニスタ',
                    score: r.score,
                    comment: r.comment || '',
                    created_at: r.created_at,
                    likes_count: likesMap[r.id] || 0,
                    user_has_liked: userLikedSet.has(r.id),
                    replies: repliesMap[r.id] || [],
                }));

            setComments(mapped);
            setLoading(false);
        };

        fetchComments();
    }, [isOpen, playerId, matchId, user]);

    // ソート
    const sortedComments = useMemo(() => {
        const sorted = [...comments];
        if (sortBy === 'likes') {
            sorted.sort((a, b) => b.likes_count - a.likes_count || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else {
            sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
        return sorted;
    }, [comments, sortBy]);

    // いいね
    const toggleLike = async (ratingId: string) => {
        if (!user) { onAuthAction(); return; }
        const supabase = createClient();
        const comment = comments.find(c => c.id === ratingId);
        if (!comment) return;

        if (comment.user_has_liked) {
            await supabase.from('comment_likes').delete().eq('rating_id', ratingId).eq('user_id', user.id);
            setComments(prev => prev.map(c => c.id === ratingId
                ? { ...c, likes_count: c.likes_count - 1, user_has_liked: false }
                : c
            ));
        } else {
            await supabase.from('comment_likes').insert({ rating_id: ratingId, user_id: user.id } as any);
            setComments(prev => prev.map(c => c.id === ratingId
                ? { ...c, likes_count: c.likes_count + 1, user_has_liked: true }
                : c
            ));
        }
    };

    // 返信
    const submitReply = async (ratingId: string) => {
        if (!user) { onAuthAction(); return; }
        if (!replyText.trim()) return;
        setSubmitting(true);

        const supabase = createClient();
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'ミラニスタ';
        const { data, error } = await supabase
            .from('comment_replies')
            .insert({
                rating_id: ratingId,
                user_id: user.id,
                user_name: userName,
                content: replyText.trim(),
            } as any)
            .select()
            .single();

        if (!error && data) {
            setComments(prev => prev.map(c => c.id === ratingId
                ? {
                    ...c,
                    replies: [...c.replies, {
                        id: data.id,
                        user_name: userName,
                        content: replyText.trim(),
                        created_at: data.created_at,
                    }],
                }
                : c
            ));
            setReplyText('');
            setReplyingTo(null);
        }
        setSubmitting(false);
    };

    // 評価バッジの色分け
    const getRatingColor = (score: number) => {
        if (score >= 8) return 'bg-green-600';
        if (score >= 6) return 'bg-yellow-500';
        if (score >= 4) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}分前`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}時間前`;
        const days = Math.floor(hours / 24);
        return `${days}日前`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative w-full sm:max-w-lg max-h-[85vh] bg-background rounded-t-2xl sm:rounded-2xl border-2 border-black overflow-hidden flex flex-col"
                style={{
                    boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                    backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)',
                    backgroundSize: '8px 8px',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b-2 border-black bg-gradient-to-r from-red-600 to-red-800 text-white">
                    {pixelConfig && (
                        <div style={{ imageRendering: 'pixelated' as any }} className="animate-bounce">
                            <PixelPlayer config={pixelConfig} number={playerNumber} size={48} />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg truncate">{playerName}</h3>
                        <div className="flex items-center gap-2 text-sm text-white/80">
                            <span>#{playerNumber}</span>
                            <span>{playerPosition}</span>
                            {averageRating !== null && (
                                <span className="bg-white/20 px-2 py-0.5 rounded-full font-bold">
                                    ⭐ {averageRating.toFixed(1)}
                                </span>
                            )}
                            <span className="text-white/60">({totalRatings}件)</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sort Controls */}
                <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/50">
                    <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                    <button
                        onClick={() => setSortBy('likes')}
                        className={`text-xs px-3 py-1 rounded-full border-2 border-black transition-all ${sortBy === 'likes'
                                ? 'bg-primary text-white'
                                : 'bg-background hover:bg-muted'
                            }`}
                        style={{ boxShadow: sortBy === 'likes' ? '2px 2px 0 0 rgba(0,0,0,1)' : 'none' }}
                    >
                        ❤️ いいね順
                    </button>
                    <button
                        onClick={() => setSortBy('newest')}
                        className={`text-xs px-3 py-1 rounded-full border-2 border-black transition-all ${sortBy === 'newest'
                                ? 'bg-primary text-white'
                                : 'bg-background hover:bg-muted'
                            }`}
                        style={{ boxShadow: sortBy === 'newest' ? '2px 2px 0 0 rgba(0,0,0,1)' : 'none' }}
                    >
                        🕐 新着順
                    </button>
                    <span className="text-xs text-muted-foreground ml-auto">
                        {comments.length}件のコメント
                    </span>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                    ) : sortedComments.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">まだコメントはありません</p>
                            <p className="text-xs mt-1">採点時にコメントを残してみましょう！</p>
                        </div>
                    ) : (
                        sortedComments.map(comment => (
                            <div
                                key={comment.id}
                                className="bg-card rounded-lg border-2 border-black p-3 space-y-2"
                                style={{ boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)' }}
                            >
                                {/* Comment Header */}
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs text-white font-bold px-2 py-0.5 rounded ${getRatingColor(comment.score)}`}>
                                        {comment.score.toFixed(1)}
                                    </span>
                                    <span className="text-sm font-medium">{comment.user_name}</span>
                                    <span className="text-xs text-muted-foreground ml-auto">
                                        {formatTime(comment.created_at)}
                                    </span>
                                </div>

                                {/* Comment Body */}
                                <p className="text-sm leading-relaxed">{comment.comment}</p>

                                {/* Actions */}
                                <div className="flex items-center gap-3 pt-1">
                                    <button
                                        onClick={() => toggleLike(comment.id)}
                                        className={`flex items-center gap-1 text-xs transition-colors ${comment.user_has_liked
                                                ? 'text-red-500 font-bold'
                                                : 'text-muted-foreground hover:text-red-500'
                                            }`}
                                    >
                                        <Heart className={`w-3.5 h-3.5 ${comment.user_has_liked ? 'fill-current' : ''}`} />
                                        {comment.likes_count > 0 && comment.likes_count}
                                    </button>
                                    <button
                                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        {comment.replies.length > 0 && comment.replies.length}
                                    </button>
                                </div>

                                {/* Replies */}
                                {comment.replies.length > 0 && (
                                    <div className="ml-4 space-y-2 border-l-2 border-muted pl-3">
                                        {comment.replies.map(reply => (
                                            <div key={reply.id} className="text-xs">
                                                <span className="font-medium">{reply.user_name}</span>
                                                <span className="text-muted-foreground ml-1">{formatTime(reply.created_at)}</span>
                                                <p className="mt-0.5">{reply.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Reply Input */}
                                {replyingTo === comment.id && (
                                    <div className="flex gap-2 mt-2">
                                        <input
                                            type="text"
                                            value={replyText}
                                            onChange={e => setReplyText(e.target.value)}
                                            placeholder="返信を入力..."
                                            className="flex-1 text-sm px-3 py-1.5 rounded-lg border-2 border-black bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                            onKeyDown={e => e.key === 'Enter' && submitReply(comment.id)}
                                        />
                                        <button
                                            onClick={() => submitReply(comment.id)}
                                            disabled={submitting || !replyText.trim()}
                                            className="px-3 py-1.5 bg-primary text-white rounded-lg border-2 border-black text-sm disabled:opacity-50 hover:bg-primary/90 transition-colors"
                                            style={{ boxShadow: '2px 2px 0 0 rgba(0,0,0,1)' }}
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
