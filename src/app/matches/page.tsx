import { redirect } from 'next/navigation';

// 旧ルート: /matches → /{defaultTeamId}/matches へリダイレクト
// canonical URL は /{team_id}/matches に統一
const DEFAULT_TEAM_ID = 'milan';

export default async function LegacyMatchesPage({
    searchParams,
}: {
    searchParams: Promise<{ filter?: string }>;
}) {
    const params = await searchParams;
    const filterQuery = params.filter ? `?filter=${params.filter}` : '';
    redirect(`/${DEFAULT_TEAM_ID}/matches${filterQuery}`);
}
