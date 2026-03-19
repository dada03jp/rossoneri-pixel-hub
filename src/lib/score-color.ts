/**
 * スコア色ルール (Home / Match Detail 共通)
 *
 * - 勝利チーム = 赤 (text-primary)
 * - 敗戦チーム = 通常色 (デフォルト)
 * - 引き分け = 両方通常色
 */
export function getScoreColor(
    homeScore: number,
    awayScore: number,
    side: 'home' | 'away'
): string {
    if (homeScore === awayScore) return '';
    const isWinner = side === 'home'
        ? homeScore > awayScore
        : awayScore > homeScore;
    return isWinner ? 'text-primary' : '';
}
