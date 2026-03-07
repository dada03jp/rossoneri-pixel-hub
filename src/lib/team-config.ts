// チーム設定定義
// team_id (URL slug) に基づいてチーム名・配色・メタデータを提供

export interface TeamConfig {
    id: string;           // URL slug: "milan", "inter"
    name: string;         // "AC Milan"
    shortName: string;    // "Milan"
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        text: string;
    };
    kit: {
        home: { primary: string; secondary: string; stripe: boolean };
        away: { primary: string; secondary: string; stripe: boolean };
    };
    meta: {
        title: string;
        description: string;
        keywords: string[];
    };
}

export const TEAMS: Record<string, TeamConfig> = {
    milan: {
        id: 'milan',
        name: 'AC Milan',
        shortName: 'Milan',
        colors: {
            primary: '#AB0920',
            secondary: '#000000',
            accent: '#FB090B',
            text: '#FFFFFF',
        },
        kit: {
            home: { primary: '#AB0920', secondary: '#000000', stripe: true },
            away: { primary: '#FFFFFF', secondary: '#FAFAFF', stripe: false },
        },
        meta: {
            title: 'AC MILAN PIXEL HUB | ACミランファンコミュニティ',
            description: 'ACミランファンのための、熱狂と分析が共存するコミュニティサイト。試合採点、選手評価をドット絵UIで楽しもう。',
            keywords: ['AC Milan', 'ミラン', 'セリエA', 'サッカー', '採点', 'コミュニティ'],
        },
    },
    inter: {
        id: 'inter',
        name: 'Inter Milan',
        shortName: 'Inter',
        colors: {
            primary: '#0068A8',
            secondary: '#000000',
            accent: '#0068A8',
            text: '#FFFFFF',
        },
        kit: {
            home: { primary: '#0068A8', secondary: '#000000', stripe: true },
            away: { primary: '#FFFFFF', secondary: '#F0F0F0', stripe: false },
        },
        meta: {
            title: 'INTER PIXEL HUB | インテルファンコミュニティ',
            description: 'インテルファンのための、熱狂と分析が共存するコミュニティサイト。試合採点、選手評価をドット絵UIで楽しもう。',
            keywords: ['Inter Milan', 'インテル', 'セリエA', 'サッカー', '採点', 'コミュニティ'],
        },
    },
    juventus: {
        id: 'juventus',
        name: 'Juventus',
        shortName: 'Juve',
        colors: {
            primary: '#000000',
            secondary: '#FFFFFF',
            accent: '#000000',
            text: '#FFFFFF',
        },
        kit: {
            home: { primary: '#000000', secondary: '#FFFFFF', stripe: true },
            away: { primary: '#FDB913', secondary: '#000000', stripe: false },
        },
        meta: {
            title: 'JUVENTUS PIXEL HUB | ユヴェントスファンコミュニティ',
            description: 'ユヴェントスファンのための、熱狂と分析が共存するコミュニティサイト。試合採点、選手評価をドット絵UIで楽しもう。',
            keywords: ['Juventus', 'ユヴェントス', 'セリエA', 'サッカー', '採点', 'コミュニティ'],
        },
    },
};

/** team_id からチーム設定を取得。無効なIDの場合は undefined */
export function getTeamConfig(teamId: string): TeamConfig | undefined {
    return TEAMS[teamId.toLowerCase()];
}

/** デフォルトチーム */
export const DEFAULT_TEAM_ID = 'milan';

/** 有効な team_id の一覧 */
export function getValidTeamIds(): string[] {
    return Object.keys(TEAMS);
}
