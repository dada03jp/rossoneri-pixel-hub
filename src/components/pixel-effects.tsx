'use client';

import { useEffect, useState, useCallback } from 'react';
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
    trigger: boolean;
    colors: [string, string]; // [primary, secondary]
    originX?: number;
    originY?: number;
    particleCount?: number;
    onComplete?: () => void;
}

export function PixelBurst({
    trigger,
    colors,
    originX = 50,
    originY = 50,
    particleCount = 16,
    onComplete,
}: PixelBurstProps) {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        if (!trigger) return;

        const newParticles: Particle[] = [];
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
            const speed = 40 + Math.random() * 60;
            newParticles.push({
                id: i,
                x: originX,
                y: originY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[i % 2],
                size: 4 + Math.floor(Math.random() * 4),
                life: 600 + Math.random() * 400,
            });
        }
        setParticles(newParticles);

        const timer = setTimeout(() => {
            setParticles([]);
            onComplete?.();
        }, 1200);

        return () => clearTimeout(timer);
    }, [trigger, colors, originX, originY, particleCount, onComplete]);

    return (
        <AnimatePresence>
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{ x: p.x, y: p.y, opacity: 1, scale: 1 }}
                    animate={{
                        x: p.x + p.vx,
                        y: p.y + p.vy - 20,
                        opacity: 0,
                        scale: 0.3,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: p.life / 1000, ease: 'easeOut' }}
                    style={{
                        position: 'absolute',
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        imageRendering: 'pixelated',
                        pointerEvents: 'none',
                        zIndex: 50,
                    }}
                />
            ))}
        </AnimatePresence>
    );
}

// ======== RatingSuccessPopup: ピクセルフォントのポップアップ ========

const SUCCESS_MESSAGES = [
    '🎮 GREAT RATING!',
    '⭐ SUCCESS!',
    '🔥 NICE!',
    '⚡ SAVED!',
    '✨ PERFECT!',
];

interface RatingSuccessPopupProps {
    show: boolean;
    score?: number;
}

export function RatingSuccessPopup({ show, score }: RatingSuccessPopupProps) {
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (show) {
            if (score && score >= 8) {
                setMessage('🔥 GREAT RATING!');
            } else if (score && score <= 4) {
                setMessage('💀 HARSH!');
            } else {
                setMessage(SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]);
            }
        }
    }, [show, score]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.5 }}
                    animate={{ opacity: 1, y: -10, scale: 1 }}
                    exit={{ opacity: 0, y: -40, scale: 0.8 }}
                    transition={{
                        duration: 0.6,
                        ease: [0.34, 1.56, 0.64, 1], // spring-like
                    }}
                    className="absolute inset-x-0 top-0 flex justify-center pointer-events-none z-50"
                    style={{ fontFamily: 'monospace' }}
                >
                    <div
                        className="px-4 py-2 bg-black text-white font-bold text-sm rounded border-2 border-white"
                        style={{
                            boxShadow: '3px 3px 0px rgba(0,0,0,0.5)',
                            imageRendering: 'pixelated',
                            letterSpacing: '0.1em',
                        }}
                    >
                        {message}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ======== PixelHeartBurst: いいねのマイクロインタラクション ========

interface PixelHeartBurstProps {
    trigger: boolean;
    color?: string;
}

export function PixelHeartBurst({ trigger, color = '#FB090B' }: PixelHeartBurstProps) {
    const [hearts, setHearts] = useState<{ id: number; x: number; y: number; scale: number; rotation: number }[]>([]);

    useEffect(() => {
        if (!trigger) return;

        const newHearts = Array.from({ length: 6 }, (_, i) => ({
            id: Date.now() + i,
            x: (Math.random() - 0.5) * 40,
            y: -10 - Math.random() * 30,
            scale: 0.6 + Math.random() * 0.6,
            rotation: (Math.random() - 0.5) * 30,
        }));
        setHearts(newHearts);

        const timer = setTimeout(() => setHearts([]), 800);
        return () => clearTimeout(timer);
    }, [trigger]);

    return (
        <AnimatePresence>
            {hearts.map((h) => (
                <motion.div
                    key={h.id}
                    initial={{ opacity: 1, y: 0, x: 0, scale: 0, rotate: 0 }}
                    animate={{
                        opacity: 0,
                        y: h.y,
                        x: h.x,
                        scale: h.scale,
                        rotate: h.rotation,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        pointerEvents: 'none',
                        zIndex: 50,
                        fontSize: '14px',
                        color: color,
                        fontFamily: 'monospace',
                        imageRendering: 'pixelated',
                    }}
                >
                    ♥
                </motion.div>
            ))}
        </AnimatePresence>
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
    duration = 600,
    className = '',
}: AnimatedCounterProps) {
    const [displayValue, setDisplayValue] = useState(value);
    const [prevValue, setPrevValue] = useState(value);
    const [direction, setDirection] = useState<'up' | 'down' | null>(null);

    useEffect(() => {
        if (value === prevValue) return;

        setDirection(value > prevValue ? 'up' : 'down');
        const startValue = prevValue;
        const diff = value - startValue;
        const startTime = performance.now();

        let animFrame: number;
        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(startValue + diff * eased);

            if (progress < 1) {
                animFrame = requestAnimationFrame(animate);
            } else {
                setDisplayValue(value);
                setTimeout(() => setDirection(null), 300);
            }
        };

        animFrame = requestAnimationFrame(animate);
        setPrevValue(value);

        return () => cancelAnimationFrame(animFrame);
    }, [value, prevValue, duration]);

    return (
        <span
            className={`font-mono font-bold transition-colors duration-300 ${direction === 'up' ? 'text-green-500' : direction === 'down' ? 'text-red-500' : ''
                } ${className}`}
            style={{ fontVariantNumeric: 'tabular-nums' }}
        >
            {displayValue.toFixed(decimals)}
        </span>
    );
}
