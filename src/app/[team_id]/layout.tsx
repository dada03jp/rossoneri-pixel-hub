import { notFound } from 'next/navigation';
import { getTeamConfig, getValidTeamIds } from '@/lib/team-config';
import type { Metadata } from 'next';
import { TeamProvider } from '@/contexts/team-context';

interface LayoutProps {
    children: React.ReactNode;
    params: Promise<{ team_id: string }>;
}

export async function generateStaticParams() {
    return getValidTeamIds().map(id => ({ team_id: id }));
}

export async function generateMetadata({ params }: { params: Promise<{ team_id: string }> }): Promise<Metadata> {
    const { team_id } = await params;
    const team = getTeamConfig(team_id);
    if (!team) return {};

    return {
        title: team.meta.title,
        description: team.meta.description,
        keywords: team.meta.keywords,
    };
}

export default async function TeamLayout({ children, params }: LayoutProps) {
    const { team_id } = await params;
    const team = getTeamConfig(team_id);

    if (!team) {
        notFound();
    }

    return (
        <TeamProvider teamId={team_id}>
            {children}
        </TeamProvider>
    );
}
