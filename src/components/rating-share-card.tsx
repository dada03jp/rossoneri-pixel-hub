'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, X, Star, Sparkles, Share2 } from 'lucide-react';
import { useTeam } from '@/contexts/team-context';
import { showPixelToast } from '@/components/pixel-effects';
import type { PixelConfig } from '@/components/pixel-player';

interface PlayerRatingEntry {
    name: string;
    number: number;
    position: string;
    score: number;
}

interface FormationPlayer {
    id: string;
    name: string;
    number: number;
    score: number | null;
    x: number; // 0-100
    y: number; // 0-100
    pixel_config?: PixelConfig | null;
}

interface RatingShareCardProps {
    matchTitle: string;
    matchDate: string;
    competition: string;
    resultText: string;
    playerRatings: PlayerRatingEntry[];
    show: boolean;
    onClose: () => void;
    // フォーメーション図シェア用
    formationPlayers?: FormationPlayer[];
    formation?: string;
    userName?: string;
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

// Canvas上にPixelPlayerのドット絵を描画
const PIXEL_SKIN: Record<string, string> = { light: '#FFD5B8', medium: '#D4A574', dark: '#8B5A2B' };
const PIXEL_HAIR: Record<string, string> = { black: '#1A1A1A', brown: '#5C4033', blonde: '#DAA520' };
const PIXEL_BASE = [
  [0,0,0,0,0,2,2,2,2,2,2,0,0,0,0,0],
  [0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0],
  [0,0,0,0,2,1,1,1,1,1,1,2,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,0,1,6,1,1,1,6,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,0,0,0,1,1,7,1,1,1,0,0,0,0,0],
  [0,0,0,0,3,4,3,4,3,4,3,4,0,0,0,0],
  [0,0,0,3,4,3,4,3,4,3,4,3,4,0,0,0],
  [0,0,1,3,4,3,4,3,4,3,4,3,4,1,0,0],
  [0,0,1,3,4,3,4,3,4,3,4,3,4,1,0,0],
  [0,0,0,3,4,3,4,3,4,3,4,3,4,0,0,0],
  [0,0,0,0,5,5,5,5,5,5,5,5,0,0,0,0],
  [0,0,0,0,5,5,5,0,0,5,5,5,0,0,0,0],
  [0,0,0,0,1,1,1,0,0,1,1,1,0,0,0,0],
  [0,0,0,0,4,4,4,0,0,4,4,4,0,0,0,0],
];
const PIXEL_HAIR_STYLES: Record<string, number[][]> = {
  short: [[0,0,0,0,0,2,2,2,2,2,2,0,0,0,0,0],[0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0],[0,0,0,0,2,0,0,0,0,0,0,2,0,0,0,0]],
  medium: [[0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0],[0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0],[0,0,0,2,2,0,0,0,0,0,0,2,2,0,0,0]],
  bald: [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0]],
  afro: [[0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0],[0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0],[0,0,2,2,2,0,0,0,0,0,0,2,2,2,0,0]],
};

function drawPixelPlayerOnCanvas(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number,
    pixelSize: number,
    config: PixelConfig,
    kitPrimary: string, kitSecondary: string
) {
    const skinColor = PIXEL_SKIN[config.skinTone] || '#D4A574';
    const hairColor = PIXEL_HAIR[config.hairColor] || '#1A1A1A';
    const grid = PIXEL_BASE.map((row, ri) => {
        if (ri < 3) return PIXEL_HAIR_STYLES[config.hairStyle]?.[ri] || row;
        return row;
    });
    const getColor = (v: number): string | null => {
        switch (v) {
            case 0: return null;
            case 1: return skinColor;
            case 2: return hairColor;
            case 3: return kitPrimary;
            case 4: return kitSecondary;
            case 5: return '#FFFFFF';
            case 6: return '#1A1A1A';
            case 7: return '#CC0000';
            default: return null;
        }
    };
    const totalSize = 16 * pixelSize;
    const startX = cx - totalSize / 2;
    const startY = cy - totalSize / 2;
    for (let row = 0; row < 16; row++) {
        for (let col = 0; col < 16; col++) {
            const color = getColor(grid[row][col]);
            if (color) {
                ctx.fillStyle = color;
                ctx.fillRect(startX + col * pixelSize, startY + row * pixelSize, pixelSize, pixelSize);
            }
        }
    }
}

