'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PixelPlayer, PixelConfig } from '@/components/pixel-player';
import { cn } from '@/lib/utils';
import { Star, Send, ChevronDown } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface PlayerCardProps {
    name: string;
    number: number;
    position: string;
    averageRating: number | null;
    recentRatings: number[];
    pixelConfig: PixelConfig;
    className?: string;
    onClick?: () => void;
    // Interactive Props
    initialRating?: number;
    initialComment?: string;
    onSubmit?: (rating: number, comment: string) => Promise<void> | void;
    isInteractive?: boolean;
    // Auth & Loading
    isLoading?: boolean;
    isGuest?: boolean;
    onAuthAction?: () => void;
    totalRatings?: number;
    // Comments
    comments?: {
        id: string;
        userName: string;
        comment: string;
        score: number;
        createdAt: string;
        likesCount?: number;
    }[];
    onLikeComment?: (commentId: string) => void;
}

export function PlayerCard({
    name,
    number,
    position,
    averageRating,
    recentRatings = [],
    pixelConfig,
    className,
    onClick,
    // Interactive Props Defaults
    initialRating = 6.0,
    initialComment = '',
    onSubmit,
    isInteractive = false,
    isLoading = false,
    isGuest = false,
    onAuthAction,
    totalRatings = 0,
    comments = [],
    onLikeComment,
}: PlayerCardProps) {
    const [sliderValue, setSliderValue] = useState(initialRating);
    const [comment, setComment] = useState(initialComment);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [showComments, setShowComments] = useState(false);

    const handleSliderChange = (value: number[]) => {
        setSliderValue(value[0]);
    };

    const handleSubmit = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (isGuest && onAuthAction) {
            onAuthAction();
            return;
        }

        if (!onSubmit || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onSubmit(sliderValue, comment);
            setHasSubmitted(true);
            setComment('');
        } catch (error) {
            console.error('Submit failed', error);
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

    // Helper for dot logic (Display Only - for List View)
    const dots = [...recentRatings].slice(-5);
    const displayDots = Array(5).fill(null).map((_, i) => {
        const offset = 5 - dots.length;
        if (i < offset) return null;
        return dots[i - offset];
    });

    const getDotColor = (rating: number) => {
        if (rating >= 7.5) return 'bg-[#AB0920]';
        if (rating >= 6.0) return 'bg-[#FB090B]';
        if (rating >= 5.0) return 'bg-[#FF8A80]';
        return 'bg-gray-300';
    };

    return (
        <motion.div
            className={cn(
                "group relative bg-white rounded-lg border border-gray-200 cursor-pointer overflow-visible",
                "transition-colors duration-300",
                "hover:border-primary/50",
                className
            )}
            whileHover={{ y: -6 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={onClick}
        >
            {/* Background Grid */}
            <div
                className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden"
                style={{
                    backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
                    backgroundSize: '10px 10px'
                }}
            />

            {/* Pixel Shadow */}
            <div
                className="absolute inset-0 rounded-lg bg-transparent pointer-events-none transition-all duration-300 opacity-0 group-hover:opacity-100"
                style={{
                    boxShadow: '6px 6px 0px 0px rgba(251, 9, 11, 0.5)',
                    zIndex: -1
                }}
            />

            {isInteractive ? (
                // --- Interactive Layout (Horizontal) ---
                <div className="p-4 relative z-10 h-full">
                    <div className="flex items-start gap-4 mb-4">
                        {/* Avatar with Badge */}
                        <div className="relative">
                            <motion.div
                                whileHover={{ y: -10 }}
                                transition={{ type: "spring", stiffness: 300, damping: 10 }}
                                className="relative z-10"
                            >
                                <PixelPlayer
                                    config={pixelConfig}
                                    number={number}
                                    size={64}
                                    showNumber={false}
                                />
                            </motion.div>
                            {/* Red Number Badge */}
                            <div className="absolute -bottom-2 -right-2 bg-[#E30613] text-white text-xs font-bold px-1.5 py-0.5 rounded shadow-sm z-20">
                                {number}
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="flex-1 min-w-0 pt-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                    {position}
                                </span>
                                <span className="text-xs text-gray-500">#{number}</span>
                            </div>
                            <h3 className="font-bold text-lg leading-tight mb-1 truncate">
                                {name}
                            </h3>
                            <div className="flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 text-[#E30613] fill-[#E30613]" />
                                <span className="text-sm font-bold text-[#E6B00F] font-mono">
                                    {averageRating ? averageRating.toFixed(1) : '-.-'}
                                </span>
                                <span className="text-xs text-gray-400">
                                    ({totalRatings}件の評価)
                                </span>
                            </div>
                        </div>

                        {/* Current Rating Display (Right) */}
                        <div className="text-right pt-1">
                            <div className={cn("text-3xl font-bold leading-none tracking-tight", getScoreColor(sliderValue))}>
                                {sliderValue.toFixed(1)}
                            </div>
                            <div className="text-xs text-gray-500 font-medium text-right mt-1">
                                {getScoreLabel(sliderValue)}
                            </div>
                        </div>
                    </div>

                    {/* Interactive Controls */}
                    <div className="w-full space-y-3 pt-2 border-t border-gray-100 relative">
                        {/* Slider */}
                        <div className="flex items-center gap-3 px-1 mt-2">
                            <span className="text-xs text-gray-400 w-6">1.0</span>
                            <Slider
                                value={[sliderValue]}
                                onValueChange={handleSliderChange}
                                min={1}
                                max={10}
                                step={0.5}
                                disabled={isLoading}
                                className="flex-1 [&>.absolute.h-full.bg-primary]:bg-[#E30613] [&>span:last-child]:border-[#E30613] [&>span:last-child]:ring-offset-background"
                            />
                            <span className="text-xs text-gray-400 w-6 text-right">10.0</span>
                        </div>

                        {/* Input & Button */}
                        <div className="flex gap-2">
                            <Input
                                placeholder="コメントを入力（任意）"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="h-10 text-sm bg-white border-gray-200 focus-visible:ring-[#E30613]"
                                disabled={isLoading}
                            />
                            <Button
                                size="sm"
                                className="h-10 px-4 bg-[#D50000] hover:bg-[#B71C1C] text-white gap-1.5 font-bold shadow-sm whitespace-nowrap"
                                onClick={handleSubmit}
                                disabled={isLoading || isSubmitting}
                            >
                                <Send className="w-3.5 h-3.5" />
                                送信
                            </Button>
                        </div>

                        {hasSubmitted && (
                            <p className="text-xs text-green-600 font-bold text-center mt-1">✓ 評価を送信しました</p>
                        )}

                        {/* Comments Toggle */}
                        {comments.length > 0 && (
                            <div className="pt-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowComments(!showComments);
                                    }}
                                    className="flex items-center gap-1.5 text-xs text-[#E30613] hover:underline font-medium"
                                >
                                    <span className="text-sm">□</span>
                                    その他のコメント ({comments.length}件)
                                    <ChevronDown className={cn("w-3 h-3 transition-transform", showComments && "rotate-180")} />
                                </button>
                            </div>
                        )}

                        {/* Comments List */}
                        {showComments && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2 mt-2"
                            >
                                {comments.map((c) => (
                                    <div key={c.id} className="bg-gray-50 p-2 rounded text-xs">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-gray-700">{c.userName}</span>
                                            <span className="font-bold text-[#E6B00F]">{c.score.toFixed(1)}</span>
                                        </div>
                                        <p className="text-gray-600">{c.comment}</p>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </div>
            ) : (
                // --- List Layout (Vertical / Original) ---
                <div className="p-4 flex flex-col items-center relative z-10 h-full">
                    {/* Header: Number & Position */}
                    <div className="w-full flex justify-between items-start mb-2">
                        <span className="text-2xl font-bold font-pixel text-[#FB090B]" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.05)' }}>
                            {number}
                        </span>
                        <span className="px-2 py-0.5 bg-milan-red text-white text-[10px] font-bold rounded-sm shadow-sm tracking-wider">
                            {position}
                        </span>
                    </div>

                    {/* Pixel Player with Bounce Animation */}
                    <motion.div
                        className="my-1 relative"
                        whileHover={{ y: -10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    >
                        <div className="relative z-10">
                            <PixelPlayer
                                config={pixelConfig}
                                number={number}
                                size={96}
                                showNumber={false}
                            />
                        </div>
                    </motion.div>

                    {/* Name */}
                    <h3 className="text-lg font-bold text-black uppercase tracking-tight mb-4 text-center leading-tight">
                        {name}
                    </h3>

                    {/* Bottom Stats Section */}
                    <div className="mt-auto w-full pt-3 border-t border-gray-100 bg-white/50 backdrop-blur-[2px]">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">AVG RATING</span>
                            <div className="flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 text-milan-red fill-milan-red" />
                                <span className="text-lg font-bold text-neutral-900 leading-none font-mono">
                                    {averageRating ? averageRating.toFixed(1) : '-.-'}
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center gap-1.5 h-2">
                            {displayDots.map((rating, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "h-1.5 flex-1 rounded-full transition-all duration-300",
                                        rating !== null ? getDotColor(rating) : "bg-gray-100"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
