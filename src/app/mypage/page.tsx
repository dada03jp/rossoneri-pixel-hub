import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MyPageClient } from './client';

export const dynamic = 'force-dynamic';

export default async function MyPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/');

    // プロフィール取得
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // get_user_stats RPC
    const { data: statsData } = await (supabase as any)
        .rpc('get_user_stats', { target_user_id: user.id });

    // get_user_highlights RPC
    const { data: highlightsData } = await (supabase as any)
        .rpc('get_user_highlights', { target_user_id: user.id });

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            <MyPageClient
                user={{
                    id: user.id,
                    name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'ミラニスタ',
                    email: user.email || '',
                    avatar_url: user.user_metadata?.avatar_url || null,
                    plan_type: (profile as any)?.plan_type || 'free',
                }}
                stats={statsData || {
                    total_ratings: 0,
                    matches_rated: 0,
                    favorite_player: null,
                    recent_ratings: [],
                    rated_matches: [],
                }}
                highlights={highlightsData || { top: null, worst: null }}
            />
        </div>
    );
}
