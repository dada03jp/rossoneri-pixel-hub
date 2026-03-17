'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Copy, Check, X, Star, Sparkles, Share2 } from 'lucide-react';
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
    if (score >= 8) return '#34d399';
    if (score >= 6) return '#fbbf24';
    if (score >= 4) return '#fb923c';
    return '#f87171';
}

function getScoreGradient(score: number): [string, string] {
    if (score >= 8) return ['#10b981', '#34d399'];
    if (score >= 6) return ['#f59e0b', '#fbbf24'];
    if (score >= 4) return ['#f97316', '#fb923c'];
    return ['#ef4444', '#f87171'];
}

// ピクセルドット装飾を描画するヘルパー
function drawPixelDots(ctx: CanvasRenderingContext2D, W: number, H: number, color: string, opacity: number = 0.06) {
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    for (let i = 0; i < 80; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        const s = 2 + Math.random() * 3;
        ctx.fillRect(Math.floor(x / 2) * 2, Math.floor(y / 2) * 2, s, s);
    }
    ctx.globalAlpha = 1;
}

// 角丸四角形ヘルパー（roundRect未対応ブラウザ用）
function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
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

        const W = 640;
        const H = Math.min(900, 300 + playerRatings.length * 38 + 100);
        canvas.width = W;
        canvas.height = H;

        // ====== 背景: チームカラーのリッチグラデーション ======
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, team.colors.primary);
        bgGrad.addColorStop(0.5, '#0a0a14');
        bgGrad.addColorStop(1, team.colors.secondary);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // ピクセルドット装飾
        drawPixelDots(ctx, W, H, team.colors.accent, 0.08);
        drawPixelDots(ctx, W, H, '#ffffff', 0.03);

        // ====== トップバー（チームカラーのグローイングライン） ======
        const barGrad = ctx.createLinearGradient(0, 0, W, 0);
        barGrad.addColorStop(0, 'transparent');
        barGrad.addColorStop(0.2, team.colors.accent);
        barGrad.addColorStop(0.8, team.colors.accent);
        barGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = barGrad;
        ctx.fillRect(0, 0, W, 4);
        // グロー
        ctx.shadowColor = team.colors.accent;
        ctx.shadowBlur = 15;
        ctx.fillRect(0, 0, W, 2);
        ctx.shadowBlur = 0;

        // ====== ヘッダー: チーム名 + ブランド ======
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚽ MATCH DAY REPORT', W / 2, 30);

        ctx.fillStyle = team.colors.accent;
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`━━  ${team.name.toUpperCase()} PIXEL HUB  ━━`, W / 2, 50);

        // ====== 試合カード（中央の半透明カード） ======
        const cardY = 62;
        const cardH = 90;
        const cardMargin = 40;
        drawRoundRect(ctx, cardMargin, cardY, W - cardMargin * 2, cardH, 12);
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 対戦タイトル
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(matchTitle, W / 2, cardY + 32);

        // スコア（大きく）
        ctx.font = 'bold 36px monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(resultText, W / 2, cardY + 72);

        // 大会・日付
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = '11px monospace';
        ctx.fillText(`${competition} • ${new Date(matchDate).toLocaleDateString('ja-JP')}`, W / 2, cardY + cardH + 18);

        // ====== 平均スコア（大きなグラデーション丸バッジ） ======
        const avgY = cardY + cardH + 55;
        const avgR = 36;
        const [avgC1, avgC2] = getScoreGradient(avgScore);
        const avgGrad = ctx.createRadialGradient(W / 2, avgY, 0, W / 2, avgY, avgR);
        avgGrad.addColorStop(0, avgC1);
        avgGrad.addColorStop(1, avgC2);

        // グローリング
        ctx.beginPath();
        ctx.arc(W / 2, avgY, avgR + 4, 0, Math.PI * 2);
        ctx.fillStyle = avgC1;
        ctx.globalAlpha = 0.25;
        ctx.fill();
        ctx.globalAlpha = 1;

        // 丸バッジ
        ctx.beginPath();
        ctx.arc(W / 2, avgY, avgR, 0, Math.PI * 2);
        ctx.fillStyle = avgGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // スコアテキスト
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 26px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(avgScore.toFixed(1), W / 2, avgY);
        ctx.textBaseline = 'alphabetic';

        // ラベル
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('MY AVERAGE', W / 2, avgY + avgR + 18);

        // ====== 選手リスト ======
        const listStartY = avgY + avgR + 40;
        const rowH = 38;
        const maxDisplay = Math.min(playerRatings.length, 14);
        const listPadding = 45;

        playerRatings.slice(0, maxDisplay).forEach((p, i) => {
            const y = listStartY + i * rowH;

            // 行背景（交互）
            if (i % 2 === 0) {
                drawRoundRect(ctx, listPadding, y - 14, W - listPadding * 2, rowH - 2, 6);
                ctx.fillStyle = 'rgba(255,255,255,0.04)';
                ctx.fill();
            }

            // 背番号バッジ
            drawRoundRect(ctx, listPadding + 8, y - 8, 28, 20, 4);
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${p.number}`, listPadding + 22, y + 5);

            // 名前
            ctx.fillStyle = '#EEEEEE';
            ctx.font = '13px monospace';
            ctx.textAlign = 'left';
            const name = p.name.length > 18 ? p.name.slice(0, 16) + '..' : p.name;
            ctx.fillText(name, listPadding + 45, y + 5);

            // ポジション
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.font = '10px monospace';
            ctx.fillText(p.position, listPadding + 290, y + 5);

            // スコアバッジ（色分け）
            const scoreX = W - listPadding - 30;
            const scoreW = 48;
            const scoreH = 24;
            const sColor = getScoreColor(p.score);
            drawRoundRect(ctx, scoreX - scoreW / 2, y - scoreH / 2 + 2, scoreW, scoreH, 6);
            ctx.fillStyle = sColor;
            ctx.globalAlpha = 0.15;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = sColor;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = sColor;
            ctx.font = 'bold 15px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(p.score.toFixed(1), scoreX, y + 7);
        });

        // ====== フッター ======
        const footerY = listStartY + maxDisplay * rowH + 28;
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('pixelhub.fan  ●  Made with ♥ and pixels', W / 2, footerY);

        // ボトムバー
        const bottomBarGrad = ctx.createLinearGradient(0, 0, W, 0);
        bottomBarGrad.addColorStop(0, 'transparent');
        bottomBarGrad.addColorStop(0.2, team.colors.accent);
        bottomBarGrad.addColorStop(0.8, team.colors.accent);
        bottomBarGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = bottomBarGrad;
        ctx.fillRect(0, H - 3, W, 3);
        ctx.shadowColor = team.colors.accent;
        ctx.shadowBlur = 10;
        ctx.fillRect(0, H - 2, W, 2);
        ctx.shadowBlur = 0;
    }, [matchTitle, matchDate, competition, resultText, playerRatings, team, avgScore]);

    // show時に自動描画
    useEffect(() => {
        if (show) {
            setTimeout(drawCard, 100);
        }
    }, [show, drawCard]);

    const handleDownload = useCallback(async () => {
        drawCard();
        const canvas = canvasRef.current;
        if (!canvas) return;

        // モバイル: Web Share APIで写真フォルダに保存可能
        if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
            try {
                const blob = await new Promise<Blob>((resolve) =>
                    canvas.toBlob((b) => resolve(b!), 'image/png')
                );
                const file = new File([blob], `pixelhub-${team.shortName.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.png`, {
                    type: 'image/png',
                });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `${team.name} PIXEL HUB - 採点カード`,
                    });
                    showPixelToast('共有しました！📸');
                    return;
                }
            } catch (e: any) {
                // ユーザーがキャンセルした場合はスルー
                if (e?.name === 'AbortError') return;
            }
        }

        // フォールバック: 通常ダウンロード
        const link = document.createElement('a');
        link.download = `pixelhub-${team.shortName.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showPixelToast('画像を保存しました！📸');
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
            showPixelToast('テキストをコピーしました！📋');
            setTimeout(() => setCopied(false), 2000);
        });
    }, [team, matchTitle, competition, matchDate, resultText, playerRatings, avgScore]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="rounded-2xl border overflow-hidden max-w-md w-full"
                        initial={{ scale: 0.85, y: 30 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.85, y: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            boxShadow: `0 25px 60px rgba(0,0,0,0.7), 0 0 40px ${team.colors.accent}22`,
                            background: `linear-gradient(135deg, ${team.colors.primary}18, #0a0a14, ${team.colors.secondary}18)`,
                            borderColor: `${team.colors.accent}33`,
                        }}
                    >
                        {/* ヘッダー — チームカラーグラデーション */}
                        <div
                            className="flex items-center justify-between p-4 border-b"
                            style={{
                                background: `linear-gradient(135deg, ${team.colors.primary}40, ${team.colors.accent}20)`,
                                borderColor: `${team.colors.accent}33`,
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <motion.div
                                    animate={{ rotate: [0, 15, -15, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Sparkles className="w-5 h-5" style={{ color: team.colors.accent }} />
                                </motion.div>
                                <span className="font-bold text-white text-sm" style={{ fontFamily: 'monospace' }}>
                                    📸 シェアしよう！
                                </span>
                            </div>
                            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* 平均スコアハイライト */}
                        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${team.colors.accent}22` }}>
                            <div>
                                <p className="text-gray-400 text-xs mb-0.5" style={{ fontFamily: 'monospace' }}>マイ平均</p>
                                <div className="flex items-center gap-2">
                                    <motion.div
                                        className="text-3xl font-black"
                                        style={{ color: getScoreColor(avgScore), fontFamily: 'monospace' }}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
                                    >
                                        {avgScore.toFixed(1)}
                                    </motion.div>
                                    <div className="flex">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: avgScore / 2 >= i ? 1 : 0.2, scale: 1 }}
                                                transition={{ delay: 0.3 + i * 0.1 }}
                                            >
                                                <Star
                                                    className="w-3.5 h-3.5"
                                                    style={{
                                                        color: avgScore / 2 >= i ? getScoreColor(avgScore) : '#333',
                                                        fill: avgScore / 2 >= i ? getScoreColor(avgScore) : 'transparent',
                                                    }}
                                                />
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-400 text-xs" style={{ fontFamily: 'monospace' }}>{playerRatings.length}人を評価</p>
                                <p className="text-white text-lg font-bold" style={{ fontFamily: 'monospace' }}>{resultText}</p>
                            </div>
                        </div>

                        {/* Canvas プレビュー */}
                        <div className="p-4 flex justify-center" style={{ background: 'rgba(0,0,0,0.2)' }}>
                            <canvas
                                ref={canvasRef}
                                className="w-full max-w-[300px] rounded-xl border"
                                style={{
                                    imageRendering: 'auto',
                                    boxShadow: `0 8px 30px rgba(0,0,0,0.5), 0 0 20px ${team.colors.accent}15`,
                                    borderColor: `${team.colors.accent}33`,
                                }}
                            />
                        </div>

                        {/* アクションボタン */}
                        <div className="p-4 pt-2 flex gap-2">
                            <motion.button
                                onClick={handleDownload}
                                className="flex-1 flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl text-sm border"
                                style={{
                                    background: `linear-gradient(135deg, ${team.colors.primary}, ${team.colors.accent})`,
                                    fontFamily: 'monospace',
                                    boxShadow: `0 4px 20px ${team.colors.accent}40`,
                                    borderColor: `${team.colors.accent}55`,
                                }}
                                whileHover={{ scale: 1.02, boxShadow: `0 6px 25px ${team.colors.accent}60` }}
                                whileTap={{ scale: 0.97 }}
                            >
                                <Share2 className="w-4 h-4" />
                                画像を保存・共有
                            </motion.button>
                            <motion.button
                                onClick={handleCopyText}
                                className="flex items-center justify-center gap-2 px-5 py-3.5 text-gray-200 font-bold rounded-xl text-sm border transition-colors"
                                style={{
                                    fontFamily: 'monospace',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderColor: 'rgba(255,255,255,0.1)',
                                }}
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
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
