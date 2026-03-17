'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ======== PixelBurst: 採点確定時のドット弾けエフェクト ========

interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    life: number;
}

interface PixelBurstProps {
    trigger: number; // 0以外でトリガー（数値インクリメントで再トリガー可能）
    colors: [string, string];
    particleCount?: number;
}

export function PixelBurst({
    trigger,
    colors,
    particleCount = 28,
}: PixelBurstProps) {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        if (trigger === 0) return;

        const newParticles: Particle[] = [];
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.8;
            const speed = 40 + Math.random() * 80;
            newParticles.push({
                id: i,
                x: 45 + (Math.random() - 0.5) * 30,
                y: 65 + (Math.random() - 0.5) * 15, // スライダー周辺 (下寄り)
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 25,
                color: colors[i % 2],
                size: 4 + Math.floor(Math.random() * 6),
                life: 600 + Math.random() * 600,
            });
        }
        setParticles(newParticles);

        const timer = setTimeout(() => setParticles([]), 1500);
        return () => clearTimeout(timer);
    }, [trigger, colors, particleCount]);

    if (particles.length === 0) return null;

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
            {particles.map((p) => (
                <motion.div
                    key={`${trigger}-${p.id}`}
                    initial={{ x: `${p.x}%`, y: `${p.y}%`, opacity: 1, scale: 1 }}
                    animate={{
                        x: `${p.x + p.vx}%`,
                        y: `${p.y + p.vy}%`,
                        opacity: 0,
                        scale: 0.2,
                    }}
                    transition={{ duration: p.life / 1000, ease: 'easeOut' }}
                    style={{
                        position: 'absolute',
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        imageRendering: 'pixelated',
                    }}
                />
            ))}
        </div>
    );
}

// ======== RatingSuccessPopup: ピクセルフォントのポップアップ ========

interface RatingSuccessPopupProps {
    show: boolean;
    score?: number;
}

function getSuccessMessage(score?: number): string {
    if (score && score >= 9) return '🔥 PERFECT!';
    if (score && score >= 8) return '⭐ GREAT RATING!';
    if (score && score >= 6) return '✨ NICE!';
    if (score && score <= 3) return '💀 HARSH!';
    if (score && score <= 4) return '😬 TOUGH!';
    return '✅ SAVED!';
}

export function RatingSuccessPopup({ show, score }: RatingSuccessPopupProps) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.7 }}
                    animate={{ opacity: 1, y: -20, scale: 1 }}
                    exit={{ opacity: 0, y: -40, scale: 0.6 }}
                    transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                    className="absolute inset-x-0 -top-2 flex justify-center pointer-events-none z-50"
                >
                    <div
                        className="px-3 py-1.5 bg-black text-white font-bold text-xs rounded border-2 border-white whitespace-nowrap"
                        style={{
                            boxShadow: '3px 3px 0px rgba(0,0,0,0.5)',
                            fontFamily: 'monospace',
                            letterSpacing: '0.05em',
                        }}
                    >
                        {getSuccessMessage(score)}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ======== PixelHeartBurst: いいねのマイクロインタラクション ========

interface PixelHeartBurstProps {
    trigger: number; // 0以外でトリガー
    color?: string;
}

