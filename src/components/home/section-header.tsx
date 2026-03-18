import { ChevronRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface SectionHeaderProps {
    icon: LucideIcon;
    iconColor?: string;
    title: string;
    badge?: string;
    badgeColor?: string;
    viewAllHref?: string;
    viewAllLabel?: string;
    accentColor?: string;
}

export function SectionHeader({
    icon: Icon,
    iconColor,
    title,
    badge,
    badgeColor,
    viewAllHref,
    viewAllLabel = 'すべて見る',
    accentColor,
}: SectionHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
                <Icon className="w-5 h-5" style={{ color: iconColor || accentColor }} />
                <h2 className="text-lg font-bold tracking-tight">{title}</h2>
                {badge && (
                    <span
                        className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
                        style={{
                            backgroundColor: badgeColor ? `color-mix(in srgb, ${badgeColor} 12%, transparent)` : undefined,
                            color: badgeColor || undefined,
                        }}
                    >
                        {badge}
                    </span>
                )}
            </div>
            {viewAllHref && (
                <Link
                    href={viewAllHref}
                    className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
                    style={{ color: accentColor }}
                >
                    {viewAllLabel}
                    <ChevronRight className="w-4 h-4" />
                </Link>
            )}
        </div>
    );
}
