// チームカラー定義
// 主要なイタリアのクラブとヨーロッパのクラブ

export interface TeamColors {
    primary: string;    // 主要色
    secondary: string;  // 副色
    text: string;       // テキスト色
}

export const TEAM_COLORS: Record<string, TeamColors> = {
    // Serie A
    'Atalanta': { primary: '#1B3C95', secondary: '#000000', text: '#FFFFFF' },
    'Bologna': { primary: '#B01728', secondary: '#1A3562', text: '#FFFFFF' },
    'Cagliari': { primary: '#A50000', secondary: '#0D4DA1', text: '#FFFFFF' },
    'Cremonese': { primary: '#8B8B8B', secondary: '#FF0000', text: '#FFFFFF' },
    'Como': { primary: '#0033A0', secondary: '#FFFFFF', text: '#FFFFFF' },
    'Empoli': { primary: '#0000FF', secondary: '#FFFFFF', text: '#FFFFFF' },
    'Fiorentina': { primary: '#5E2E8C', secondary: '#FFFFFF', text: '#FFFFFF' },
    'Genoa': { primary: '#A91E1E', secondary: '#0E2A55', text: '#FFFFFF' },
    'Verona': { primary: '#FFCC00', secondary: '#0033A0', text: '#000000' },
    'Inter': { primary: '#0068A8', secondary: '#000000', text: '#FFFFFF' },
    'Juventus': { primary: '#000000', secondary: '#FFFFFF', text: '#FFFFFF' },
    'Lazio': { primary: '#87CEEB', secondary: '#FFFFFF', text: '#000000' },
    'Lecce': { primary: '#FFCC00', secondary: '#FF0000', text: '#000000' },
    'Monza': { primary: '#FF0000', secondary: '#FFFFFF', text: '#FFFFFF' },
    'Napoli': { primary: '#009FE3', secondary: '#FFFFFF', text: '#FFFFFF' },
    'Parma': { primary: '#FFCC00', secondary: '#0033A0', text: '#000000' },
    'Pisa': { primary: '#000080', secondary: '#FFFFFF', text: '#FFFFFF' },
    'Roma': { primary: '#8E1F2F', secondary: '#F4A300', text: '#FFFFFF' },
    'Sassuolo': { primary: '#00A652', secondary: '#000000', text: '#FFFFFF' },
    'Torino': { primary: '#811D1D', secondary: '#FFFFFF', text: '#FFFFFF' },
    'Udinese': { primary: '#000000', secondary: '#FFFFFF', text: '#FFFFFF' },
    'Venezia': { primary: '#004225', secondary: '#F58220', text: '#FFFFFF' },

    // Champions League
    'Liverpool': { primary: '#C8102E', secondary: '#FFFFFF', text: '#FFFFFF' },
    'Leverkusen': { primary: '#E32221', secondary: '#000000', text: '#FFFFFF' },
    'Club Brugge': { primary: '#0033A0', secondary: '#000000', text: '#FFFFFF' },
    'Real Madrid': { primary: '#FFFFFF', secondary: '#FEBE10', text: '#000000' },
    'Slovan': { primary: '#0033A0', secondary: '#FFFFFF', text: '#FFFFFF' },
    'Red Star': { primary: '#FF0000', secondary: '#FFFFFF', text: '#FFFFFF' },
    'Girona': { primary: '#CD2E3A', secondary: '#FFFFFF', text: '#FFFFFF' },
    'Dinamo Zagreb': { primary: '#0000FF', secondary: '#FFFFFF', text: '#FFFFFF' },
    'Feyenoord': { primary: '#FF0000', secondary: '#FFFFFF', text: '#FFFFFF' },

    // Coppa / Supercoppa
    'Bari': { primary: '#FF0000', secondary: '#FFFFFF', text: '#FFFFFF' },

    // 日本語名もマッピング（後方互換性）
    'アタランタ': { primary: '#1B3C95', secondary: '#000000', text: '#FFFFFF' },
    'ボローニャ': { primary: '#B01728', secondary: '#1A3562', text: '#FFFFFF' },
    'カリアリ': { primary: '#A50000', secondary: '#0D4DA1', text: '#FFFFFF' },
    'クレモネーゼ': { primary: '#8B8B8B', secondary: '#FF0000', text: '#FFFFFF' },
    'コモ': { primary: '#0033A0', secondary: '#FFFFFF', text: '#FFFFFF' },
    'エンポリ': { primary: '#0000FF', secondary: '#FFFFFF', text: '#FFFFFF' },
    'フィオレンティーナ': { primary: '#5E2E8C', secondary: '#FFFFFF', text: '#FFFFFF' },
    'ジェノア': { primary: '#A91E1E', secondary: '#0E2A55', text: '#FFFFFF' },
    'ヴェローナ': { primary: '#FFCC00', secondary: '#0033A0', text: '#000000' },
    'インテル': { primary: '#0068A8', secondary: '#000000', text: '#FFFFFF' },
    'ユヴェントス': { primary: '#000000', secondary: '#FFFFFF', text: '#FFFFFF' },
    'ラツィオ': { primary: '#87CEEB', secondary: '#FFFFFF', text: '#000000' },
    'レッチェ': { primary: '#FFCC00', secondary: '#FF0000', text: '#000000' },
    'モンツァ': { primary: '#FF0000', secondary: '#FFFFFF', text: '#FFFFFF' },
    'ナポリ': { primary: '#009FE3', secondary: '#FFFFFF', text: '#FFFFFF' },
    'パルマ': { primary: '#FFCC00', secondary: '#0033A0', text: '#000000' },
    'ピサ': { primary: '#000080', secondary: '#FFFFFF', text: '#FFFFFF' },
    'ローマ': { primary: '#8E1F2F', secondary: '#F4A300', text: '#FFFFFF' },
    'サッスオーロ': { primary: '#00A652', secondary: '#000000', text: '#FFFFFF' },
    'トリノ': { primary: '#811D1D', secondary: '#FFFFFF', text: '#FFFFFF' },
    'ウディネーゼ': { primary: '#000000', secondary: '#FFFFFF', text: '#FFFFFF' },
    'ヴェネツィア': { primary: '#004225', secondary: '#F58220', text: '#FFFFFF' },
    'リヴァプール': { primary: '#C8102E', secondary: '#FFFFFF', text: '#FFFFFF' },
    'レバークーゼン': { primary: '#E32221', secondary: '#000000', text: '#FFFFFF' },
    'クラブ・ブルッヘ': { primary: '#0033A0', secondary: '#000000', text: '#FFFFFF' },
    'レアル・マドリード': { primary: '#FFFFFF', secondary: '#FEBE10', text: '#000000' },
    'スロヴァン': { primary: '#0033A0', secondary: '#FFFFFF', text: '#FFFFFF' },
    'レッドスター': { primary: '#FF0000', secondary: '#FFFFFF', text: '#FFFFFF' },
    'ジローナ': { primary: '#CD2E3A', secondary: '#FFFFFF', text: '#FFFFFF' },
    'ディナモ・ザグレブ': { primary: '#0000FF', secondary: '#FFFFFF', text: '#FFFFFF' },
    'フェイエノールト': { primary: '#FF0000', secondary: '#FFFFFF', text: '#FFFFFF' },
    'バーリ': { primary: '#FF0000', secondary: '#FFFFFF', text: '#FFFFFF' },

    // デフォルト
    'default': { primary: '#6B7280', secondary: '#FFFFFF', text: '#FFFFFF' },
};

export function getTeamColors(teamName: string): TeamColors {
    return TEAM_COLORS[teamName] || TEAM_COLORS['default'];
}

// ACミランのユニフォーム色
export const MILAN_COLORS = {
    home: {
        primary: '#AB0920',     // 赤
        secondary: '#000000',   // 黒
        stripe: true,           // ストライプ
    },
    away: {
        primary: '#FFFFFF',     // 白
        secondary: '#FAFAFF',   // ライトグレー
        stripe: false,
    }
};
