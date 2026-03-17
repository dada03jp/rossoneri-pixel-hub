'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Copy, Check, X, Star } from 'lucide-react';
import { useTeam } from '@/contexts/team-context';
import { showPixelToast } from '@/components/pixel-effects';

interface PlayerRatingEntry {
    name: string;
    number: number;
    position: string;
    score: number;
}

interface RatingShareCardProps {
    matchTitle: string;
    matchDate: string;
    competition: string;
    resultText: string;
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

function getScoreBg(score: number): string {
    if (score >= 8) return 'rgba(34,197,94,0.15)';
    if (score >= 6) return 'rgba(234,179,8,0.1)';
    if (score >= 4) return 'rgba(249,115,22,0.1)';
    return 'rgba(239,68,68,0.1)';
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
    const [copied, setCopied] = useState(false);

    // 平均スコア
    const avgScore = playerRatings.length > 0
        ? playerRatings.reduce((s, p) => s + p.score, 0) / playerRatings.length
        : 0;

    const drawCard = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = 600;
        const H = Math.min(850, 240 + playerRatings.length * 36 + 80);
        canvas.width = W;
        canvas.height = H;

        // 背景グラデーション
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#0a0a0a');
        bgGrad.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // ピクセルドット背景
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        for (let x = 0; x < W; x += 6) {
            for (let y = 0; y < H; y += 6) {
                ctx.fillRect(x + 2, y + 2, 2, 2);
            }
        }

        // ヘッダーバー（チームカラー）
        const barGrad = ctx.createLinearGradient(0, 0, W, 0);
        barGrad.addColorStop(0, team.colors.primary);
        barGrad.addColorStop(1, team.colors.accent);
        ctx.fillStyle = barGrad;
        ctx.fillRect(0, 0, W, 5);

        // チーム名
        ctx.fillStyle = team.colors.accent;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`━━━  ${team.name.toUpperCase()} PIXEL HUB  ━━━`, W / 2, 28);

        // 対戦カード
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(matchTitle, W / 2, 58);

        // 大会・日付
        ctx.fillStyle = '#666666';
        ctx.font = '12px monospace';
        ctx.fillText(`${competition} • ${new Date(matchDate).toLocaleDateString('ja-JP')}`, W / 2, 78);

        // スコア（大きく）
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 42px monospace';
        ctx.fillText(resultText, W / 2, 125);

        // 平均スコアバッジ
        const avgY = 155;
        const badgeW = 180;
        const badgeH = 32;
        ctx.fillStyle = getScoreBg(avgScore);
        const bx = (W - badgeW) / 2;
        ctx.beginPath();
        ctx.roundRect(bx, avgY - badgeH / 2, badgeW, badgeH, 6);
        ctx.fill();
        ctx.strokeStyle = getScoreColor(avgScore);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#999999';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MY AVERAGE', W / 2 - 30, avgY + 4);

        ctx.fillStyle = getScoreColor(avgScore);
        ctx.font = 'bold 18px monospace';
        ctx.fillText(avgScore.toFixed(1), W / 2 + 55, avgY + 6);

        // 区切り
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(40, 180);
        ctx.lineTo(W - 40, 180);
        ctx.stroke();
        ctx.setLineDash([]);

        // 選手リスト
        const startY = 200;
        const rowH = 36;
        const maxDisplay = Math.min(playerRatings.length, 14);

        playerRatings.slice(0, maxDisplay).forEach((p, i) => {
            const y = startY + i * rowH;

            // 行背景（交互）
            if (i % 2 === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.03)';
                ctx.fillRect(35, y - 12, W - 70, rowH);
            }

            // 背番号
            ctx.fillStyle = '#555555';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`#${p.number}`, 45, y + 5);

            // 名前
            ctx.fillStyle = '#DDDDDD';
            ctx.font = '13px monospace';
            const name = p.name.length > 18 ? p.name.slice(0, 16) + '..' : p.name;
            ctx.fillText(name, 85, y + 5);

            // ポジション
            ctx.fillStyle = '#666666';
            ctx.font = '10px monospace';
            ctx.fillText(p.position, 340, y + 5);