export function PixelHeartBurst({ trigger, color = '#FB090B' }: PixelHeartBurstProps) {
    const [hearts, setHearts] = useState<{ id: number; x: number; y: number; scale: number; rotation: number }[]>([]);

    useEffect(() => {
        if (trigger === 0) return;

        const newHearts = Array.from({ length: 5 }, (_, i) => ({
            id: Date.now() + i,
            x: (Math.random() - 0.5) * 30,
            y: -8 - Math.random() * 25,
            scale: 0.5 + Math.random() * 0.5,
            rotation: (Math.random() - 0.5) * 30,
        }));
        setHearts(newHearts);
        const timer = setTimeout(() => setHearts([]), 700);
        return () => clearTimeout(timer);
    }, [trigger]);

    if (hearts.length === 0) return null;

    return (
        <>
            {hearts.map((h) => (
                <motion.span
                    key={h.id}
                    initial={{ opacity: 1, y: 0, x: 0, scale: 0 }}
                    animate={{ opacity: 0, y: h.y, x: h.x, scale: h.scale, rotate: h.rotation }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="absolute top-1/2 left-1/2 pointer-events-none z-50"
                    style={{ color, fontFamily: 'monospace', fontSize: '12px' }}
                >
                    ♥
                </motion.span>
            ))}
        </>
    );
}

// ======== AnimatedCounter: スコアのカウントアップ/ダウン ========

interface AnimatedCounterProps {
    value: number;
    decimals?: number;
    duration?: number;
    className?: string;
}

export function AnimatedCounter({
    value,
    decimals = 1,
    duration = 500,
    className = '',
}: AnimatedCounterProps) {
    const [displayValue, setDisplayValue] = useState(value);
    const prevValueRef = useRef(value);
    const [direction, setDirection] = useState<'up' | 'down' | null>(null);

    useEffect(() => {
        const prev = prevValueRef.current;
        if (value === prev) return;

        setDirection(value > prev ? 'up' : 'down');
        const diff = value - prev;
        const startTime = performance.now();

        let frameId: number;
        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(prev + diff * eased);

            if (progress < 1) {
                frameId = requestAnimationFrame(animate);
            } else {
                setDisplayValue(value);
                setTimeout(() => setDirection(null), 400);
            }
        };

        frameId = requestAnimationFrame(animate);
        prevValueRef.current = value;

        return () => cancelAnimationFrame(frameId);
    }, [value, duration]);

    return (
        <span
            className={`font-mono font-bold transition-colors duration-300 ${direction === 'up' ? '!text-green-500' : direction === 'down' ? '!text-red-500' : ''
                } ${className}`}
            style={{ fontVariantNumeric: 'tabular-nums' }}
        >
            {displayValue.toFixed(decimals)}
        </span>
    );
}

// ======== PixelToast: 通知トースト ========

interface ToastData {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

let toastIdCounter = 0;
const toastListeners: Array<(toast: ToastData) => void> = [];

export function showPixelToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    const toast: ToastData = { id: ++toastIdCounter, message, type };
    toastListeners.forEach(fn => fn(toast));
}

export function PixelToastContainer() {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    useEffect(() => {
        const listener = (toast: ToastData) => {
            setToasts(prev => [toast, ...prev].slice(0, 3));
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== toast.id));
            }, 2500);
        };
        toastListeners.push(listener);
        return () => {
            const idx = toastListeners.indexOf(listener);
            if (idx >= 0) toastListeners.splice(idx, 1);
        };
    }, []);

    const colors = {
        success: 'bg-green-600 border-green-400',
        error: 'bg-red-600 border-red-400',
        info: 'bg-blue-600 border-blue-400',
    };

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {toasts.map(t => (
                    <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: -20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.9 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className={`px-4 py-2 text-white text-xs font-bold rounded border-2 shadow-lg whitespace-nowrap ${colors[t.type]}`}
                        style={{ fontFamily: 'monospace', boxShadow: '3px 3px 0px rgba(0,0,0,0.4)' }}
                    >
                        {icons[t.type]} {t.message}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

// ======== SkeletonCard: ピクセルアート風スケルトン ========

export function PixelSkeletonCard() {
    return (
        <div
            className="bg-white rounded-lg p-4 border-2 border-gray-200"
            style={{
                boxShadow: '4px 4px 0px 0px rgba(0,0,0,0.1)',
                backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)',
                backgroundSize: '8px 8px',
            }}
        >
            <div className="flex items-center gap-3 mb-3">
                <div className="w-16 h-16 bg-gray-200 rounded animate-pulse" style={{ imageRendering: 'pixelated' }} />
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded w-16 animate-pulse" />
                </div>
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-px bg-gray-100 mb-3" />
            <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-8 bg-gray-100 rounded animate-pulse" />
            </div>
        </div>
    );
}

// ======== EmptyState: ピクセルアート風の空状態 ========

interface EmptyStateProps {
    message?: string;
    subMessage?: string;
}

export function PixelEmptyState({
    message = 'まだコメントがありません',
    subMessage = '最初のファンになりましょう！',
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
            <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-3xl mb-3"
                style={{ imageRendering: 'pixelated' }}
            >
                💬
            </motion.div>
            <p className="text-sm font-bold text-gray-500" style={{ fontFamily: 'monospace' }}>
                {message}
            </p>
            <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'monospace' }}>
                {subMessage}
            </p>
        </div>
    );
}

