'use client';

import { createContext, useContext, ReactNode } from 'react';
import { TeamConfig, TEAMS, DEFAULT_TEAM_ID } from '@/lib/team-config';

interface TeamContextValue {
    team: TeamConfig;
}

const TeamContext = createContext<TeamContextValue>({
    team: TEAMS[DEFAULT_TEAM_ID],
});

interface TeamProviderProps {
    teamId: string;
    children: ReactNode;
}

export function TeamProvider({ teamId, children }: TeamProviderProps) {
    const team = TEAMS[teamId] || TEAMS[DEFAULT_TEAM_ID];

    return (
        <TeamContext.Provider value={{ team }}>
            {/* CSS変数をチームカラーで注入 */}
            <div
                style={{
                    '--team-primary': team.colors.primary,
                    '--team-secondary': team.colors.secondary,
                    '--team-accent': team.colors.accent,
                    '--team-text': team.colors.text,
                    '--team-kit-home-primary': team.kit.home.primary,
                    '--team-kit-home-secondary': team.kit.home.secondary,
                    '--team-kit-away-primary': team.kit.away.primary,
                    '--team-kit-away-secondary': team.kit.away.secondary,
                } as React.CSSProperties}
                className="contents"
            >
                {children}
            </div>
        </TeamContext.Provider>
    );
}

export function useTeam(): TeamContextValue {
    return useContext(TeamContext);
}
