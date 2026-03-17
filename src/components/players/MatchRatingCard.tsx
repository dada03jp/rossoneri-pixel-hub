'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PixelPlayer, PixelConfig } from '@/components/pixel-player';
import { cn } from '@/lib/utils';
import { Send } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PixelBurst, RatingSuccessPopup, AnimatedCounter, showPixelToast, EmojiCrackerBurst } from '@/components/pixel-effects';
import { useTeam } from '@/contexts/team-context';

interface ProcessedComment {
    id: string;
    userName: string;
    comment: string;
    score: number;
    createdAt: string;
    likesCount?: number;
}

interface MatchRatingCardProps {
    name: string;
    number: number;
    position: string;
    pixelConfig: PixelConfig;
    className?: string;
    averageRating: number | null;
    totalRatings?: number;
    recentRatings?: number[];
    initialRating?: number;
    initialComment?: string;
    onSubmit?: (rating: number, comment: string) => Promise<void>;
    isInteractive?: boolean;
    isLoading?: boolean;
    isGuest?: boolean;
    onAuthAction?: () => void;
    comments?: ProcessedComment[];
    onLikeComment?: (commentId: string) => void;
}

function getScoreColor(value: number) {
    if (value >= 8) return 'text-green-600';
    if (value >= 6) return 'text-yellow-600';
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

export function MatchRatingCard({
    name,
    number,
    position,
    pixelConfig,
    className,
    averageRating,
    totalRatings = 0,
    initialRating = 6.0,
    initialComment = '',
    onSubmit,
    isInteractive = false,
    isLoading = false,
    isGuest = false,
    onAuthAction,
}: MatchRatingCardProps) {
    const [sliderValue, setSliderValue] = useState(initialRating);
    const [comment, setComment] = useState(initialComment);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    // 数値インクリメントでエフェクト再トリガー (boolean だとリセット問題が起きる)
    const [burstCount, setBurstCount] = useState(0);
    const [emojiBurstCount, setEmojiBurstCount] = useState(0);
    const [showPopup, setShowPopup] = useState(false);
    const { team: teamConfig } = useTeam();

    const handleSubmit = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isGuest && onAuthAction) { onAuthAction(); return; }
        if (!onSubmit || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await onSubmit(sliderValue, comment);
            setHasSubmitted(true);
            // エフェクト発火: カウントをインクリメント
            setBurstCount(prev => prev + 1);
            setEmojiBurstCount(prev => prev + 1);
            setShowPopup(true);
            setComment('');
            showPixelToast(`${name} に ${sliderValue.toFixed(1)} を投稿しました`);
            setTimeout(() => setShowPopup(false), 1500);
        } catch (error) {
            console.error('Submit failed', error);
            showPixelToast('投稿に失敗しました', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            className={cn(
                'bg-white rounded-lg p-3 sm:p-4 border-2 border-black',
                'transition-all duration-200 relative overflow-visible',
                className
            )}
            style={{
                boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)',
                backgroundSize: '8px 8px',
                imageRendering: 'pixelated' as React.CSSProperties['imageRendering'],
            }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
        >
            {/* Header */}
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
                <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex-shrink-0"
                >
                    <PixelPlayer config={pixelConfig} number={number} size={56} />
                </motion.div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs sm:text-sm truncate">{name}</p>
                    <p className="text-[10px] sm:text-xs text-gray-400">#{number} {position}</p>
                </div>
                {averageRating !== null && (
                    <div className="text-right flex-shrink-0">
                        <AnimatedCounter
                            value={averageRating}
                            className={`text-lg sm:text-xl ${getScoreColor(averageRating)}`}
                        />
                        <span className="text-[10px] text-gray-400 block">{totalRatings}件</span>
                    </div>
                )}
            </div>

            {/* Pixel Burst Effect — 数値トリガーで確実に発火 */}
            <PixelBurst
                trigger={burstCount}
                colors={[teamConfig.colors.primary, teamConfig.colors.accent]}
            />
            <RatingSuccessPopup show={showPopup} score={sliderValue} />

            {/* Rating Slider */}
            {isInteractive && (
                <div className="space-y-2 sm:space-y-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <span className={`text-xl sm:text-2xl font-bold font-mono ${getScoreColor(sliderValue)}`}>
                            {sliderValue.toFixed(1)}
                        </span>
                        <motion.span
                            key={getScoreLabel(sliderValue)}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`text-[10px] sm:text-xs px-2 py-0.5 rounded ${getScoreColor(sliderValue)} bg-gray-50`}
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
                            className="text-xs h-8"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <motion.div whileTap={{ scale: 0.9 }} className="relative">
                            <Button
                                size="sm"
                                onClick={handleSubmit}
                                disabled={isSubmitting || isLoading}
                                className="h-8 px-3 text-xs"
                            >
                                {isSubmitting ? '...' : hasSubmitted ? '✓' : <Send className="w-3 h-3" />}
                            </Button>
                            <EmojiCrackerBurst trigger={emojiBurstCount} score={sliderValue} />
                        </motion.div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
