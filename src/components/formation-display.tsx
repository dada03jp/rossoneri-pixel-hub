'use client';

import { MatchLineup } from '@/types/database';

interface FormationDisplayProps {
    lineup: MatchLineup[];
    formation: string;
    isHome: boolean;
}

// フォーメーションに基づいたポジション座標マッピング
const FORMATION_POSITIONS: Record<string, Record<string, { x: number; y: number }[]>> = {
    '4-3-3': {
        GK: [{ x: 50, y: 90 }],
        DF: [
            { x: 15, y: 70 },
            { x: 35, y: 75 },
            { x: 65, y: 75 },
            { x: 85, y: 70 },
        ],
        MF: [
            { x: 30, y: 50 },
            { x: 50, y: 55 },
            { x: 70, y: 50 },
        ],
        FW: [
            { x: 20, y: 25 },
            { x: 50, y: 20 },
            { x: 80, y: 25 },
        ],
    },
    '4-2-3-1': {
        GK: [{ x: 50, y: 90 }],
        DF: [
            { x: 15, y: 70 },
            { x: 35, y: 75 },
            { x: 65, y: 75 },
            { x: 85, y: 70 },
        ],
        MF: [
            { x: 35, y: 55 },
            { x: 65, y: 55 },
            { x: 20, y: 35 },
            { x: 50, y: 40 },
            { x: 80, y: 35 },
        ],
        FW: [{ x: 50, y: 15 }],
    },
    '3-4-3': {
        GK: [{ x: 50, y: 90 }],
        DF: [
            { x: 25, y: 75 },
            { x: 50, y: 75 },
            { x: 75, y: 75 },
        ],
        MF: [
            { x: 15, y: 50 },
            { x: 38, y: 55 },
            { x: 62, y: 55 },
            { x: 85, y: 50 },
        ],
        FW: [
            { x: 20, y: 25 },
            { x: 50, y: 20 },
            { x: 80, y: 25 },
        ],
    },
};

export function FormationDisplay({ lineup, formation, isHome }: FormationDisplayProps) {
    const starters = lineup.filter(p => p.is_starter);
    const positions = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['4-3-3'];

    // ポジション別にグループ化
    const groupedByPosition: Record<string, MatchLineup[]> = {
        GK: starters.filter(p => p.position_role === 'GK'),
        DF: starters.filter(p => p.position_role === 'DF'),
        MF: starters.filter(p => p.position_role === 'MF'),
        FW: starters.filter(p => p.position_role === 'FW'),
    };

    // 選手にポジション座標を割り当て
    const playersWithPositions = Object.entries(groupedByPosition).flatMap(([role, players]) => {
        const rolePositions = positions[role] || [];
        return players.map((player, index) => ({
            ...player,
            displayX: rolePositions[index]?.x ?? 50,
            displayY: rolePositions[index]?.y ?? 50,
        }));
    });

    return (
        <div className="relative w-full aspect-[3/4] bg-gradient-to-b from-green-600 to-green-700 rounded-lg overflow-hidden">
            {/* ピッチライン */}
            <div className="absolute inset-0">
                {/* センターサークル */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/40 rounded-full" />
                {/* センターライン */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/40" />
                {/* ゴールエリア上 */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-12 border-2 border-t-0 border-white/40" />
                {/* ゴールエリア下 */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-12 border-2 border-b-0 border-white/40" />
                {/* ペナルティエリア上 */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 border-2 border-t-0 border-white/40" />
                {/* ペナルティエリア下 */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-20 border-2 border-b-0 border-white/40" />
            </div>

            {/* 選手アイコン */}
            {playersWithPositions.map((player) => (
                <div
                    key={player.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 group"
                    style={{
                        left: `${player.displayX}%`,
                        top: `${player.displayY}%`,
                    }}
                >
                    {/* 選手アイコン */}
                    <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-lg transition-transform group-hover:scale-110 ${isHome
                                ? 'bg-gradient-to-br from-red-600 to-red-800 text-white border-2 border-black'
                                : 'bg-white text-gray-900 border-2 border-gray-300'
                            }`}
                    >
                        {player.jersey_number}
                    </div>
                    {/* 選手名 */}
                    <span className="text-[10px] font-medium text-white bg-black/60 px-1.5 py-0.5 rounded whitespace-nowrap">
                        {player.player_name.split(' ').pop()}
                    </span>
                </div>
            ))}

            {/* フォーメーション表示 */}
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded">
                {formation}
            </div>
        </div>
    );
}

export default FormationDisplay;
