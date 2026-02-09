'use client';

import { MatchEvent } from '@/types/database';

interface EventTimelineProps {
    events: MatchEvent[];
    showOnlyGoalsAndCards?: boolean; // デフォルトでtrue
}

const EVENT_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
    goal: { icon: '⚽', color: 'text-green-600', bg: 'bg-green-100' },
    yellow_card: { icon: '🟨', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    red_card: { icon: '🟥', color: 'text-red-600', bg: 'bg-red-100' },
};

const EVENT_LABELS: Record<string, string> = {
    goal: 'ゴール',
    yellow_card: 'イエローカード',
    red_card: 'レッドカード',
};

export function EventTimeline({ events, showOnlyGoalsAndCards = true }: EventTimelineProps) {
    // ゴールとカードのみにフィルタ
    const filteredEvents = showOnlyGoalsAndCards
        ? events.filter(e => ['goal', 'yellow_card', 'red_card'].includes(e.event_type))
        : events;

    // イベントを時間順にソート
    const sortedEvents = [...filteredEvents].sort((a, b) => a.minute - b.minute);

    if (sortedEvents.length === 0) {
        return null; // イベントがなければ何も表示しない
    }

    return (
        <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
                📋 主要イベント
            </h3>
            <div className="relative">
                {/* タイムライン線 */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

                <div className="space-y-2">
                    {sortedEvents.map((event) => {
                        const style = EVENT_ICONS[event.event_type] || EVENT_ICONS.goal;
                        return (
                            <div
                                key={event.id}
                                className="relative flex items-center gap-3 pl-3"
                            >
                                {/* 時間 */}
                                <div className="w-8 text-sm font-mono font-semibold text-muted-foreground">
                                    {event.minute}&apos;
                                </div>

                                {/* アイコン */}
                                <div
                                    className={`w-8 h-8 rounded-full ${style.bg} flex items-center justify-center text-sm z-10`}
                                >
                                    {style.icon}
                                </div>

                                {/* 内容 */}
                                <div className="flex-1 bg-card border border-border rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">
                                            {event.player_name}
                                        </span>
                                        <span className={`text-xs ${style.color} font-medium`}>
                                            {EVENT_LABELS[event.event_type]}
                                        </span>
                                    </div>
                                    {/* アシスト情報 */}
                                    {event.event_type === 'goal' && event.details?.assisted_by && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            🅰️ Assist: {String(event.details.assisted_by)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default EventTimeline;