            // スコアバッジ
            const scoreX = W - 70;
            const scoreW = 44;
            const scoreH = 22;
            ctx.fillStyle = getScoreBg(p.score);
            ctx.beginPath();
            ctx.roundRect(scoreX - scoreW / 2, y - scoreH / 2 + 2, scoreW, scoreH, 4);
            ctx.fill();

            ctx.fillStyle = getScoreColor(p.score);
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(p.score.toFixed(1), scoreX, y + 7);
        });

        // フッター
        const footerY = startY + maxDisplay * rowH + 25;
        ctx.fillStyle = '#333333';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('pixelhub.fan ● Made with ♥ and pixels', W / 2, footerY);

        // 下バー
        ctx.fillStyle = barGrad;
        ctx.fillRect(0, H - 4, W, 4);
    }, [matchTitle, matchDate, competition, resultText, playerRatings, team, avgScore]);

    // show時に自動描画
    useEffect(() => {
        if (show) {
            setTimeout(drawCard, 100);
        }
    }, [show, drawCard]);

    const handleDownload = useCallback(() => {
        drawCard();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `pixelhub-${team.shortName.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showPixelToast('画像を保存しました！');
    }, [drawCard, team]);

    const handleCopyText = useCallback(() => {
        const lines = [
            `🎮 ${team.name} PIXEL HUB`,
            `⚽ ${matchTitle}`,
            `📋 ${competition} | ${new Date(matchDate).toLocaleDateString('ja-JP')}`,
            `🏆 結果: ${resultText}`,
            '',
            '📊 MY RATINGS:',
            ...playerRatings.map(p => `  #${p.number} ${p.name}: ${p.score.toFixed(1)}`),
            '',
            `⭐ AVERAGE: ${avgScore.toFixed(1)}`,
            '',
            '#PixelHub #サッカー採点',
        ];
        navigator.clipboard.writeText(lines.join('\n')).then(() => {
            setCopied(true);
            showPixelToast('テキストをコピーしました！');
            setTimeout(() => setCopied(false), 2000);
        });
    }, [team, matchTitle, competition, matchDate, resultText, playerRatings, avgScore]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden max-w-md w-full"
                        initial={{ scale: 0.85, y: 30 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.85, y: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}
                    >
                        {/* ヘッダー */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-800">
                            <div className="flex items-center gap-2">
                                <Star className="w-5 h-5" style={{ color: team.colors.accent }} />
                                <span className="font-bold text-white text-sm" style={{ fontFamily: 'monospace' }}>
                                    🎮 マイ採点をシェア！
                                </span>
                            </div>
                            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* 平均スコアハイライト */}
                        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                            <div>
                                <p className="text-gray-400 text-xs" style={{ fontFamily: 'monospace' }}>平均採点</p>
                                <p className="text-2xl font-bold" style={{ color: getScoreColor(avgScore), fontFamily: 'monospace' }}>
                                    {avgScore.toFixed(1)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-400 text-xs" style={{ fontFamily: 'monospace' }}>{playerRatings.length}人を評価</p>
                                <p className="text-gray-300 text-sm font-bold" style={{ fontFamily: 'monospace' }}>{resultText}</p>
                            </div>
                        </div>

                        {/* Canvas プレビュー */}
                        <div className="p-4 flex justify-center bg-black/30">
                            <canvas
                                ref={canvasRef}
                                className="w-full max-w-[280px] rounded-lg border border-gray-800"
                                style={{ imageRendering: 'pixelated' }}
                            />
                        </div>

                        {/* アクションボタン */}
                        <div className="p-4 pt-2 flex gap-2">
                            <motion.button
                                onClick={handleDownload}
                                className="flex-1 flex items-center justify-center gap-2 text-black font-bold py-3 rounded-xl text-sm"
                                style={{
                                    background: `linear-gradient(135deg, ${team.colors.accent}, ${team.colors.primary})`,
                                    fontFamily: 'monospace',
                                    boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <Download className="w-4 h-4" />
                                画像保存
                            </motion.button>
                            <motion.button
                                onClick={handleCopyText}
                                className="flex items-center justify-center gap-2 px-5 py-3 bg-gray-800 text-gray-200 font-bold rounded-xl text-sm border border-gray-700 hover:bg-gray-700 transition-colors"
                                style={{ fontFamily: 'monospace' }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'コピー済' : 'テキスト'}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
