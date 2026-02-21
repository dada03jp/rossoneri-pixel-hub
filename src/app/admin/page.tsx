import { createClient } from '@/lib/supabase/server';
import { AdminClient } from './client';

export default async function AdminPage() {
    const supabase = await createClient();

    // 試合一覧取得
    const { data: matches } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: false });

    // アクティブ選手取得
    const { data: allPlayers } = await supabase
        .from('players')
        .select('*')
        .order('position, number');

    return (
        <AdminClient
            initialMatches={matches || []}
            initialPlayers={allPlayers || []}
        />
    );
}
