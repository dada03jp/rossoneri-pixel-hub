import { redirect } from 'next/navigation';

// 旧ルート: /matches/[id] → /{defaultTeamId}/matches/[id] へリダイレクト
// canonical URL は /{team_id}/matches/[id] に統一
const DEFAULT_TEAM_ID = 'milan';

export default async function LegacyMatchDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    redirect(`/${DEFAULT_TEAM_ID}/matches/${id}`);
}
