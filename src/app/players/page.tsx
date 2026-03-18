import { redirect } from 'next/navigation';

// 旧ルート: /players → /{defaultTeamId}/players へリダイレクト
// canonical URL は /{team_id}/players に統一
const DEFAULT_TEAM_ID = 'milan';

export default async function LegacyPlayersPage() {
    redirect(`/${DEFAULT_TEAM_ID}/players`);
}
