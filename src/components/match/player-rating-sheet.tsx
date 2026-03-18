'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Send, MessageCircle, Heart } from 'lucide-react';
import { PixelPlayer, PixelConfig } from '@/components/pixel-player';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PixelBurst, RatingSuccessPopup, EmojiCrackerBurst, showPixelToast } from '@/components/pixel-effects';
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
}

// ── Helpers ──

function getScoreColor(value: number) {
    if (value >= 8) return 'text-emerald-600';
    if (value >= 6) return 'text-amber-600';
    if (value >= 4) return 'text-orange-500';
    return 'text-red-600';
}

function getScoreBg(value: number) {
    if (value >= 8) return 'bg-emerald-500';
    if (value >= 6) return 'bg-amber-500';
    if (value >= 4) return 'bg-orange-500';
    return 'bg-red-500';
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
    averageRating, totalRatings, onNavigate,
}: PlayerRatingSheetProps) {
    const [sliderValue, setSliderValue] = useState(existingRating?.score ?? 6.0);
    const [comment, setComment] = useState(existingRating?.comment ?? '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(!!existingRating);

    // Effects — only triggered by actual submission, NOT by player navigation
    const [burstCount, setBurstCount] = useState(0);
    const [emojiBurstCount, setEmojiBurstCount] = useState(0);
    const [showPopup, setShowPopup] = useState(false);
    // Track player ID to prevent effects on navigation
    const lastSubmittedPlayerRef = useRef<string | null>(null);

    // Comments
    const [comments, setComments] = useState<CommentData[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [showAllComments, setShowAllComments] = useState(false);

    const { team: teamConfig } = useTeam();

    // Navigation
    const currentIndex = player ? allPlayers.findIndex(p => p.id === player.id) : -1;
    const prevPlayer = currentIndex > 0 ? allPlayers[currentIndex - 1] : null;
    const nextPlayer = currentIndex < allPlayers.length - 1 ? allPlayers[currentIndex + 1] : null;

    // Reset state on player change — WITHOUT triggering effects
    useEffect(() => {
        if (player && isOpen) {
            setSliderValue(existingRating?.score ?? 6.0);
            setComment(existingRating?.comment ?? '');
            setHasSubmitted(!!existingRating);
            setShowAllComments(false);
            setShowPopup(false);
            // DON'T reset burstCount/emojiBurstCount — they only increment on submit
            fetchComments(player.id);
        }
    }, [player?.id, isOpen]);

    // When existingRating changes (e.g. after submit + rerender), update slider
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
            const { data: ratingsData } = await supabase
                .from('ratings').select('*')
                .eq('match_id', matchId).eq('player_id', playerId)
                .not('comment', 'is', null);

            if (!ratingsData) { setComments([]); setCommentsLoading(false); return; }

            const ratingIds = ratingsData.map(r => r.id);
            let likesMap: Record<string, number> = {};
            let userLikedSet = new Set<string>();

            if (ratingIds.length > 0) {
                const { data: likes } = await supabase
                    .from('comment_likes').select('*').in('rating_id', ratingIds);
                if (likes) {
                    likes.forEach(l => {
                        likesMap[l.rating_id] = (likesMap[l.rating_id] || 0) + 1;
                        if (user && l.user_id === user.id) userLikedSet.add(l.rating_id);
                    });
                }
            }

            const mapped: CommentData[] = ratingsData
                .filter(r => r.comment && r.comment.trim().length > 0 && !r.is_deleted)
                .map(r => ({
                    id: r.id,
                    user_id: r.user_id,
                    user_name: r.user_name || 'ミラニスタ',
                    score: r.score,
                    comment: r.comment || '',
                    created_at: r.created_at,
                    likes_count: likesMap[r.id] || 0,
                    user_has_liked: userLikedSet.has(r.id),
                }));

            mapped.sort((a, b) => b.likes_count - a.likes_count || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setComments(mapped);
        } catch (e) {
            console.error('Error fetching comments:', e);
        }
        setCommentsLoading(false);
    };

    const handleSubmit = async () => {
        if (!player) return;
        if (!user) { onAuthAction(); return; }
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onSubmitRating(player.id, sliderValue, comment);
            setHasSubmitted(true);
            lastSubmittedPlayerRef.current = player.id;

            // Only fire effects on actual submission
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

    const handleLike = async (commentId: string) => {
        if (!user) { onAuthAction(); return; }
        const supabase = createClient();
        const target = comments.find(c => c.id === commentId);
        if (!target) return;

        if (target.user_has_liked) {
            await supabase.from('comment_likes').delete().eq('rating_id', commentId).eq('user_id', user.id);
            setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes_count: c.likes_count - 1, user_has_liked: false } : c));
        } else {
            await supabase.from('comment_likes').insert({ rating_id: commentId, user_id: user.id });
            setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes_count: c.likes_count + 1, user_has_liked: true } : c));
        }
    };

    if (!isOpen || !player) return null;

    const displayComments = showAllComments ? comments : comments.slice(0, 2);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
            />

            {/* Sheet — bottom on mobile, right panel on desktop */}
            <div
                className="fixed z-50
                    bottom-0 left-0 right-0 max-h-[80vh] rounded-t-[20px]
                    md:bottom-auto md:top-0 md:left-auto md:right-0 md:max-h-full md:h-full md:w-[440px] md:rounded-t-none md:rounded-l-[20px]
                    bg-white shadow-2xl overflow-y-auto overscroll-contain"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                {/* Mobile drag handle */}
                <div className="md:hidden flex justify-center pt-3 pb-1 sticky top-0 z-20 bg-white">
                    <div className="w-10 h-1 rounded-full bg-black/10" />
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 md:top-4 md:right-4 p-2 rounded-full hover:bg-black/[0.04] transition-colors z-30"
                >
                    <X className="w-4 h-4 text-muted-foreground" />
                </button>

                {/* ─── Player Hero (left-right layout on desktop, stacked on mobile) ─── */}
                <div className="px-5 pt-4 pb-3 md:pt-6">
                    {/* Navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => prevPlayer && onNavigate(prevPlayer.id)}
                            disabled={!prevPlayer}
                            className="flex items-center gap-1 text-xs text-muted-foreground disabled:opacity-20 hover:text-foreground transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">{prevPlayer?.name.split(' ').pop() || ''}</span>
                        </button>
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                            {currentIndex + 1} / {allPlayers.length}
                        </span>
                        <button
                            onClick={() => nextPlayer && onNavigate(nextPlayer.id)}
                            disabled={!nextPlayer}
                            className="flex items-center gap-1 text-xs text-muted-foreground disabled:opacity-20 hover:text-foreground transition-colors"
                        >
                            <span className="hidden sm:inline">{nextPlayer?.name.split(' ').pop() || ''}</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Player info + Community rating — side by side */}
                    <div className="flex gap-4">
                        {/* Left: player icon + name */}
                        <div className="flex flex-col items-center gap-1.5 flex-shrink-0" style={{ width: '100px' }}>
                            {player.pixel_config ? (
                                <div className="w-16 h-16 sm:w-20 sm:h-20" style={{ imageRendering: 'pixelated' as any }}>
                                    <PixelPlayer config={player.pixel_config as PixelConfig} number={player.number} size={80} />
                                </div>
                            ) : (
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/[0.04] flex items-center justify-center text-xl font-bold text-muted-foreground">
                                    {player.number}
                                </div>
                            )}
                            <div className="text-center">
                                <p className="text-sm font-bold leading-tight">{player.name}</p>
                                <p className="text-[11px] text-muted-foreground">#{player.number} {player.position}</p>
                            </div>
                        </div>

                        {/* Right: ratings area */}
                        <div className="flex-1 min-w-0 space-y-3">
                            {/* Community rating */}
                            {averageRating !== null && (
                                <div className="bg-black/[0.02] rounded-[12px] px-3 py-2.5">
                                    <p className="text-[11px] text-muted-foreground mb-1">みんなの評価</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-2xl font-bold tabular-nums ${getScoreColor(averageRating)}`}>
                                            {averageRating.toFixed(1)}
                                        </span>
                                        <div className="flex-1 h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${getScoreBg(averageRating)}`}
                                                style={{ width: `${(averageRating / 10) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[11px] text-muted-foreground">{totalRatings}件</span>
                                    </div>
                                </div>
                            )}

                            {/* Your rating summary */}
                            <div className={`rounded-[12px] px-3 py-2.5 ${hasSubmitted ? 'bg-emerald-50 border border-emerald-100' : 'bg-black/[0.02]'}`}>
                                <p className="text-[11px] text-muted-foreground mb-1">あなたの評価</p>
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-2xl font-bold tabular-nums ${getScoreColor(sliderValue)}`}>
                                        {sliderValue.toFixed(1)}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getScoreColor(sliderValue)} bg-black/[0.03]`}>
                                        {getScoreLabel(sliderValue)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Rating Controls ─── */}
                <div className="px-5 py-4 border-t border-black/[0.04] space-y-3 relative overflow-visible">
                    {/* Slider */}
                    <div>
                        <Slider
                            value={[sliderValue]}
                            min={1}
                            max={10}
                            step={0.5}
                            onValueChange={(v) => setSliderValue(v[0])}
                            className="w-full"
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground/50 mt-1 tabular-nums px-0.5">
                            <span>1.0</span>
                            <span>5.0</span>
                            <span>10.0</span>
                        </div>
                    </div>

                    {/* Comment input + submit */}
                    <div className="flex gap-2">
                        <Input
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="コメント（任意）"
                            className="text-sm h-10 rounded-[10px] border-black/[0.08]"
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                        />
                        <div className="relative flex-shrink-0">
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="h-10 px-4 rounded-[10px] text-white"
                                style={{ backgroundColor: teamConfig.colors.accent }}
                            >
                                {isSubmitting ? '...' : hasSubmitted ? '✓ 更新' : <Send className="w-4 h-4" />}
                            </Button>
                            <EmojiCrackerBurst trigger={emojiBurstCount} score={sliderValue} />
                        </div>
                    </div>

                    {/* Effects — only fire on actual submit */}
                    <PixelBurst
                        trigger={burstCount}
                        colors={[teamConfig.colors.primary, teamConfig.colors.accent]}
                    />
                    <RatingSuccessPopup show={showPopup} score={sliderValue} />

                    {/* Login prompt */}
                    {!user && (
                        <button
                            onClick={onAuthAction}
                            className="w-full text-center text-sm text-muted-foreground bg-black/[0.02] rounded-[12px] py-3 hover:bg-black/[0.04] transition-colors"
                        >
                            ログインして採点に参加 →
                        </button>
                    )}
                </div>

                {/* ─── Comments ─── */}
                <div className="px-5 py-4 border-t border-black/[0.04]">
                    <div className="flex items-center gap-1.5 text-sm font-medium mb-3">
                        <MessageCircle className="w-4 h-4 text-muted-foreground" />
                        コメント
                        {comments.length > 0 && (
                            <span className="text-[11px] text-muted-foreground bg-black/[0.04] px-1.5 py-0.5 rounded-full">{comments.length}</span>
                        )}
                    </div>

                    {comments.length === 0 && !commentsLoading && (
                        <p className="text-xs text-muted-foreground text-center py-4">
                            まだコメントはありません。<br />
                            <span className="text-muted-foreground/50">採点時にコメントを残してみましょう</span>
                        </p>
                    )}

                    {commentsLoading && (
                        <div className="flex justify-center py-4">
                            <div className="w-5 h-5 border-2 border-black/[0.08] border-t-black/30 rounded-full animate-spin" />
                        </div>
                    )}

                    <div className="space-y-2">
                        {displayComments.map(c => (
                            <div key={c.id} className="bg-black/[0.02] rounded-[10px] px-3 py-2.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="font-medium">{c.user_name}</span>
                                        <span className={`font-bold tabular-nums ${getScoreColor(c.score)}`}>{c.score.toFixed(1)}</span>
                                    </div>
                                    <button
                                        onClick={() => handleLike(c.id)}
                                        className={`flex items-center gap-0.5 text-xs transition-colors ${
                                            c.user_has_liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
                                        }`}
                                    >
                                        <Heart className={`w-3 h-3 ${c.user_has_liked ? 'fill-current' : ''}`} />
                                        {c.likes_count > 0 && c.likes_count}
                                    </button>
                                </div>
                                <p className="text-sm mt-1 text-foreground/80">{c.comment}</p>
                            </div>
                        ))}
                    </div>

                    {comments.length > 2 && !showAllComments && (
                        <button
                            onClick={() => setShowAllComments(true)}
                            className="w-full text-xs text-muted-foreground hover:text-foreground text-center py-2.5 mt-2 border border-black/[0.06] rounded-[10px] transition-colors"
                        >
                            すべてのコメントを見る ({comments.length - 2}件)
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