export function RatingShareCard({
    matchTitle,
    matchDate,
    competition,
    resultText,
    playerRatings,
    show,
    onClose,
    formationPlayers,
    formation,
    userName,
}: RatingShareCardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { team } = useTeam();
    const [copied, setCopied] = useState(false);
    const [shareTab, setShareTab] = useState<'list' | 'formation'>('list');

    const avgScore = playerRatings.length > 0
        ? playerRatings.reduce((s, p) => s + p.score, 0) / playerRatings.length
        : 0;

    // My MVP (highest score player)
    const myMvp = playerRatings.length > 0
        ? playerRatings.reduce((best, p) => p.score > best.score ? p : best, playerRatings[0])
        : null;

    // ====== レーティング一覧 Canvas ======
    const drawListCard = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = 640;
        const H = Math.min(900, 300 + playerRatings.length * 38 + 100);
        canvas.width = W;
        canvas.height = H;

        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, team.colors.primary);
        bgGrad.addColorStop(0.5, '#0a0a14');
        bgGrad.addColorStop(1, team.colors.secondary);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        drawPixelDots(ctx, W, H, team.colors.accent, 0.08);
        drawPixelDots(ctx, W, H, '#ffffff', 0.03);

        // トップバー
        const barGrad = ctx.createLinearGradient(0, 0, W, 0);
        barGrad.addColorStop(0, 'transparent');
        barGrad.addColorStop(0.2, team.colors.accent);
        barGrad.addColorStop(0.8, team.colors.accent);
        barGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = barGrad;
        ctx.fillRect(0, 0, W, 4);
        ctx.shadowColor = team.colors.accent;
        ctx.shadowBlur = 15;
        ctx.fillRect(0, 0, W, 2);
        ctx.shadowBlur = 0;

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚽ MATCH DAY REPORT', W / 2, 30);
        ctx.fillStyle = team.colors.accent;
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`━━  ${team.name.toUpperCase()} PIXEL HUB  ━━`, W / 2, 50);

        // カード
        const cardY = 62;
        const cardH = 90;
        drawRoundRect(ctx, 40, cardY, W - 80, cardH, 12);
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(matchTitle, W / 2, cardY + 32);
        ctx.font = 'bold 36px monospace';
        ctx.fillText(resultText, W / 2, cardY + 72);

        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = '11px monospace';
        ctx.fillText(`${competition} • ${new Date(matchDate).toLocaleDateString('ja-JP')}`, W / 2, cardY + cardH + 18);

        // 平均スコア
        const avgY = cardY + cardH + 55;
        const avgR = 36;
        const [avgC1, avgC2] = getScoreGradient(avgScore);
        const avgGrad = ctx.createRadialGradient(W / 2, avgY, 0, W / 2, avgY, avgR);
        avgGrad.addColorStop(0, avgC1);
        avgGrad.addColorStop(1, avgC2);
        ctx.beginPath();
        ctx.arc(W / 2, avgY, avgR + 4, 0, Math.PI * 2);
        ctx.fillStyle = avgC1;
        ctx.globalAlpha = 0.25;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(W / 2, avgY, avgR, 0, Math.PI * 2);
        ctx.fillStyle = avgGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 26px monospace';
        ctx.textBaseline = 'middle';
        ctx.fillText(avgScore.toFixed(1), W / 2, avgY);
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('MY AVERAGE', W / 2, avgY + avgR + 18);

        // 選手リスト
        const listStartY = avgY + avgR + 40;
        const rowH = 38;
        const maxDisplay = Math.min(playerRatings.length, 14);
        playerRatings.slice(0, maxDisplay).forEach((p, i) => {
            const y = listStartY + i * rowH;
            if (i % 2 === 0) {
                drawRoundRect(ctx, 45, y - 14, W - 90, rowH - 2, 6);
                ctx.fillStyle = 'rgba(255,255,255,0.04)';
                ctx.fill();
            }
            drawRoundRect(ctx, 53, y - 8, 28, 20, 4);
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${p.number}`, 67, y + 5);
            ctx.fillStyle = '#EEEEEE';
            ctx.font = '13px monospace';
            ctx.textAlign = 'left';
            const name = p.name.length > 18 ? p.name.slice(0, 16) + '..' : p.name;
            ctx.fillText(name, 90, y + 5);
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.font = '10px monospace';
            ctx.fillText(p.position, 335, y + 5);
            const scoreX = W - 75;
            const sColor = getScoreColor(p.score);
            drawRoundRect(ctx, scoreX - 24, y - 12 + 2, 48, 24, 6);
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

        // フッター
        const footerY = listStartY + maxDisplay * rowH + 28;
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('pixelhub.fan  ●  Made with ♥ and pixels', W / 2, footerY);

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

    // ====== フォーメーション図 Canvas ======
    const drawFormationCard = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // formationPlayers がない場合、playerRatings からフォールバック生成
        const effectivePlayers: FormationPlayer[] = (formationPlayers && formationPlayers.length > 0)
            ? formationPlayers
            : playerRatings.map((p, i) => {
                const posRow: Record<string, number> = { GK: 90, DF: 74, MF: 50, FW: 22 };
                const yBase = posRow[p.position] ?? 50;
                // 同ポジションの選手を等間隔で横に配置
                const samePos = playerRatings.filter(pr => pr.position === p.position);
                const idx = samePos.indexOf(p);
                const count = samePos.length;
                const x = count === 1 ? 50 : 15 + (70 / Math.max(count - 1, 1)) * idx;
                return {
                    id: `fallback-${i}`,
                    name: p.name,
                    number: p.number,
                    score: p.score,
                    x,
                    y: yBase,
                };
            });

        const W = 640;
        const H = 800;
        canvas.width = W;
        canvas.height = H;

        // 背景
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, team.colors.primary);
        bgGrad.addColorStop(0.3, '#0a0a14');
        bgGrad.addColorStop(1, team.colors.secondary);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);
        drawPixelDots(ctx, W, H, team.colors.accent, 0.06);

        // トップバー
        const barGrad = ctx.createLinearGradient(0, 0, W, 0);
        barGrad.addColorStop(0, 'transparent');
        barGrad.addColorStop(0.2, team.colors.accent);
        barGrad.addColorStop(0.8, team.colors.accent);
        barGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = barGrad;
        ctx.fillRect(0, 0, W, 4);

        // ヘッダー
        ctx.fillStyle = team.colors.accent;
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`━━  ${team.name.toUpperCase()} PIXEL HUB  ━━`, W / 2, 26);

        // 対戦カード
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px monospace';
        ctx.fillText(matchTitle, W / 2, 52);
        ctx.font = 'bold 28px monospace';
        ctx.fillText(resultText, W / 2, 82);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '10px monospace';
        ctx.fillText(`${competition} • ${new Date(matchDate).toLocaleDateString('ja-JP')} • ${formation || '4-3-3'}`, W / 2, 100);

        // ====== ピッチ ======
        const pitchX = 40;
        const pitchY = 115;
        const pitchW = W - 80;
        const pitchH = 480;

        // ピッチ背景
        const pitchGrad = ctx.createLinearGradient(pitchX, pitchY, pitchX, pitchY + pitchH);
        pitchGrad.addColorStop(0, '#2d8c3a');
        pitchGrad.addColorStop(0.5, '#248a32');
        pitchGrad.addColorStop(1, '#2d8c3a');
        drawRoundRect(ctx, pitchX, pitchY, pitchW, pitchH, 12);
        ctx.fillStyle = pitchGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // ピッチライン
        const cx = pitchX + pitchW / 2;
        const cy = pitchY + pitchH / 2;
        // ハーフライン
        ctx.beginPath();
        ctx.moveTo(pitchX + 10, cy);
        ctx.lineTo(pitchX + pitchW - 10, cy);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // センターサークル
        ctx.beginPath();
        ctx.arc(cx, cy, 35, 0, Math.PI * 2);
        ctx.stroke();
        // ペナルティエリア(上)
        drawRoundRect(ctx, cx - 50, pitchY, 100, 35, 0);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.stroke();
        // ペナルティエリア(下)
        drawRoundRect(ctx, cx - 50, pitchY + pitchH - 35, 100, 35, 0);
        ctx.stroke();

        // MVP特定
        const scoredPlayers = effectivePlayers.filter(fp => fp.score !== null);
        const mvpPlayer = scoredPlayers.length > 0
            ? scoredPlayers.reduce((best, cur) => (cur.score! > best.score! ? cur : best))
            : null;

        // 選手をピッチ上に配置
        const pixelUnit = 2.5; // 各ドット2.5px → 16*2.5 = 40px のドットアイコン
        effectivePlayers.forEach(fp => {
            const px = pitchX + (fp.x / 100) * pitchW;
            const py = pitchY + (fp.y / 100) * pitchH;
            const isMvp = mvpPlayer && fp.id === mvpPlayer.id;
            const iconHalf = 16 * pixelUnit / 2; // 20px

            // MVP: ゴールドグロー
            if (isMvp) {
                ctx.beginPath();
                ctx.arc(px, py, iconHalf + 8, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(250,204,21,0.35)';
                ctx.fill();
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 3;
                ctx.stroke();
                // ⭐マーク
                ctx.fillStyle = '#fbbf24';
                ctx.font = 'bold 14px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('⭐', px, py - iconHalf - 8);
            }

            // PixelPlayer ドットアイコン描画
            if (fp.pixel_config) {
                drawPixelPlayerOnCanvas(ctx, px, py, pixelUnit, fp.pixel_config, team.colors.primary, team.colors.secondary || '#000');
            } else {
                // フォールバック: 丸アイコン＋背番号
                ctx.beginPath();
                ctx.arc(px, py, 18, 0, Math.PI * 2);
                ctx.fillStyle = team.colors.primary;
                ctx.fill();
                ctx.strokeStyle = '#FFF';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = '#FFF';
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${fp.number}`, px, py);
                ctx.textBaseline = 'alphabetic';
            }

            // 名前ラベル（背景付き、大きめ）
            const shortName = fp.name.split(' ').pop() || fp.name;
            const labelText = shortName.slice(0, 8);
            ctx.font = `bold 11px monospace`;
            const labelWidth = ctx.measureText(labelText).width + 10;
            const labelY = py + iconHalf + 4;
            drawRoundRect(ctx, px - labelWidth / 2, labelY - 2, labelWidth, 16, 4);
            ctx.fillStyle = isMvp ? 'rgba(250,204,21,0.95)' : 'rgba(0,0,0,0.85)';
            ctx.fill();
            ctx.fillStyle = isMvp ? '#000' : '#FFF';
            ctx.textAlign = 'center';
            ctx.fillText(labelText, px, labelY + 11);

            // スコアバッジ（大きめ）
            if (fp.score !== null) {
                const sColor = getScoreColor(fp.score);
                const badgeW = 34;
                const badgeH = 18;
                const badgeX = px + iconHalf - 6;
                const badgeY = py - iconHalf - 4;
                drawRoundRect(ctx, badgeX - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 5);
                ctx.fillStyle = isMvp ? '#fbbf24' : sColor;
                ctx.fill();
                ctx.strokeStyle = isMvp ? '#f59e0b' : 'rgba(255,255,255,0.6)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.fillStyle = isMvp ? '#000' : '#FFF';
                ctx.font = 'bold 12px monospace';
                ctx.fillText(fp.score.toFixed(1), badgeX, badgeY + 5);
            }
        });

        // ====== 下部情報 ======
        const infoY = pitchY + pitchH + 20;

        // 左: チームチーム評価
        const ratedPlayers = effectivePlayers.filter(fp => fp.score !== null);
        const teamAvg = ratedPlayers.length > 0
            ? ratedPlayers.reduce((s, p) => s + (p.score || 0), 0) / ratedPlayers.length
            : 0;

        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('TEAM RATING', pitchX + 10, infoY);
        const [tc1] = getScoreGradient(teamAvg);
        ctx.fillStyle = tc1;
        ctx.font = 'bold 28px monospace';
        ctx.fillText(teamAvg.toFixed(1), pitchX + 10, infoY + 32);

        // 中央: My MVP
        if (myMvp) {
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('⭐ MY MVP', cx, infoY);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 14px monospace';
            ctx.fillText(`#${myMvp.number} ${myMvp.name.split(' ').pop()}`, cx, infoY + 20);
            ctx.fillStyle = getScoreColor(myMvp.score);
            ctx.font = 'bold 20px monospace';
            ctx.fillText(myMvp.score.toFixed(1), cx, infoY + 44);
        }

        // 右: 評価者名
        if (userName) {
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '10px monospace';
            ctx.textAlign = 'right';
            ctx.fillText('RATED BY', pitchX + pitchW - 10, infoY);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 13px monospace';
            ctx.fillText(userName, pitchX + pitchW - 10, infoY + 20);
        }

        // フッター
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('pixelhub.fan  ●  Made with ♥ and pixels', W / 2, H - 18);

        // ボトムバー
        const bottomBarGrad = ctx.createLinearGradient(0, 0, W, 0);
        bottomBarGrad.addColorStop(0, 'transparent');
        bottomBarGrad.addColorStop(0.2, team.colors.accent);
        bottomBarGrad.addColorStop(0.8, team.colors.accent);
        bottomBarGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = bottomBarGrad;
        ctx.fillRect(0, H - 3, W, 3);
    }, [matchTitle, matchDate, competition, resultText, formationPlayers, formation, team, userName, myMvp]);

    const drawCard = useCallback(() => {
        if (shareTab === 'formation' && formationPlayers) {
            drawFormationCard();
        } else {
            drawListCard();
        }
    }, [shareTab, formationPlayers, drawFormationCard, drawListCard]);

    useEffect(() => {
        if (show) {
            setTimeout(drawCard, 100);
        }
    }, [show, drawCard, shareTab]);

    const handleDownload = useCallback(async () => {
        drawCard();
        const canvas = canvasRef.current;
        if (!canvas) return;

        const fileName = `pixelhub-${team.shortName.toLowerCase()}-${shareTab === 'formation' ? 'formation' : 'ratings'}-${new Date().toISOString().slice(0, 10)}.png`;

        if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
            try {
                const blob = await new Promise<Blob>((resolve) =>
                    canvas.toBlob((b) => resolve(b!), 'image/png')
                );
                const file = new File([blob], fileName, { type: 'image/png' });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: `${team.name} PIXEL HUB - ${shareTab === 'formation' ? 'フォーメーション' : '採点カード'}`,
                    });
                    showPixelToast('共有しました！📸');
                    return;
                }
            } catch (e: any) {
                if (e?.name === 'AbortError') return;
            }
        }

        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showPixelToast('画像を保存しました！📸');
    }, [drawCard, team, shareTab]);

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

    // タブは常に表示

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
                        className="rounded-2xl border overflow-hidden max-w-md w-full max-h-[90vh] overflow-y-auto"
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
                        {/* ヘッダー */}
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

                        {/* シェアタイプ切替タブ */}
                        <div className="flex p-2 gap-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
                            <button
                                onClick={() => setShareTab('list')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                    shareTab === 'list'
                                        ? 'bg-white/10 text-white border border-white/20'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                                style={{ fontFamily: 'monospace' }}
                            >
                                📊 レーティング一覧
                            </button>
                            <button
                                onClick={() => setShareTab('formation')}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                    shareTab === 'formation'
                                        ? 'bg-white/10 text-white border border-white/20'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                                style={{ fontFamily: 'monospace' }}
                            >
                                ⚽ フォーメーション図
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
