'use client';

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PixelPlayer, PixelConfig } from './pixel-player';
import { Star, Send, MessageSquare, ChevronDown, ChevronUp, ThumbsUp } from 'lucide-react';

interface Comment {
    id: string;
    userName: string;
    score: number;
    comment: string;
    likesCount: number;
    hasLiked: boolean;
}

interface PlayerRatingCardProps {
    playerId: string;
    playerName: string;
    playerNumber: number;
    position: string;
    pixelConfig: PixelConfig;
    averageRating?: number;
    totalRatings?: number;
    userRating?: number;
    userComment?: string;
    onSubmitRating?: (playerId: string, score: number, comment: string) => void;
    disabled?: boolean;
    comments?: Comment[];
    onLikeComment?: (commentId: string) => void;
}

export function PlayerRatingCard({
    playerId,
    playerName,
    playerNumber,
    position,
    pixelConfig,
    averageRating,
    totalRatings = 0,
    userRating,
    userComment = '',
    onSubmitRating,
    disabled = false,
    comments = [],
    onLikeComment,
}: PlayerRatingCardProps) {
    const [score, setScore] = useState<number>(userRating ?? 6.0);
    const [comment, setComment] = useState(userComment);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(!!userRating);
    const [showComments, setShowComments] = useState(false);

    const handleSubmit = async () => {
        if (!onSubmitRating || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onSubmitRating(playerId, score, comment);
            setHasSubmitted(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getScoreColor = (value: number) => {
        if (value >= 8) return 'text-green-600';
        if (value >= 6) return 'text-yellow-600';
        if (value >= 4) return 'text-orange-500';
        return 'text-red-600';
    };

    const getScoreLabel = (value: number) => {
        if (value >= 9) return '最高';
        if (value >= 8) return '素晴らしい';
        if (value >= 7) return '良い';
        if (value >= 6) return '普通';
        if (value >= 5) return 'まあまあ';
        if (value >= 4) return '不調';
        return '最悪';
    };

    // コメント付きの評価のみをフィルター
    const commentsWithText = comments.filter(c => c.comment && c.comment.trim());

    return (
        <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
            <div className="flex items-start gap-4">
                {/* Player Pixel Avatar */}
                <PixelPlayer config={pixelConfig} number={playerNumber} size={64} />

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {position}
                        </span>
                        <span className="text-xs text-muted-foreground">#{playerNumber}</span>
                    </div>
                    <h3 className="font-bold text-lg truncate">{playerName}</h3>

                    {/* Average Rating Display (中央に表示) */}
                    {averageRating !== undefined && (
                        <div className="flex items-center gap-2 mt-1">
                            <Star className="w-4 h-4 text-primary fill-primary" />
                            <span className={`font-bold ${getScoreColor(averageRating)}`}>
                                {averageRating.toFixed(1)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                ({totalRatings}件の評価)
                            </span>
                        </div>
                    )}
                </div>

                {/* Current Score Preview (右側に自分の点数) */}
                <div className="text-right">
                    <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                        {score.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {hasSubmitted ? 'あなたの評価' : getScoreLabel(score)}
                    </div>
                </div>
            </div>

            {/* Rating Slider */}
            <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-8">1.0</span>
                    <Slider
                        value={[score]}
                        onValueChange={(value) => setScore(value[0])}
                        min={1}
                        max={10}
                        step={0.5}
                        disabled={disabled}
                        className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground w-8 text-right">10.0</span>
                </div>

                {/* Comment Input */}
                <div className="flex gap-2">
                    <Input
                        placeholder="コメントを入力（任意）"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={100}
                        disabled={disabled}
                        className="flex-1"
                    />
                    <Button
                        onClick={handleSubmit}
                        disabled={disabled || isSubmitting}
                        size="sm"
                        className="gap-1"
                    >
                        <Send className="w-4 h-4" />
                        {hasSubmitted ? '更新' : '送信'}
                    </Button>
                </div>

                {hasSubmitted && (
                    <p className="text-xs text-green-600">✓ 評価を送信しました</p>
                )}
            </div>

            {/* コメント一覧 */}
            {commentsWithText.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                        <MessageSquare className="w-3 h-3" />
                        その他のコメント ({commentsWithText.length}件)
                        {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {showComments && (
                        <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                            {commentsWithText.map(c => (
                                <div key={c.id} className="bg-muted/30 rounded-lg p-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-xs">{c.userName || '匿名'}</span>
                                            <span className={`text-xs font-bold ${getScoreColor(c.score)}`}>
                                                {c.score.toFixed(1)}点
                                            </span>
                                        </div>
                                        {onLikeComment && (
                                            <button
                                                onClick={() => onLikeComment(c.id)}
                                                className={`flex items-center gap-1 text-xs ${c.hasLiked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                                                    }`}
                                            >
                                                <ThumbsUp className="w-3 h-3" />
                                                {c.likesCount > 0 && c.likesCount}
                                            </button>
                                        )}
                                    </div>
                                    <p className="mt-1 text-muted-foreground">{c.comment}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default PlayerRatingCard;

