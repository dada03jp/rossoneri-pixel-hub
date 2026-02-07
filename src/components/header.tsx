import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AuthButton } from './auth-button';

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-3 group">
                    {/* Logo - Milan Stripes */}
                    <div className="w-10 h-10 milan-stripes rounded-lg shadow-sm group-hover:shadow-md transition-shadow" />

                    <div className="flex flex-col">
                        <span className="text-lg font-bold tracking-tight">
                            <span className="text-primary">ROSSONERI</span>
                            <span className="text-foreground"> PIXEL HUB</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            Fan Community
                        </span>
                    </div>
                </Link>

                <nav className="flex items-center gap-6">
                    <Link
                        href="/"
                        className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                        試合一覧
                    </Link>
                    <Link
                        href="/players"
                        className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                        選手
                    </Link>
                    <div className="h-4 w-px bg-border" />
                    <AuthButton />
                </nav>
            </div>
        </header>
    );
}

interface BackHeaderProps {
    title: string;
    subtitle?: string;
}

export function BackHeader({ title, subtitle }: BackHeaderProps) {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
