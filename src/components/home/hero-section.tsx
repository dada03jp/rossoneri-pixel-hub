'use client';

import { PixelPlayer } from '@/components/pixel-player';
import { Star, ChevronRight, Calendar } from 'lucide-react';
import Link from 'next/link';

interface HeroSectionProps {
    teamName: string;
    teamShortName: string;
    accentColor: string;
    primaryColor: string;
    primaryCtaHref: string;
    secondaryCtaHref: string;
    displayPlayers: Array<{
        id: string;
        number: number;
        pixel_config: any;
    }>;
}

export function HeroSection({
    teamName,
    teamShortName,
    accentColor,
    primaryColor,
    primaryCtaHref,
    secondaryCtaHref,
    displayPlayers,
}: HeroSectionProps) {
    return (
        <section className="relative overflow-hidden rounded-[16px] border border-black/[0.06]"
            style={{
                background: `linear-gradient(135deg, #fafafa 0%, #f5f5f5 40%, color-mix(in srgb, ${primaryColor} 4%, #f5f5f5) 100%)`,
            }}
        >
            {/* Subtle pixel-pattern overlay for brand texture */}
            <div className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `repeating-linear-gradient(
                        0deg,
                        transparent,
                        transparent 3px,
                        ${accentColor} 3px,
                        ${accentColor} 4px
                    ),
                    repeating-linear-gradient(
                        90deg,
                        transparent,
                        transparent 3px,
                        ${accentColor} 3px,
                        ${accentColor} 4px
                    )`,
                    backgroundSize: '4px 4px',
                }}
            />

            {/* Accent glow */}
            <div className="absolute -top-20 -right-20 w-[300px] h-[300px] opacity-[0.06] blur-3xl rounded-full"
                style={{ backgroundColor: accentColor }}
            />
            <div className="absolute -bottom-16 -left-16 w-[200px] h-[200px] opacity-[0.04] blur-2xl rounded-full"
                style={{ backgroundColor: accentColor }}
            />

            <div className="relative z-10 px-6 py-10 md:px-12 md:py-14 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                {/* Left: Brand + Copy + CTA */}
                <div className="flex-1 space-y-6 text-center md:text-left">
                    {/* Logo */}
                    <div className="space-y-3">
                        <h1 className="text-[2rem] md:text-[2.75rem] lg:text-[3.25rem] font-bold tracking-tight leading-[1.1]">
                            <span
                                className="font-pixel text-[0.65em] tracking-wider"
                                style={{ color: accentColor }}
                            >
                                {teamShortName.toUpperCase()}
                            </span>
                            <br className="md:hidden" />
                            <span className="text-foreground ml-1 md:ml-2">PIXEL HUB</span>
                        </h1>
                        <p className="text-[15px] md:text-base text-muted-foreground max-w-md mx-auto md:mx-0 leading-relaxed">
                            試合後の感情を、採点で残そう。
                            <br className="hidden sm:block" />
                            {teamShortName}ファンのための選手採点コミュニティ。
                        </p>
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                        <Link
                            href={primaryCtaHref}
                            className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-[12px] text-white font-semibold text-sm transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md shadow-lg"
                            style={{
                                backgroundColor: accentColor,
                                boxShadow: `0 4px 14px 0 color-mix(in srgb, ${accentColor} 35%, transparent)`,
                            }}
                        >
                            <Star className="w-4 h-4" />
                            最新試合を採点する
                            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                        <Link
                            href={secondaryCtaHref}
                            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-[12px] font-medium text-sm border border-black/10 text-muted-foreground hover:text-foreground hover:border-black/20 hover:bg-white/60 transition-all duration-200"
                        >
                            <Calendar className="w-4 h-4" />
                            試合一覧を見る
                        </Link>
                    </div>
                </div>

                {/* Right: PixelPlayer decoration */}
                <div className="flex items-end gap-2 md:gap-3">
                    {displayPlayers.map((player, index) => (
                        <div
                            key={player.id}
                            className="transform transition-all duration-300 hover:scale-110 hover:-translate-y-3"
                            style={{
                                transform: `translateY(${Math.abs(index - 2) * 6}px)`,
                                filter: index === 2 ? 'none' : 'brightness(0.97)',
                            }}
                        >
                            {player.pixel_config && (
                                <PixelPlayer
                                    config={player.pixel_config}
                                    number={player.number}
                                    size={index === 2 ? 88 : 68}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
