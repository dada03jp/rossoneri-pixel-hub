'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Send, MessageCircle, Heart, Pencil, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PixelPlayer, PixelConfig } from '@/components/pixel-player';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PixelBurst, RatingSuccessPopup, AnimatedCounter, EmojiCrackerBurst, showPixelToast } from '@/components/pixel-effects';
import { createClient } from '@/lib/supabase/client';
import { useTeam } from '@/contexts/team-context';
import { User } from '@supabase/supabase-js';

// ── Types ──

interface PlayerInfo {
    id: string;
    name: string;
    number: number;
    position: string;
    pixel_config?: PixelConfig | null;
}

interface CommentData {
    id: string;
    user_id: string;
    user_name: string;
    score: number;
    comment: string;
    created_at: string;
    likes_count: number;
    user_has_liked: boolean;
    is_deleted?: boolean;
    is_edited?: boolean;
}

interface PlayerRatingSheetProps {
    isOpen: boolean;
    onClose: () => void;
    player: PlayerInfo | null;
    matchId: string;
    allPlayers: PlayerInfo[];
    user: User | null;
    onAuthAction: () => void;
    onSubmitRating: (playerId: string, score: number, comment: string) => Promise<void>;
    existingRating?: { score: number; comment: string } | null;
    averageRating: number | null;
    totalRatings: number;
    onNavigate: (playerId: string) => void;
    isHome: boolean;
}

// ── Helpers ──

function getScoreColor(value: number) {
    if (value >= 8) return 'text-emerald-600';
    if (value >= 6) return 'text-amber-600';
    if (value >= 4) return 'text-orange-500';
    return 'text-red-600';
}

function getScoreLabel(value: number) {
    if (value >= 9) return '最高';
    if (value >= 8) return '素晴らしい';
    if (value >= 7) return '良い';
    if (value >= 6) return '普通';
    if (value >= 5) return 'まあまあ';
    if (value >= 4) return '不調';
    return '最悪';
}

// ── Component ──

