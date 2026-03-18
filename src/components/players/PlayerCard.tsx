'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PixelPlayer, PixelConfig } from '@/components/pixel-player';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface PlayerCardProps {
    id: string;
    teamId: string;
    name: string;
    number: number;
    position: string;
    pixelConfig: PixelConfig;
    className?: string;
    // Stats (from player_season_stats view)
    avgRating?: number;
    appearances?: number;
    goals?: number;
    assists?: number;
    yellowCards?: number;
    redCards?: number;
}

const POSITION_COLORS: Record<string, string> = {
    'GK': 'bg-amber-500',
    'DF': 'bg-blue-500',
    'MF': 'bg-green-500',
    'FW': 'bg-red-500',
};

function getRatingColor(rating: number): string {
    if (rating >= 7.5) return 'text-green-600';
    if (rating >= 6.5) return 'text-yellow-600';
    if (rating >= 5.5) return 'text-orange-500';
    return 'text-red-500';
}

export function PlayerCard({
    id,
    teamId,
    name,
    number,
    position,
    pixelConfig,
    className,
    avgRating = 0,
    appearances = 0,
    goals = 0,
    assists = 0,
}: PlayerCardProps) {
    return (
        <Link href={`/${teamId}/players/${id}`}>
            <motion.div
                className={cn(
                    'bg-white rounded-lg p-4 cursor-pointer',
                    'border-2 border-black',
                    'transition-all duration-200',
                    className
                )}
                style={{
                    boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                    backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)',
                    backgroundSize: '8px 8px',
                    imageRendering: 'pixelated' as any,
                }}
                whileHover={{
                    y: -6,
                    boxShadow: '6px 8px 0px 0px rgba(0,0,0,1)',
                }}
                whileTap={{ scale: 0.97 }}
            >
                {/* Header: Number + Position Badge */}
                <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-gray-300 font-mono">
                        #{number}
                    </span>
                    <span className={cn(
                        'text-[10px] font-bold text-white px-2 py-0.5 rounded',
                        POSITION_COLORS[position] || 'bg-gray-500'
                    )}>
                        {position}
                    </span>
                </div>

                {/* Pixel Player */}
                <div className="flex justify-center mb-3">
                    <motion.div
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <PixelPlayer config={pixelConfig} number={number} size={80} />
                    </motion.div>
                </div>

                {/* Name */}
                <p className="text-sm font-bold text-center truncate mb-3">
                    {name}
                </p>

                {/* Stats Badges Grid */}
                <div className="grid grid-cols-2 gap-1.5">
                    {/* Average Rating */}
                    <div className="bg-gray-50 rounded px-2 py-1.5 text-center"
                        style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.08)' }}>
                        <span className="text-[10px] text-gray-400 block">平均点</span>
                        <span className={cn(
                            'text-lg font-bold font-mono leading-none',
                            avgRating > 0 ? getRatingColor(avgRating) : 'text-gray-300'
                        )}>
                            {avgRating > 0 ? avgRating.toFixed(1) : '-'}
                        </span>
                    </div>

                    {/* Appearances */}
                    <div className="bg-gray-50 rounded px-2 py-1.5 text-center"
                        style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.08)' }}>
                        <span className="text-[10px] text-gray-400 block">出場</span>
                        <span className="text-lg font-bold font-mono leading-none text-gray-700">
                            {appearances}
                        </span>
                    </div>

                    {/* Goals */}
                    <div className="bg-gray-50 rounded px-2 py-1.5 text-center"
                        style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.08)' }}>
                        <span className="text-[10px] text-gray-400 block">⚽ ゴール</span>
                        <span className="text-lg font-bold font-mono leading-none text-gray-700">
                            {appearances > 0 ? goals : '-'}
                        </span>
                    </div>

                    {/* Assists */}
                    <div className="bg-gray-50 rounded px-2 py-1.5 text-center"
                        style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.08)' }}>
                        <span className="text-[10px] text-gray-400 block">🅰️ アシスト</span>
                        <span className="text-lg font-bold font-mono leading-none text-gray-700">
                            {appearances > 0 ? assists : '-'}
                        </span>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
