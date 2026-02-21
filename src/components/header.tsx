'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowLeft, Settings } from 'lucide-react';
import { AuthButton } from './auth-button';
import { SeasonSelector } from './season-selector';
import { createClient } from '@/lib/supabase/client';

const ADMIN_EMAIL = 'marketing.workself@gmail.com';

export function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            setIsAdmin(user?.email === ADMIN_EMAIL);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAdmin(session?.user?.email === ADMIN_EMAIL);
        });
        return () => subscription.unsubscribe();
    }, []);

    const navItems = [
        { name: 'Match Ratings', path: '/' },
        { name: 'Players', path: '/players' },
        { name: 'Community', path: '/community' },
        { name: 'About', path: '/about' },
    ];

    return (
        <>
            <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
                {/* Top Stripe: Height 2px, Left Red / Right Black */}
                <div className="absolute top-0 left-0 w-full h-[2px] flex z-10">
                    <div className="w-1/2 bg-milan-red" />
                    <div className="w-1/2 bg-black" />
                </div>

                <div className="container mx-auto px-4 h-16 flex items-center justify-between relative">
                    {/* Logo Section */}
                    <Link href="/" className="flex items-center gap-2 group relative z-20" onClick={() => setIsOpen(false)}>
                        <span className="font-pixel text-sm md:text-base tracking-tighter text-black flex items-center">
                            <span className="mr-1">AC</span><span>MILAN</span>
                            {/* Pixel Accent: Red & Pixel Font */}
                            <span className="text-milan-red mx-1">PIXEL</span>
                            HUB
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.path}
                                className="text-gray-600 hover:text-black font-medium transition-all relative group py-1 px-1"
                            >
                                {item.name}
                                {/* Pixel Hover Effect: Red box-shadow appearing below */}
                                <span className="absolute inset-0 bg-transparent group-hover:bg-white/0 border border-transparent group-hover:border-b-2 group-hover:border-milan-red transition-all duration-200 shadow-none group-hover:shadow-[2px_2px_0px_0px_#FB090B]" />
                            </Link>
                        ))}
                    </nav>

                    {/* Actions (Season & Auth & Admin) */}
                    <div className="hidden md:flex items-center gap-4">
                        {isAdmin && (
                            <Link
                                href="/admin"
                                className="flex items-center gap-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition-colors"
                            >
                                <Settings className="w-3.5 h-3.5" />
                                管理画面
                            </Link>
                        )}
                        <SeasonSelector />
                        <div className="h-4 w-px bg-gray-200" />
                        <AuthButton />
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-gray-600 hover:text-black focus:outline-none"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-label="Menu"
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isOpen && (
                <div className="fixed inset-0 top-[66px] z-40 bg-white md:hidden animate-in slide-in-from-top-2">
                    {/* Red border line for mobile menu */}
                    <div className="w-full h-px bg-milan-red" />

                    <nav className="flex flex-col p-6 gap-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.path}
                                className="text-xl font-medium text-gray-800 hover:text-milan-red py-3 border-b border-gray-100 transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}

                        {/* 管理者リンク（モバイル） */}
                        {isAdmin && (
                            <Link
                                href="/admin"
                                className="text-xl font-medium text-slate-700 hover:text-milan-red py-3 border-b border-gray-100 transition-colors flex items-center gap-2"
                                onClick={() => setIsOpen(false)}
                            >
                                <Settings className="w-5 h-5" />
                                管理画面
                            </Link>
                        )}

                        <div className="mt-6 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Season</span>
                                <SeasonSelector />
                            </div>
                            <div className="h-px w-full bg-gray-100" />
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
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="absolute top-0 left-0 w-full h-[2px] flex z-10">
                <div className="w-1/2 bg-milan-red" />
                <div className="w-1/2 bg-black" />
            </div>
            <div className="container mx-auto flex h-16 items-center gap-4 px-4">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm">戻る</span>
                </Link>

                <div className="h-6 w-px bg-border" />

                <div className="flex flex-col">
                    <h1 className="text-lg font-bold">{title}</h1>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;
