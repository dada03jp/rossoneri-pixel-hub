'use client';

import { useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2 } from 'lucide-react';
import { useTeam } from '@/contexts/team-context';

interface PlayerRatingEntry {
    name: string;
    number: number;
    position: string;
    score: number;
}

interface RatingShareCardProps {
    matchTitle: string;        // e.g. "AC Milan vs Juventus"
    matchDate: string;
    competition: string;
    resultText: string;        // e.g. "2 - 1"
    playerRatings: PlayerRatingEntry[];
    show: boolean;
    onClose: () => void;
}

function getScoreColor(score: number): string {
    if (score >= 8) return '#22c55e';
    if (score >= 6) return '#eab308';
    if (score >= 4) return '#f97316';
    return '#ef4444';
}

export function RatingShareCard({
    matchTitle,
    matchDate,
    competition,
    resultText,
    playerRatings,
    show,
    onClose,
}: RatingShareCardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { team } = useTeam();

    const drawCard = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = 600;
        const H = 800;
        canvas.width = W;
        canvas.height = H;

        // 背景
        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, W, H);

        // ピクセルグリッド背景
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        for (let x = 0; x < W; x += 8) {
            for (let y = 0; y < H; y += 8) {
                ctx.fillRect(x + 3, y + 3, 2, 2);
            }
        }

        // チームカラーヘッダーストライプ
        const stripeW = W / 2;
        ctx.fillStyle = team.colors.primary;
        ctx.fillRect(0, 0, stripeW, 6);
        ctx.fillStyle = team.colors.secondary === '#000000' ? team.colors.accent : team.colors.secondary;
        ctx.fillRect(stripeW, 0, stripeW, 6);

        // チーム名
        ctx.fillStyle = team.colors.accent;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${team.name.toUpperCase()} PIXEL HUB`, W / 2, 30);

        // タイトル
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px monospace';
        ctx.fillText(matchTitle, W / 2, 64);

        // サブ情報
        ctx.fillStyle = '#888888';
        ctx.font = '13px monospace';
        ctx.fillText(`${competition} • ${new Date(matchDate).toLocaleDateString('ja-JP')}`, W / 2, 88);

        // スコア
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px monospace';
        ctx.fillText(resultText, W / 2, 130);

        // 区切り
        ctx.strokeStyle = team.colors.primary;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(40, 150);
        ctx.lineTo(W - 40, 150);
        ctx.stroke();
        ctx.setLineDash([]);

        // MY RATINGS タイトル
        ctx.fillStyle = team.colors.accent;
        ctx.font = 'bold 14px monospace';
        ctx.fillText('📋 MY RATINGS', W / 2, 180);

        // 選手リスト
        const startY = 200;
        const rowH = 36;
        const maxDisplay = Math.min(playerRatings.length, 14);

        playerRatings.slice(0, maxDisplay).forEach((p, i) => {
            const y = startY + i * rowH;
            const isEven = i % 2 === 0;

            // 行背景
            if (isEven) {
                ctx.fillStyle = 'rgba(255,255,255,0.04)';
                ctx.fillRect(40, y - 12, W - 80, rowH);
            }

            // 背番号
            ctx.fillStyle = '#666666';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`#${p.number}`, 50, y + 6);

            // 名前
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '13px monospace';
            ctx.textAlign = 'left';
            const displayName = p.name.length > 20 ? p.name.slice(0, 18) + '..' : p.name;
            ctx.fillText(displayName, 95, y + 6);

            // ポジション
            ctx.fillStyle = '#888888';
            ctx.font = '10px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(p.position, 360, y + 6);

            // スコア
            ctx.fillStyle = getScoreColor(p.score);
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(p.score.toFixed(1), W - 50, y + 7);
        });

        // 平均スコア
        if (playerRatings.length > 0) {
            const avg = playerRatings.reduce((s, p) => s + p.score, 0) / playerRatings.length;
            const avgY = startY + maxDisplay * rowH + 20;

            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(40, avgY - 15);
            ctx.lineTo(W - 40, avgY - 15);
            ctx.stroke();

            ctx.fillStyle = '#AAAAAA';
            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'left';
            ctx.fillText('AVERAGE', 50, avgY + 5);

            ctx.fillStyle = getScoreColor(avg);
            ctx.font = 'bold 22px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(avg.toFixed(1), W - 50, avgY + 7);
        }

        // フッター
        ctx.fillStyle = '#444444';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('pixelhub.fan • Made with ♥ and pixels', W / 2, H - 20);

        // 下部ストライプ
        ctx.fillStyle = team.colors.primary;
        ctx.fillRect(0, H - 6, stripeW, 6);
        ctx.fillStyle = team.colors.secondary === '#000000' ? team.colors.accent : team.colors.secondary;
        ctx.fillRect(stripeW, H - 6, stripeW, 6);
    }, [matchTitle, matchDate, competition, resultText, playerRatings, team]);

    const handleDownload = useCallback(() => {
        drawCard();
        const canvas = canvasRef.current;
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `pixelhub-rating-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }, [drawCard]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-gray-900 rounded-xl border-2 border-gray-700 overflow-hidden max-w-lg w-full"
                        initial={{ scale: 0.8, y: 40 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.8, y: 40 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ boxShadow: '6px 6px 0px rgba(0,0,0,0.8)' }}
                    >
                        {/* プレビュー */}
                        <div className="p-4 flex justify-center">
                            <canvas
                                ref={canvasRef}
                                className="w-full max-w-[300px] rounded border border-gray-700"
                                style={{ imageRendering: 'pixelated' }}
                            />
                        </div>

                        {/* アクション */}
                        <div className="p-4 pt-0 flex gap-3">
                            <button
                                onClick={handleDownload}
                                className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-bold py-3 rounded-lg border-2 border-black text-sm hover:bg-gray-100 transition-colors"
                                style={{ boxShadow: '3px 3px 0px rgba(0,0,0,1)' }}
                            >
                                <Download className="w-4 h-4" />
                                ダウンロード
                            </button>
                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg border border-gray-600 text-sm hover:bg-gray-700 transition-colors"
                            >
                                閉じる
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// 自動描画のためのフック
export function useShareCard() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const triggerDraw = useCallback((drawFn: () => void) => {
        requestAnimationFrame(drawFn);
    }, []);

    return { canvasRef, triggerDraw };
}