export function PlayerRatingSheet({
    isOpen, onClose, player, matchId, allPlayers,
    user, onAuthAction, onSubmitRating, existingRating,
    averageRating, totalRatings, onNavigate, isHome,
}: PlayerRatingSheetProps) {
    const [sliderValue, setSliderValue] = useState(existingRating?.score ?? 6.0);
    const [comment, setComment] = useState(existingRating?.comment ?? '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(!!existingRating);

    // ★ FIX #2: Effects are gated by a local flag, NOT by trigger count changes.
    // burstCount/emojiBurstCount are local to each render cycle and only
    // incremented inside handleSubmit. Since the entire card content
    // re-renders with a fresh useState(0) when player changes via key prop
    // on AnimatePresence, there's no cross-player leak.
    const [burstCount, setBurstCount] = useState(0);
    const [emojiBurstCount, setEmojiBurstCount] = useState(0);
    const [showPopup, setShowPopup] = useState(false);

    // Comments
    const [comments, setComments] = useState<CommentData[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [showAllComments, setShowAllComments] = useState(false);

    // ★ FIX #6: Comment edit/delete state
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editCommentText, setEditCommentText] = useState('');

    const { team: teamConfig } = useTeam();

    // Navigation
    const currentIndex = player ? allPlayers.findIndex(p => p.id === player.id) : -1;
    const prevPlayer = currentIndex > 0 ? allPlayers[currentIndex - 1] : null;
    const nextPlayer = currentIndex < allPlayers.length - 1 ? allPlayers[currentIndex + 1] : null;

    // Kit colors
    const kitColors = isHome
        ? { primary: teamConfig.kit.home.primary, secondary: teamConfig.kit.home.secondary }
        : { primary: teamConfig.kit.away.primary, secondary: teamConfig.kit.away.secondary };

    // Reset when player changes or sheet opens
    useEffect(() => {
        if (player && isOpen) {
            setSliderValue(existingRating?.score ?? 6.0);
            setComment(existingRating?.comment ?? '');
            setHasSubmitted(!!existingRating);
            setShowAllComments(false);
            setShowPopup(false);
            // Reset effect counters to 0 so they don't leak between players
            setBurstCount(0);
            setEmojiBurstCount(0);
            fetchComments(player.id);
        }
    }, [player?.id, isOpen]);

    useEffect(() => {
        if (existingRating) {
            setSliderValue(existingRating.score);
            setComment(existingRating.comment || '');
            setHasSubmitted(true);
        }
    }, [existingRating?.score]);

    const fetchComments = async (playerId: string) => {
        setCommentsLoading(true);
        try {
            const supabase = createClient();
            // ★ rating_comments から取得 (root commentのみ = parent_comment_id IS NULL)
            // rating_id を使って ratings から player_id を絞り込み
            const { data: ratingsForPlayer } = await supabase
                .from('ratings').select('id')
                .eq('match_id', matchId).eq('player_id', playerId);

            if (!ratingsForPlayer || ratingsForPlayer.length === 0) {
                setComments([]); setCommentsLoading(false); return;
            }

            const ratingIds = ratingsForPlayer.map(r => r.id);

            const { data: commentsData } = await supabase
                .from('rating_comments')
                .select('id, rating_id, user_id, user_name, comment, is_deleted, is_edited, parent_comment_id, created_at, ratings!inner(score)')
                .in('rating_id', ratingIds)
                .is('parent_comment_id', null) // root comments only
                .order('created_at', { ascending: false });

            if (!commentsData) { setComments([]); setCommentsLoading(false); return; }

            // ★ likes は root comment のみ対象。reply には likes を付けない/読まない。
            const commentIds = commentsData.map(c => c.id);
            let likesMap: Record<string, number> = {};
            let userLikedSet = new Set<string>();

            if (commentIds.length > 0) {
                const { data: likes } = await supabase
                    .from('comment_likes').select('*')
                    .in('comment_id', commentIds); // ★ comment_id を唯一の参照先として使用
                if (likes) {
                    likes.forEach((l: any) => {
                        likesMap[l.comment_id] = (likesMap[l.comment_id] || 0) + 1;
                        if (user && l.user_id === user.id) userLikedSet.add(l.comment_id);
                    });
                }
            }

            const mapped: CommentData[] = commentsData
                .map((r: any) => ({
                    id: r.id,
                    user_id: r.user_id,
                    user_name: r.user_name || 'ミラニスタ',
                    score: r.ratings?.score || 0,
                    comment: r.is_deleted ? '削除されたコメントです' : (r.comment || ''),
                    created_at: r.created_at,
                    likes_count: likesMap[r.id] || 0,
                    user_has_liked: userLikedSet.has(r.id),
                    is_deleted: !!r.is_deleted,
                    is_edited: !!r.is_edited,
                }))
                .filter(r => {
                    if (r.is_deleted) return true;
                    return r.comment && r.comment.trim().length > 0;
                });

            mapped.sort((a, b) => b.likes_count - a.likes_count || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setComments(mapped);
        } catch (e) {
            console.error('Error fetching comments:', e);
        }
        setCommentsLoading(false);
    };

    const handleSubmit = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!player) return;
        if (!user) { onAuthAction(); return; }
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onSubmitRating(player.id, sliderValue, comment);
            setHasSubmitted(true);
            // ★ Only fire effects HERE — not on player switch
            setBurstCount(prev => prev + 1);
            setEmojiBurstCount(prev => prev + 1);
            setShowPopup(true);
            showPixelToast(`${player.name} に ${sliderValue.toFixed(1)} を投稿しました`);
            setTimeout(() => setShowPopup(false), 1500);
            fetchComments(player.id);
        } catch (error) {
            console.error('Submit failed', error);
            showPixelToast('投稿に失敗しました', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ★ likes は root comment のみ。comment_id を唯一の参照先として使用。
    const handleLike = async (commentId: string) => {
        if (!user) { onAuthAction(); return; }
        const supabase = createClient();
        const target = comments.find(c => c.id === commentId);
        if (!target) return;

        if (target.user_has_liked) {
            await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id);
            setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes_count: c.likes_count - 1, user_has_liked: false } : c));
        } else {
            await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: user.id });
            setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes_count: c.likes_count + 1, user_has_liked: true } : c));
        }
    };

    // ★ コメント編集: rating_comments テーブルを更新
    // タイムスタンプルール: is_edited=true, edited_at=NOW(), updated_at=NOW()
    const handleEditComment = async (commentId: string) => {
        if (!editCommentText.trim()) return;
        const supabase = createClient();
        await supabase.from('rating_comments').update({
            comment: editCommentText.trim(),
            is_edited: true,
            edited_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }).eq('id', commentId);
        setComments(prev => prev.map(c =>
            c.id === commentId ? { ...c, comment: editCommentText.trim(), is_edited: true } : c
        ));
        setEditingCommentId(null);
        setEditCommentText('');
    };

    // ★ コメント削除: rating_comments テーブルを soft delete
    // タイムスタンプルール: is_deleted=true, deleted_at=NOW(), updated_at=NOW()
    // comment は tombstone テキストに置換
    const handleDeleteComment = async (commentId: string) => {
        const supabase = createClient();
        await supabase.from('rating_comments').update({
            is_deleted: true,
            comment: '削除されたコメントです',
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }).eq('id', commentId);
        setComments(prev => prev.map(c =>
            c.id === commentId ? { ...c, comment: '削除されたコメントです', is_deleted: true } : c
        ));
        // Reset comment field so user can re-post
        if (user && comments.find(c => c.id === commentId)?.user_id === user.id) {
            setComment('');
        }
    };

    if (!isOpen || !player) return null;

    const displayComments = showAllComments ? comments : comments.slice(0, 2);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
                onClick={onClose}
            />

            {/* Centered card container */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={player.id}
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="pointer-events-auto w-full max-w-md bg-white rounded-[16px] border border-black/[0.08] shadow-2xl overflow-hidden relative"
                        style={{
                            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.02) 1px, transparent 1px)',
                            backgroundSize: '10px 10px',
                        }}
                    >
                        {/* Sequential nav — top bar */}
                        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-black/[0.04]">
                            <button
                                onClick={() => prevPlayer && onNavigate(prevPlayer.id)}
                                disabled={!prevPlayer}
                                className="flex items-center gap-1 text-xs text-muted-foreground disabled:opacity-20 hover:text-foreground transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">{prevPlayer?.name.split(' ').pop()}</span>
                            </button>
                            <span className="text-[11px] text-muted-foreground tabular-nums">
                                {currentIndex + 1} / {allPlayers.length}
                            </span>
                            <button
                                onClick={() => nextPlayer && onNavigate(nextPlayer.id)}
                                disabled={!nextPlayer}
                                className="flex items-center gap-1 text-xs text-muted-foreground disabled:opacity-20 hover:text-foreground transition-colors"
                            >
                                <span className="hidden sm:inline">{nextPlayer?.name.split(' ').pop()}</span>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] transition-colors z-20"
                        >
                            <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>

                        {/* ─── Card body ─── */}
                        <div className="p-4 sm:p-5 relative overflow-visible">
                            {/* Player header — like old MatchRatingCard */}
                            <div className="flex items-center gap-3 mb-4">
                                <motion.div
                                    animate={{ y: [0, -3, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                    className="flex-shrink-0"
                                >
                                    {player.pixel_config ? (
                                        <div style={{ imageRendering: 'pixelated' as any }}>
                                            <PixelPlayer config={player.pixel_config as PixelConfig} number={player.number} size={64} kitColors={kitColors} />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 rounded-full bg-black/[0.04] flex items-center justify-center text-xl font-bold text-muted-foreground">
                                            {player.number}
                                        </div>
                                    )}
                                </motion.div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm sm:text-base truncate">{player.name}</p>
                                    <p className="text-xs text-muted-foreground">#{player.number} {player.position}</p>
                                </div>
                                {averageRating !== null && (
                                    <div className="text-right flex-shrink-0">
                                        <AnimatedCounter
                                            value={averageRating}
                                            className={`text-xl sm:text-2xl font-bold ${getScoreColor(averageRating)}`}
                                        />
                                        <span className="text-[10px] text-muted-foreground block">{totalRatings}件</span>
                                    </div>
                                )}
                            </div>

                            {/* PixelBurst — contained within this card */}
                            <PixelBurst
                                trigger={burstCount}
                                colors={[teamConfig.colors.primary, teamConfig.colors.accent]}
                            />
                            <RatingSuccessPopup show={showPopup} score={sliderValue} />

                            {/* Rating slider area */}
                            <div className="space-y-3 pt-3 border-t border-black/[0.04]">
                                <div className="flex items-center justify-between">
                                    <span className={`text-2xl sm:text-3xl font-bold tabular-nums ${getScoreColor(sliderValue)}`}>
                                        {sliderValue.toFixed(1)}
                                    </span>
                                    <motion.span
                                        key={getScoreLabel(sliderValue)}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className={`text-xs px-2.5 py-1 rounded-full ${getScoreColor(sliderValue)} bg-black/[0.03]`}
                                    >
                                        {getScoreLabel(sliderValue)}
                                    </motion.span>
                                </div>

                                <Slider
                                    value={[sliderValue]}
                                    min={1}
                                    max={10}
                                    step={0.5}
                                    onValueChange={(v) => setSliderValue(v[0])}
                                    className="w-full"
                                />

                                <div className="flex gap-2">
                                    <Input
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="コメント（任意）"
                                        className="text-sm h-9 rounded-[10px] border-black/[0.08]"
                                        onClick={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e as any); }}
                                    />
                                    <motion.div whileTap={{ scale: 0.9 }} className="relative flex-shrink-0">
                                        <Button
                                            size="sm"
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className="h-9 px-3 text-sm rounded-[10px] text-white"
                                            style={{ backgroundColor: teamConfig.colors.accent }}
                                        >
                                            {isSubmitting ? '...' : hasSubmitted ? '✓ 更新' : <Send className="w-3.5 h-3.5" />}
                                        </Button>
                                        <EmojiCrackerBurst trigger={emojiBurstCount} score={sliderValue} />
                                    </motion.div>
                                </div>
                            </div>

                            {/* Login prompt */}
                            {!user && (
                                <button
                                    onClick={onAuthAction}
                                    className="w-full mt-3 text-center text-sm text-muted-foreground bg-black/[0.02] rounded-[12px] py-3 hover:bg-black/[0.04] transition-colors"
                                >
                                    ログインして採点に参加 →
                                </button>
                            )}
                        </div>

                        {/* ─── Comments section ─── */}
                        {(comments.length > 0 || commentsLoading) && (
                            <div className="px-4 sm:px-5 py-3 border-t border-black/[0.04] max-h-[200px] overflow-y-auto">
                                <div className="flex items-center gap-1.5 text-xs font-medium mb-2.5">
                                    <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
                                    コメント
                                    {comments.length > 0 && (
                                        <span className="text-[10px] text-muted-foreground bg-black/[0.04] px-1.5 py-0.5 rounded-full">{comments.length}</span>
                                    )}
                                </div>

                                {commentsLoading && (
                                    <div className="flex justify-center py-3">
                                        <div className="w-4 h-4 border-2 border-black/[0.08] border-t-black/30 rounded-full animate-spin" />
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    {displayComments.map(c => (
                                        <div key={c.id} className={`rounded-[8px] px-2.5 py-2 ${
                                            c.is_deleted ? 'bg-black/[0.01] opacity-50' : 'bg-black/[0.02]'
                                        }`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-[11px]">
                                                    <span className="font-medium">{c.user_name}</span>
                                                    <span className={`font-bold tabular-nums ${getScoreColor(c.score)}`}>{c.score.toFixed(1)}</span>
                                                    {c.is_edited && !c.is_deleted && (
                                                        <span className="text-[9px] text-muted-foreground">(編集済み)</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {/* Edit/Delete for own comments */}
                                                    {user && c.user_id === user.id && !c.is_deleted && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingCommentId(c.id);
                                                                    setEditCommentText(c.comment);
                                                                }}
                                                                className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                                                                title="編集"
                                                            >
                                                                <Pencil className="w-2.5 h-2.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteComment(c.id)}
                                                                className="p-0.5 text-muted-foreground hover:text-red-500 transition-colors"
                                                                title="削除"
                                                            >
                                                                <Trash2 className="w-2.5 h-2.5" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {/* Like */}
                                                    {!c.is_deleted && (
                                                        <button
                                                            onClick={() => handleLike(c.id)}
                                                            className={`flex items-center gap-0.5 text-[11px] transition-colors ${
                                                                c.user_has_liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
                                                            }`}
                                                        >
                                                            <Heart className={`w-3 h-3 ${c.user_has_liked ? 'fill-current' : ''}`} />
                                                            {c.likes_count > 0 && c.likes_count}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Inline edit mode */}
                                            {editingCommentId === c.id ? (
                                                <div className="flex gap-1.5 mt-1">
                                                    <Input
                                                        value={editCommentText}
                                                        onChange={(e) => setEditCommentText(e.target.value)}
                                                        className="text-xs h-7 rounded-md border-black/[0.08] flex-1"
                                                        onKeyDown={(e) => { if (e.key === 'Enter') handleEditComment(c.id); }}
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleEditComment(c.id)}
                                                        className="p-1 text-emerald-600 hover:text-emerald-700"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => { setEditingCommentId(null); setEditCommentText(''); }}
                                                        className="p-1 text-muted-foreground hover:text-foreground"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <p className={`text-xs mt-0.5 ${
                                                    c.is_deleted ? 'italic text-muted-foreground' : 'text-foreground/80'
                                                }`}>{c.comment}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {comments.length > 2 && !showAllComments && (
                                    <button
                                        onClick={() => setShowAllComments(true)}
                                        className="w-full text-[11px] text-muted-foreground hover:text-foreground text-center py-2 mt-1.5 transition-colors"
                                    >
                                        すべてのコメント ({comments.length - 2}件)
                                    </button>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </>
    );
}
