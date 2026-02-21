import { createClient } from '@/lib/supabase/server';
import { AdminClient } from './client';
import { MatchEvent } from '@/types/database';

export default async function AdminPage() {
    const supabase = await createClient();

    // 試合一覧取得
    const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: false });

    // アクティブ選手のみ取得（背番号順、重複排除）
    const { data: allPlayers } = await supabase
        .from('players')
        .select('*')
        .eq('is_active', true)
        .order('number', { ascending: true });

    // 全イベント取得
    const { data: allEvents } = await supabase
        .from('match_events')
        .select('*')
        .order('minute', { ascending: true });

    // イベントを match_id ごとにグループ化
    const eventsByMatch: Record<string, MatchEvent[]> = {};
    (allEvents || []).forEach((event: any) => {
        const mid = event.match_id;
        if (!eventsByMatch[mid]) eventsByMatch[mid] = [];
        eventsByMatch[mid].push(event as MatchEvent);
    });

    // 選手の重複排除 (name で一意、背番号の若い方を残す)
    const seen = new Set<string>();
    const uniquePlayers = (allPlayers || []).filter((p: any) => {
        const key = p.name?.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    return (
        <AdminClient
            initialMatches={matches || []}
            initialPlayers={uniquePlayers}
            initialEvents={eventsByMatch}
        />
    );
}
