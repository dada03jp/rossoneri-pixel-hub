'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PixelPlayer, PixelConfig } from '@/components/pixel-player';
import { cn } from '@/lib/utils';
import { Star, Send } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PixelBurst, RatingSuccessPopup, AnimatedCounter } from '@/components/pixel-effects';
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
    const [showBurst, setShowBurst] = useState(false);
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
            setShowBurst(true);
            setShowPopup(true);
            setComment('');
            // ポップアップ自動消去
            setTimeout(() => setShowPopup(false), 1500);
        } catch (error) {
            console.error('Submit failed', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            className={cn(
                'bg-white rounded-lg p-4 border-2 border-black',
                'transition-all duration-200 relative overflow-hidden',
                className
            )}
            style={{
                boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)',
                backgroundSize: '8px 8px',
                imageRendering: 'pixelated' as any,
            }}
            whileHover={{ y: -3 }}
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
                <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <PixelPlayer config={pixelConfig} number={number} size={64} />
                </motion.div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{name}</p>
                    <p className="text-xs text-gray-400">#{number} {position}</p>
                </div>
                {averageRating !== null && (
                    <div className="text-right">
                        <AnimatedCounter
                            value={averageRating}
                            className={`text-xl ${getScoreColor(averageRating)}`}
                        />
                        <span className="text-[10px] text-gray-400 block">{totalRatings}件</span>
                    </div>
                )}
            </div>

            {/* Pixel Burst Effect */}
            <PixelBurst
                trigger={showBurst}
                colors={[teamConfig.colors.primary, teamConfig.colors.accent]}
                originX={0}
                originY={0}
                onComplete={() => setShowBurst(false)}
            />
            <RatingSuccessPopup show={showPopup} score={sliderValue} />

            {/* Rating Slider */}
            {isInteractive && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <span className={`text-2xl font-bold font-mono ${getScoreColor(sliderValue)}`}>
                            {sliderValue.toFixed(1)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${getScoreColor(sliderValue)} bg-gray-50`}>
                            {getScoreLabel(sliderValue)}
                        </span>
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
                        <Button
                            size="sm"
                            onClick={handleSubmit}
                            disabled={isSubmitting || isLoading}
                            className="h-8 px-3 text-xs"
                        >
                            {isSubmitting ? '...' : hasSubmitted ? '✓' : <Send className="w-3 h-3" />}
                        </Button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
