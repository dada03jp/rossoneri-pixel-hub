'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowLeft } from 'lucide-react';
import { AuthButton } from './auth-button';
import { SeasonSelector } from './season-selector';
import { NotificationBell } from './notification-bell';
import { useTeam } from '@/contexts/team-context';

export function Header() {
    const [isOpen, setIsOpen] = useState(false);

    // TeamProvider 内の場合はチーム情報を取得、そうでなければデフォルト
    let teamName = 'PIXEL HUB';
    let teamId = 'milan';
    let accentColor = '#FB090B';

    try {
        const { team } = useTeam();
        teamName = team.shortName.toUpperCase();
        teamId = team.id;
        accentColor = team.colors.accent;
    } catch {
        // TeamProvider の外で使われる場合はデフォルト値を使用
    }

    const navItems = [
        { name: 'Match Ratings', path: `/${teamId}` },
        { name: 'Players', path: `/${teamId}/players` },
        { name: 'My Page', path: `/${teamId}/mypage` },
    ];

    return (
        <>
            <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-black/[0.06]">
                {/* Top Stripe: チームカラー — 控えめに */}
                <div className="absolute top-0 left-0 w-full h-[2px] flex z-10">
                    <div className="w-1/2" style={{ backgroundColor: accentColor }} />
                    <div className="w-1/2 bg-black" />
                </div>

                <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between relative">
                    {/* Logo */}
                    <Link href={`/${teamId}`} className="flex items-center gap-2 group relative z-20" onClick={() => setIsOpen(false)}>
                        <span className="font-pixel text-[13px] md:text-sm tracking-tight text-foreground/90 flex items-center">
                            <span className="mr-0.5">{teamName}</span>
                            <span style={{ color: accentColor }} className="mx-0.5">PIXEL</span>
                            HUB
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.path}
                                className="text-[13px] font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-black/[0.03] transition-all duration-150"
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="hidden md:flex items-center gap-2">
                        <SeasonSelector />
                        <NotificationBell />
                        <div className="h-4 w-px bg-black/[0.08] mx-1" />
                        <AuthButton />
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-black/[0.03] transition-colors focus:outline-none"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Menu"
                    >
                        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="fixed inset-0 top-[66px] z-40 bg-white/98 backdrop-blur-sm md:hidden">
                    <div className="w-full h-px bg-black/[0.04]" />

                    <nav className="flex flex-col p-6 gap-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.path}
                                className="text-base font-medium text-foreground/80 hover:text-foreground py-3.5 px-3 rounded-lg hover:bg-black/[0.03] transition-all"
                                onClick={() => setIsOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}

                        <div className="mt-6 pt-6 border-t border-black/[0.06] flex flex-col gap-4">
                            <div className="flex items-center justify-between px-3">
                                <span className="text-sm text-muted-foreground">Season</span>
                                <SeasonSelector />
                            </div>
                            <div className="flex justify-center pt-2">
                                <AuthButton />
                            </div>
                        </div>
                    </nav>
                </div>
            )}
        </>
    );
}

interface BackHeaderProps {
    title: string;
    subtitle?: string;
}

export function BackHeader({ title, subtitle }: BackHeaderProps) {
    let accentColor = '#FB090B';
    let teamId = 'milan';

    try {
        const { team } = useTeam();
        accentColor = team.colors.accent;
        teamId = team.id;
    } catch {
        // デフォルト
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b border-black/[0.06] bg-white/95 backdrop-blur-md">
            <div className="absolute top-0 left-0 w-full h-[2px] flex z-10">
                <div className="w-1/2" style={{ backgroundColor: accentColor }} />
                <div className="w-1/2 bg-black" />
            </div>
            <div className="container mx-auto flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4">
                <Link
                    href={`/${teamId}`}
                    className="flex items-center gap-1 sm:gap-2 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm">戻る</span>
                </Link>

                <div className="h-6 w-px bg-black/[0.06] flex-shrink-0" />

                <div className="flex flex-col min-w-0">
                    <h1
                        className="font-bold truncate"
                        style={{ fontSize: 'clamp(0.75rem, 2.5vw, 1.125rem)' }}
                    >
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{subtitle}</p>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;
