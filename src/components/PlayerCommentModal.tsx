'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Heart, MessageCircle, ArrowUpDown, Send, Trash2, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PixelPlayer, PixelConfig } from '@/components/pixel-player';
import { User } from '@supabase/supabase-js';

// Types
interface Reply {
    id: string;
    rating_id: string;
    user_id: string;
    user_name: string;
    content: string;
    created_at: string;
    parent_id: string | null;
    is_deleted: boolean;
    children?: Reply[];
}

interface Comment {
    id: string;
    user_id: string;
    user_name: string;
    score: number;
    comment: string;
    created_at: string;
    likes_count: number;
    user_has_liked: boolean;
    is_deleted: boolean;
    replies: Reply[];
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
    const [replyingTo, setReplyingTo] = useState<{ type: 'rating' | 'reply', id: string, ratingId: string } | null>(null);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // 報告用モーダルの状態
    const [reportTarget, setReportTarget] = useState<{ type: 'rating' | 'reply', id: string } | null>(null);
    const [reportReason, setReportReason] = useState('spam');
    const [isReporting, setIsReporting] = useState(false);

    // コメントデータの取得
    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);

        const fetchComments = async () => {
            const supabase = createClient();

            // 1. Check if current user is admin
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();
                if (profile?.role === 'admin') {
                    setIsAdmin(true);
                }
            }

            // 2. Fetch Ratings
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

            const ratingIds = ratings.map(r => r.id);
            let likesMap: Record<string, number> = {};
            let userLikedSet = new Set<string>();
            let repliesMap: Record<string, Reply[]> = {};

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
                    // Build nested replies
                    const allReplies: Reply[] = replies.map(r => ({
                        id: r.id,
                        rating_id: r.rating_id,
                        user_id: r.user_id,
                        user_name: r.user_name || 'ミラニスタ',
                        content: r.content,
                        created_at: r.created_at,
                        parent_id: r.parent_id,
                        is_deleted: r.is_deleted || false,
                        children: []
                    }));

                    const replyDict: Record<string, Reply> = {};
                    allReplies.forEach(r => replyDict[r.id] = r);

                    allReplies.forEach(r => {
                        if (r.parent_id && replyDict[r.parent_id]) {
                            replyDict[r.parent_id].children!.push(r);
                        } else {
                            if (!repliesMap[r.rating_id]) repliesMap[r.rating_id] = [];
                            repliesMap[r.rating_id].push(r);
                        }
                    });
                }
            }

            const mapped: Comment[] = ratings
                .filter(r => (r.comment && r.comment.trim().length > 0) || r.is_deleted)
                .map(r => ({
                    id: r.id,
                    user_id: r.user_id,
                    user_name: r.user_name || 'ミラニスタ',
                    score: r.score,
                    comment: r.comment || '',
                    created_at: r.created_at,
                    likes_count: likesMap[r.id] || 0,
                    user_has_liked: userLikedSet.has(r.id),
                    is_deleted: r.is_deleted || false,
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
    const submitReply = async (ratingId: string, parentId: string | null = null) => {
        if (!user) { onAuthAction(); return; }
        if (!replyText.trim()) return;
        setSubmitting(true);

        const supabase = createClient();
        const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'ミラニスタ';

        const payload: any = {
            rating_id: ratingId,
            user_id: user.id,
            user_name: userName,
            content: replyText.trim(),
        };
        if (parentId && typeof parentId === 'string' && parentId.trim() !== '') {
            payload.parent_id = parentId;
        }

        const { data, error } = await supabase
            .from('comment_replies')
            .insert(payload)
            .select()
            .single();

        if (error) {
            console.error('Supabase Error:', error);
            alert(`返信の送信に失敗しました: ${error.message}`);
        }

        if (!error && data) {
            const newReply: Reply = {
                id: data.id,
                rating_id: data.rating_id,
                user_id: data.user_id,
                user_name: userName,
                content: replyText.trim(),
                created_at: data.created_at,
                parent_id: data.parent_id,
                is_deleted: false,
                children: []
            };

            setComments(prev => {
                const updated = [...prev];
                const cIndex = updated.findIndex(c => c.id === ratingId);
                if (cIndex === -1) return prev;

                const newComment = { ...updated[cIndex] };
                if (parentId) {
                    //再帰的に子供に追加する処理が必要だが、簡略化のためフラットに見つける
                    const addReplyToParent = (replies: Reply[]): boolean => {
                        for (let r of replies) {
                            if (r.id === parentId) {
                                r.children = [...(r.children || []), newReply];
                                return true;
                            }
                            if (r.children && addReplyToParent(r.children)) return true;
                        }
                        return false;
                    };
                    const clonedReplies = JSON.parse(JSON.stringify(newComment.replies));
                    addReplyToParent(clonedReplies);
                    newComment.replies = clonedReplies;
                } else {
                    newComment.replies = [...newComment.replies, newReply];
                }
                updated[cIndex] = newComment;
                return updated;
            });
            setReplyText('');
            setReplyingTo(null);
        }
        setSubmitting(false);
    };

    // 削除 (論理)
    const handleDelete = async (type: 'rating' | 'reply', id: string) => {
        if (!confirm('このコメントを削除しますか？')) return;
        const supabase = createClient();

        if (type === 'rating') {
            await supabase.from('ratings').update({ is_deleted: true } as any).eq('id', id);
            setComments(prev => prev.map(c => c.id === id ? { ...c, is_deleted: true } : c));
        } else {
            await supabase.from('comment_replies').update({ is_deleted: true } as any).eq('id', id);
            // Delete reply locally
            setComments(prev => {
                const updated = [...prev];
                for (let i = 0; i < updated.length; i++) {
                    const clonedReplies = JSON.parse(JSON.stringify(updated[i].replies));
                    const markDeleted = (replies: Reply[]): boolean => {
                        for (let r of replies) {
                            if (r.id === id) {
                                r.is_deleted = true;
                                return true;
                            }
                            if (r.children && markDeleted(r.children)) return true;
                        }
                        return false;
                    };
                    if (markDeleted(clonedReplies)) {
                        updated[i] = { ...updated[i], replies: clonedReplies };
                        break;
                    }
                }
                return updated;
            });
        }
    };

    // 報告
    const handleReport = async () => {
        if (!user || !reportTarget) return;
        setIsReporting(true);
        const supabase = createClient();
        await supabase.from('reports').insert({
            target_type: reportTarget.type,
            target_id: reportTarget.id,
            reporter_id: user.id,
            reason: reportReason
        } as any);
        setIsReporting(false);
        setReportTarget(null);
        alert('報告を受信しました。ご協力ありがとうございます。');
    };

    // Helper
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

    // Recursive Reply Renderer
    const renderReplies = (replies: Reply[], ratingId: string, depth = 0) => {
        return replies.map(reply => (
            <div key={reply.id} className={`mt-2 ${depth > 0 ? 'ml-4 border-l-2 pl-3 border-black/10' : ''}`}>
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${reply.is_deleted ? 'text-muted-foreground line-through' : ''}`}>
                        {reply.is_deleted ? '削除済みユーザー' : reply.user_name}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatTime(reply.created_at)}</span>
                    {!reply.is_deleted && user && (
                        <div className="ml-auto flex items-center gap-2">
                            <button onClick={() => setReplyingTo({ type: 'reply', id: reply.id, ratingId })} className="text-[10px] text-muted-foreground hover:text-primary">
                                返信
                            </button>
                            <button onClick={() => setReportTarget({ type: 'reply', id: reply.id })} className="text-[10px] text-muted-foreground hover:text-red-500">
                                報告
                            </button>
                            {(isAdmin || user.id === reply.user_id) && (
                                <button onClick={() => handleDelete('reply', reply.id)} className="text-[10px] text-red-500 hover:text-red-700">
                                    削除
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <p className={`text-sm mt-0.5 ${reply.is_deleted ? 'text-muted-foreground italic' : ''}`}>
                    {reply.is_deleted ? '[削除済みのコメントです]' : reply.content}
                </p>

                {replyingTo?.id === reply.id && (
                    <div className="flex gap-2 mt-2">
                        <input
                            type="text"
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder="返信を入力..."
                            className="flex-1 text-sm px-3 py-1.5 rounded-lg border-2 border-black bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            onKeyDown={e => e.key === 'Enter' && submitReply(ratingId, reply.id)}
                            autoFocus
                        />
                        <button
                            onClick={() => submitReply(ratingId, reply.id)}
                            disabled={submitting || !replyText.trim()}
                            className="px-3 py-1.5 bg-primary text-white rounded-lg border-2 border-black text-sm disabled:opacity-50 hover:bg-primary/90 transition-colors"
                            style={{ boxShadow: '2px 2px 0 0 rgba(0,0,0,1)' }}
                        >
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {reply.children && reply.children.length > 0 && renderReplies(reply.children, ratingId, depth + 1)}
            </div>
        ));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <div
                className="relative w-full sm:max-w-xl max-h-[85vh] bg-background rounded-t-2xl sm:rounded-2xl border-2 border-black overflow-hidden flex flex-col"
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
                            <PixelPlayer config={pixelConfig} number={playerNumber} size={64} />
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
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sort Controls */}
                <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/50">
                    <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                    <button
                        onClick={() => setSortBy('likes')}
                        className={`text-xs px-3 py-1 rounded-full border-2 border-black transition-all ${sortBy === 'likes' ? 'bg-primary text-white' : 'bg-background hover:bg-muted'}`}
                        style={{ boxShadow: sortBy === 'likes' ? '2px 2px 0 0 rgba(0,0,0,1)' : 'none' }}
                    >
                        ❤️ いいね順
                    </button>
                    <button
                        onClick={() => setSortBy('newest')}
                        className={`text-xs px-3 py-1 rounded-full border-2 border-black transition-all ${sortBy === 'newest' ? 'bg-primary text-white' : 'bg-background hover:bg-muted'}`}
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
                            <div key={comment.id} className="bg-card rounded-lg border-2 border-black p-3 space-y-2" style={{ boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)' }}>
                                {/* Comment Header */}
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs text-white font-bold px-2 py-0.5 rounded ${getRatingColor(comment.score)}`}>
                                        {comment.score.toFixed(1)}
                                    </span>
                                    <span className={`text-sm font-medium ${comment.is_deleted ? 'text-muted-foreground line-through' : ''}`}>
                                        {comment.is_deleted ? '削除済みユーザー' : comment.user_name}
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-auto">
                                        {formatTime(comment.created_at)}
                                    </span>
                                </div>

                                {/* Comment Body */}
                                <p className={`text-sm leading-relaxed ${comment.is_deleted ? 'text-muted-foreground italic' : ''}`}>
                                    {comment.is_deleted ? '[削除済みのコメントです]' : comment.comment}
                                </p>

                                {/* Actions */}
                                {!comment.is_deleted && (
                                    <div className="flex items-center gap-3 pt-1 border-b border-black/5 pb-2">
                                        <button onClick={() => toggleLike(comment.id)} className={`flex items-center gap-1 text-xs transition-colors ${comment.user_has_liked ? 'text-red-500 font-bold' : 'text-muted-foreground hover:text-red-500'}`}>
                                            <Heart className={`w-3.5 h-3.5 ${comment.user_has_liked ? 'fill-current' : ''}`} />
                                            {comment.likes_count > 0 && comment.likes_count}
                                        </button>
                                        <button onClick={() => setReplyingTo(replyingTo?.id === comment.id ? null : { type: 'rating', id: comment.id, ratingId: comment.id })} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            <span>返信</span>
                                        </button>
                                        {user && (
                                            <div className="ml-auto flex items-center gap-3">
                                                <button onClick={() => setReportTarget({ type: 'rating', id: comment.id })} className="text-[10px] flex items-center gap-1 text-muted-foreground hover:text-red-500">
                                                    <AlertTriangle className="w-3 h-3" /> 報告
                                                </button>
                                                {(isAdmin || user.id === comment.user_id) && (
                                                    <button onClick={() => handleDelete('rating', comment.id)} className="text-[10px] flex items-center gap-1 text-red-500 hover:text-red-700">
                                                        <Trash2 className="w-3 h-3" /> 削除
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Main Reply Input */}
                                {replyingTo?.id === comment.id && replyingTo.type === 'rating' && (
                                    <div className="flex gap-2 mt-2">
                                        <input
                                            type="text"
                                            value={replyText}
                                            onChange={e => setReplyText(e.target.value)}
                                            placeholder="返信を入力..."
                                            className="flex-1 text-sm px-3 py-1.5 rounded-lg border-2 border-black bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                            onKeyDown={e => e.key === 'Enter' && submitReply(comment.id)}
                                            autoFocus
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

                                {/* Replies Tree */}
                                {comment.replies.length > 0 && (
                                    <div className="mt-2 ml-2 pl-2 border-l-2 border-black/10">
                                        {renderReplies(comment.replies, comment.id)}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Report Modal overlay */}
            {reportTarget && (
                <div className="absolute inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={e => e.stopPropagation()}>
                    <div className="bg-background rounded-xl border-2 border-black p-4 w-full max-w-sm" style={{ boxShadow: '4px 4px 0 0 rgba(0,0,0,1)' }}>
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            問題を報告
                        </h4>
                        <p className="text-xs text-muted-foreground mb-4">このコメントの問題点を選択してください。</p>

                        <div className="space-y-2 mb-4">
                            {['spam', 'inappropriate', 'harassment', 'other'].map(reason => (
                                <label key={reason} className="flex items-center gap-2 text-sm border-2 border-transparent hover:border-black/10 p-2 rounded cursor-pointer">
                                    <input
                                        type="radio"
                                        name="reportReason"
                                        value={reason}
                                        checked={reportReason === reason}
                                        onChange={e => setReportReason(e.target.value)}
                                        className="w-4 h-4 accent-red-600"
                                    />
                                    {reason === 'spam' && 'スパム・宣伝'}
                                    {reason === 'inappropriate' && '不適切な内容'}
                                    {reason === 'harassment' && '嫌がらせ・誹謗中傷'}
                                    {reason === 'other' && 'その他'}
                                </label>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setReportTarget(null)}
                                className="flex-1 py-1.5 text-sm font-bold border-2 border-black rounded-lg hover:bg-muted transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleReport}
                                disabled={isReporting}
                                className="flex-1 py-1.5 text-sm font-bold bg-red-600 text-white border-2 border-black rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {isReporting ? '送信中...' : '報告する'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
