import { redirect } from 'next/navigation';

// 旧ルート: /players/[id] → /{defaultTeamId}/players/[id] へリダイレクト
// canonical URL は /{team_id}/players/[id] に統一
const DEFAULT_TEAM_ID = 'milan';

export default async function LegacyPlayerDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    redirect(`/${DEFAULT_TEAM_ID}/players/${id}`);
}
