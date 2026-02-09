'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Season {
    id: string;
    name: string;
    start_year: number;
    end_year: number;
    is_current: boolean;
}

interface SeasonContextType {
    seasons: Season[];
    currentSeason: Season | null;
    selectedSeason: Season | null;
    setSelectedSeason: (season: Season) => void;
    loading: boolean;
}

const SeasonContext = createContext<SeasonContextType | undefined>(undefined);

export function SeasonProvider({ children }: { children: ReactNode }) {
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
    const [selectedSeason, setSelectedSeasonState] = useState<Season | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSeasons = async () => {
            const supabase = createClient();

            const { data, error } = await supabase
                .from('seasons')
                .select('*')
                .order('start_year', { ascending: false });

            if (error) {
                console.error('Error fetching seasons:', error);
                // Fallback to mock seasons if table doesn't exist yet
                const mockSeasons: Season[] = [
                    { id: 'mock-25-26', name: '25-26', start_year: 2025, end_year: 2026, is_current: true },
                    { id: 'mock-24-25', name: '24-25', start_year: 2024, end_year: 2025, is_current: false }
                ];
                setSeasons(mockSeasons);
                setCurrentSeason(mockSeasons[0]);
                setSelectedSeasonState(mockSeasons[0]);
                setLoading(false);
                return;
            }

            if (data && data.length > 0) {
                const seasonData = data as Season[];
                setSeasons(seasonData);
                const current = seasonData.find(s => s.is_current) || seasonData[0];
                setCurrentSeason(current);
                setSelectedSeasonState(current);
            }
            setLoading(false);
        };

        fetchSeasons();
    }, []);

    const setSelectedSeason = (season: Season) => {
        setSelectedSeasonState(season);
    };

    return (
        <SeasonContext.Provider value={{
            seasons,
            currentSeason,
            selectedSeason,
            setSelectedSeason,
            loading
        }}>
            {children}
        </SeasonContext.Provider>
    );
}

export function useSeason() {
    const context = useContext(SeasonContext);
    if (context === undefined) {
        throw new Error('useSeason must be used within a SeasonProvider');
    }
    return context;
}
