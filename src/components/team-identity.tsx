'use client';

/**
 * TeamIdentity: milan-stripes CSS クラスの汎用的な代替コンポーネント
 * チームのカラーを使ってストライプ/グラデーションを描画する
 */

import { useTeam } from '@/contexts/team-context';

interface TeamIdentityProps {
    size?: number;
    className?: string;
    variant?: 'stripe' | 'badge' | 'dot';
}

export function TeamIdentity({ size = 32, className = '', variant = 'stripe' }: TeamIdentityProps) {
    const { team } = useTeam();
    const { primary, secondary } = team.colors;

    if (variant === 'dot') {
        return (
            <div
                className={`rounded-full ${className}`}
                style={{
                    width: size,
                    height: size,
                    background: `linear-gradient(135deg, ${primary} 50%, ${secondary} 50%)`,
                    imageRendering: 'pixelated',
                }}
            />
        );
    }

    if (variant === 'badge') {
        return (
            <div
                className={`rounded-sm overflow-hidden flex border border-black shadow-[2px_2px_0px_rgba(0,0,0,0.2)] ${className}`}
                style={{ width: size, height: size }}
            >
                <div className="w-1/2 h-full" style={{ backgroundColor: primary }} />
                <div className="w-1/2 h-full" style={{ backgroundColor: secondary }} />
            </div>
        );
    }

    // default: stripe
    return (
        <div
            className={`rounded ${className}`}
            style={{
                width: size,
                height: size,
                background: `repeating-linear-gradient(
                    90deg,
                    ${primary} 0px,
                    ${primary} ${Math.round(size / 4)}px,
                    ${secondary} ${Math.round(size / 4)}px,
                    ${secondary} ${Math.round(size / 2)}px
                )`,
                imageRendering: 'pixelated',
            }}
        />
    );
}
