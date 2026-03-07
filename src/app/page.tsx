import { redirect } from 'next/navigation';
import { DEFAULT_TEAM_ID } from '@/lib/team-config';

export default function RootPage() {
  redirect(`/${DEFAULT_TEAM_ID}`);
}
