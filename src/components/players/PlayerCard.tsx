'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PixelPlayer, PixelConfig } from '@/components/pixel-player';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

export interface PlayerCardProps {
    name: string;
    number: number;
    position: string;
    averageRating: number | null;
    recentRatings: number[];
    pixelConfig: PixelConfig;
    className?: string;
    onClick?: () => void;
}

export function PlayerCard({
    name,
    number,
    position,
    averageRating,
    recentRatings = [],
    pixelConfig,
    className,
    onClick
}: PlayerCardProps) {
    // 5つのドットを表示するためのロジック
    // recentRatingsの末尾5件を取得し、古い順に左から右へ並べるイメージ（または新しい順？通常グラフは左から右へ時系列）
    // ここでは左=古い、右=新しいとするのが直感的
    const dots = [...recentRatings].slice(-5);

    // 常に5つのスロットを表示するため、足りない分はnullで埋める
    // [null, null, 6.5, 7.0, 8.0] のように埋めて、右詰めにする
    const displayDots = Array(5).fill(null).map((_, i) => {
        // dots配列の長さが3の場合、i=0,1はnull, i=2,3,4は値が入るようにする
        const offset = 5 - dots.length;
        if (i < offset) return null;
        return dots[i - offset];
    });

    const getDotColor = (rating: number) => {
        if (rating >= 7.5) return 'bg-[#AB0920]'; // Deep Milan Red (High)
        if (rating >= 6.0) return 'bg-[#FB090B]'; // Milan Red (Medium)
        if (rating >= 5.0) return 'bg-[#FF8A80]'; // Light Red (Low-Mid)
        return 'bg-gray-300'; // Low
    };

    return (
        <motion.div
            className={cn(
                "group relative bg-white rounded-md border border-gray-100 cursor-pointer overflow-visible", // overflow-visible for shadow
                "transition-all duration-300",
                "hover:border-milan-red/50",
                className
            )}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            onClick={onClick}
        >
            {/* Background Pixel Grid Pattern */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-md overflow-hidden"
                style={{
                    backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}
            />

            {/* Pixel Shadow Effect (Appears on Hover) */}
            <div
                className="absolute inset-0 rounded-md bg-transparent pointer-events-none transition-all duration-300 opacity-0 group-hover:opacity-100"
                style={{
                    boxShadow: '6px 6px 0px 0px #FB090B',
                    zIndex: -1
                }}
            />

            <div className="p-4 flex flex-col items-center relative z-10 h-full">
                {/* Header: Number & Position */}
                <div className="w-full flex justify-between items-start mb-2">
                    <span className="text-2xl font-bold text-milan-red font-pixel" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.05)' }}>
                        {number}
                    </span>
                    <span className="px-2 py-0.5 bg-milan-red text-white text-[10px] font-bold rounded-sm shadow-sm tracking-wider">
                        {position}
                    </span>
                </div>

                {/* Pixel Player with Bounce Animation */}
                <motion.div
                    className="my-2 relative"
                    whileHover={{ y: -8 }}
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
                <h3 className="text-lg font-bold text-black uppercase tracking-tight mb-5 text-center leading-tight">
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

                    {/* Dot Graph (5 dots) */}
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
        </motion.div>
    );
}
