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

    // 選手取得(重複排除: name で DISTINCT)
    const { data: allPlayers } = await supabase
        .from('players')
        .select('*')
        .order('position, number');

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

    // 選手の重複排除 (name で一意)
    const uniquePlayers = (allPlayers || []).filter(
        (p: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.name === p.name) === i
    );

    return (
        <AdminClient
            initialMatches={matches || []}
            initialPlayers={uniquePlayers}
            initialEvents={eventsByMatch}
        />
    );
}