// ======== EmojiCrackerBurst: 採点送信時の絵文字クラッカー ========

function getScoreEmojis(score: number): string[] {
    if (score >= 9) return ['🔥', '⭐', '🏆', '💎', '✨', '🎉', '👑'];
    if (score >= 7) return ['⚽', '👏', '🎯', '💪', '✨', '🙌', '🎉'];
    if (score >= 5) return ['🤔', '😐', '⚽', '📊', '🔄', '😶', '🫤'];
    return ['💀', '😬', '😤', '👎', '🗑️', '😵', '💩'];
}

interface EmojiParticle {
    id: number;
    emoji: string;
    angle: number;
    distance: number;
    scale: number;
    rotation: number;
    delay: number;
}

interface EmojiCrackerBurstProps {
    trigger: number;
    score: number;
}

export function EmojiCrackerBurst({ trigger, score }: EmojiCrackerBurstProps) {
    const [particles, setParticles] = useState<EmojiParticle[]>([]);

    useEffect(() => {
        if (trigger === 0) return;

        const emojis = getScoreEmojis(score);
        const count = 14;
        const newParticles: EmojiParticle[] = [];

        for (let i = 0; i < count; i++) {
            // クラッカー型: 上方向を中心に扇状に広がる (-150° ~ -30°)
            const baseAngle = -Math.PI * 0.83 + (Math.PI * 0.67 * i) / count;
            const angle = baseAngle + (Math.random() - 0.5) * 0.4;
            newParticles.push({
                id: i,
                emoji: emojis[i % emojis.length],
                angle,
                distance: 50 + Math.random() * 80,
                scale: 0.7 + Math.random() * 0.6,
                rotation: (Math.random() - 0.5) * 360,
                delay: Math.random() * 0.15,
            });
        }
        setParticles(newParticles);

        const timer = setTimeout(() => setParticles([]), 1800);
        return () => clearTimeout(timer);
    }, [trigger, score]);

    if (particles.length === 0) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-50" style={{ overflow: 'visible' }}>
            {particles.map((p) => {
                const tx = Math.cos(p.angle) * p.distance;
                const ty = Math.sin(p.angle) * p.distance;
                return (
                    <motion.span
                        key={`${trigger}-emoji-${p.id}`}
                        initial={{
                            x: '50%',
                            y: '50%',
                            opacity: 1,
                            scale: 0,
                            rotate: 0,
                        }}
                        animate={{
                            x: `calc(50% + ${tx}px)`,
                            y: `calc(50% + ${ty}px)`,
                            opacity: 0,
                            scale: p.scale,
                            rotate: p.rotation,
                        }}
                        transition={{
                            duration: 1.2,
                            ease: [0.16, 1, 0.3, 1],
                            delay: p.delay,
                            opacity: { duration: 0.8, delay: p.delay + 0.6 },
                        }}
                        className="absolute"
                        style={{ fontSize: '18px', lineHeight: 1 }}
                    >
                        {p.emoji}
                    </motion.span>
                );
            })}
        </div>
    );
}
