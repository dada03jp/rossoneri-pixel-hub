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
                background: `linear-gradient(145deg, #fafafa 0%, #f7f7f7 50%, color-mix(in srgb, ${primaryColor} 3%, #f5f5f5) 100%)`,
            }}
        >
            {/* Accent glow — 主演出はグラデーションとグロー */}
            <div className="absolute -top-24 -right-24 w-[320px] h-[320px] opacity-[0.05] blur-[80px] rounded-full"
                style={{ backgroundColor: accentColor }}
            />
            <div className="absolute -bottom-20 -left-20 w-[200px] h-[200px] opacity-[0.03] blur-[60px] rounded-full"
                style={{ backgroundColor: accentColor }}
            />

            <div className="relative z-10 px-6 py-12 md:px-12 md:py-16 flex flex-col md:flex-row items-center gap-10 md:gap-14">
                {/* Left: Brand + Copy + CTA */}
                <div className="flex-1 space-y-7 text-center md:text-left">
                    {/* Brand mark */}
                    <div className="space-y-4">
                        <h1 className="text-[2rem] md:text-[2.75rem] lg:text-[3.25rem] font-bold tracking-tight leading-[1.1]">
                            <span
                                className="font-pixel text-[0.6em] tracking-wider"
                                style={{ color: accentColor }}
                            >
                                {teamShortName.toUpperCase()}
                            </span>
                            {' '}
                            <span className="text-foreground">PIXEL HUB</span>
                        </h1>
                        <p className="text-[15px] md:text-[17px] text-muted-foreground max-w-[420px] mx-auto md:mx-0 leading-[1.7]">
                            あの試合、あの選手に、あなたの声を。
                            <br />
                            <span className="text-foreground/70 font-medium">{teamShortName}を愛するファンが集まる場所。</span>
                        </p>
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                        <Link
                            href={primaryCtaHref}
                            className="group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-[12px] text-white font-semibold text-sm transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
                            style={{
                                backgroundColor: accentColor,
                                boxShadow: `0 4px 14px 0 color-mix(in srgb, ${accentColor} 30%, transparent)`,
                            }}
                        >
                            <Star className="w-4 h-4" />
                            最新試合を採点する
                            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                        <Link
                            href={secondaryCtaHref}
                            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-[12px] font-medium text-sm border border-black/8 text-muted-foreground hover:text-foreground hover:border-black/15 hover:bg-black/[0.02] transition-all duration-200"
                        >
                            <Calendar className="w-4 h-4" />
                            試合一覧を見る
                        </Link>
                    </div>
                </div>

                {/* Right: PixelPlayer decoration — 控えめなアクセントとして */}
                <div className="flex items-end gap-2 md:gap-3 opacity-90">
                    {displayPlayers.map((player, index) => (
                        <div
                            key={player.id}
                            className="transition-all duration-300 hover:-translate-y-2"
                            style={{
                                transform: `translateY(${Math.abs(index - 2) * 5}px)`,
                                opacity: index === 2 ? 1 : 0.8,
                            }}
                        >
                            {player.pixel_config && (
                                <PixelPlayer
                                    config={player.pixel_config}
                                    number={player.number}
                                    size={index === 2 ? 80 : 64}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
