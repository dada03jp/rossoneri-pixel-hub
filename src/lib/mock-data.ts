// Mock data for development and demo purposes
import { Match, Player, MatchPlayer } from '@/types/database';
import { PixelConfig } from '@/components/pixel-player';

export const MOCK_PLAYERS: (Player & { pixel_config: PixelConfig })[] = [
    {
        id: '1',
        name: 'Mike Maignan',
        number: 16,
        position: 'GK',
        pixel_config: { skinTone: 'dark', hairStyle: 'short', hairColor: 'black' },
    },
    {
        id: '2',
        name: 'Davide Calabria',
        number: 2,
        position: 'DF',
        pixel_config: { skinTone: 'light', hairStyle: 'short', hairColor: 'brown' },
    },
    {
        id: '3',
        name: 'Fikayo Tomori',
        number: 23,
        position: 'DF',
        pixel_config: { skinTone: 'dark', hairStyle: 'short', hairColor: 'black' },
    },
    {
        id: '4',
        name: 'Malick Thiaw',
        number: 28,
        position: 'DF',
        pixel_config: { skinTone: 'dark', hairStyle: 'short', hairColor: 'black' },
    },
    {
        id: '5',
        name: 'Theo Hernández',
        number: 19,
        position: 'DF',
        pixel_config: { skinTone: 'medium', hairStyle: 'medium', hairColor: 'brown' },
    },
    {
        id: '6',
        name: 'Ismaël Bennacer',
        number: 4,
        position: 'MF',
        pixel_config: { skinTone: 'medium', hairStyle: 'short', hairColor: 'black' },
    },
    {
        id: '7',
        name: 'Tijjani Reijnders',
        number: 14,
        position: 'MF',
        pixel_config: { skinTone: 'light', hairStyle: 'medium', hairColor: 'brown' },
    },
    {
        id: '8',
        name: 'Christian Pulisic',
        number: 11,
        position: 'MF',
        pixel_config: { skinTone: 'light', hairStyle: 'short', hairColor: 'brown' },
    },
    {
        id: '9',
        name: 'Rafael Leão',
        number: 10,
        position: 'FW',
        pixel_config: { skinTone: 'dark', hairStyle: 'afro', hairColor: 'black' },
    },
    {
        id: '10',
        name: 'Álvaro Morata',
        number: 7,
        position: 'FW',
        pixel_config: { skinTone: 'light', hairStyle: 'short', hairColor: 'brown' },
    },
    {
        id: '11',
        name: 'Samuel Chukwueze',
        number: 21,
        position: 'FW',
        pixel_config: { skinTone: 'dark', hairStyle: 'short', hairColor: 'black' },
    },
];

export const MOCK_MATCHES: Match[] = [
    {
        id: 'match-1',
        opponent_name: 'Juventus',
        match_date: '2026-02-10T20:45:00',
        home_score: 2,
        away_score: 1,
        is_finished: true,
        competition: 'Serie A',
        season_id: 'mock-25-26',
        is_home: true,
        formation: '4-3-3',
    },
    {
        id: 'match-2',
        opponent_name: 'Inter',
        match_date: '2026-02-17T20:45:00',
        home_score: null,
        away_score: null,
        is_finished: false,
        competition: 'Serie A',
        season_id: 'mock-25-26',
        is_home: false,
        formation: null,
    },
    {
        id: 'match-3',
        opponent_name: 'Napoli',
        match_date: '2026-02-03T18:00:00',
        home_score: 3,
        away_score: 0,
        is_finished: true,
        competition: 'Serie A',
        season_id: 'mock-25-26',
        is_home: true,
        formation: '4-3-3',
    },
    {
        id: 'match-4',
        opponent_name: 'Real Madrid',
        match_date: '2026-02-24T21:00:00',
        home_score: null,
        away_score: null,
        is_finished: false,
        competition: 'UCL',
        season_id: 'mock-25-26',
        is_home: false,
        formation: null,
    },
    {
        id: 'match-5',
        opponent_name: 'Roma',
        match_date: '2026-01-28T15:00:00',
        home_score: 1,
        away_score: 1,
        is_finished: true,
        competition: 'Serie A',
        season_id: 'mock-24-25',
        is_home: true,
        formation: '4-3-3',
    },
];

export const MOCK_MATCH_PLAYERS: Record<string, string[]> = {
    'match-1': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
    'match-3': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
    'match-5': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
};

export const MOCK_RATINGS: Record<string, Record<string, { average: number; count: number }>> = {
    'match-1': {
        '1': { average: 7.5, count: 24 },
        '2': { average: 6.5, count: 22 },
        '3': { average: 7.0, count: 23 },
        '4': { average: 6.8, count: 21 },
        '5': { average: 8.2, count: 28 },
        '6': { average: 7.0, count: 20 },
        '7': { average: 7.8, count: 25 },
        '8': { average: 8.5, count: 30 },
        '9': { average: 9.0, count: 35 },
        '10': { average: 7.2, count: 26 },
        '11': { average: 6.0, count: 18 },
    },
    'match-3': {
        '1': { average: 7.0, count: 15 },
        '2': { average: 7.5, count: 14 },
        '3': { average: 8.0, count: 16 },
        '4': { average: 7.8, count: 15 },
        '5': { average: 8.5, count: 18 },
        '6': { average: 7.2, count: 13 },
        '7': { average: 8.8, count: 19 },
        '8': { average: 9.2, count: 22 },
        '9': { average: 9.5, count: 25 },
        '10': { average: 8.0, count: 17 },
        '11': { average: 7.0, count: 12 },
    },
};

// Helper functions
export function getMatchById(id: string): Match | undefined {
    return MOCK_MATCHES.find(m => m.id === id);
}

export function getPlayersForMatch(matchId: string): (Player & { pixel_config: PixelConfig })[] {
    const playerIds = MOCK_MATCH_PLAYERS[matchId] || [];
    return MOCK_PLAYERS.filter(p => playerIds.includes(p.id));
}

export function getRatingsForMatch(matchId: string): Record<string, { average: number; count: number }> {
    return MOCK_RATINGS[matchId] || {};
}
