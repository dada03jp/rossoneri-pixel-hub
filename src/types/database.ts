// Database Types for ROSSONERI PIXEL HUB

export interface Profile {
    id: string;
    username: string | null;
    avatar_url: string | null;
    is_premium: boolean;
    updated_at: string | null;
}

export interface Season {
    id: string;
    name: string;
    start_year: number;
    end_year: number;
    is_current: boolean;
}

export interface Match {
    id: string;
    opponent_name: string;
    match_date: string;
    home_score: number | null;
    away_score: number | null;
    is_finished: boolean;
    competition: string | null;
    season_id: string | null;
    is_home: boolean | null;
    formation: string | null;
}

export interface MatchEvent {
    id: string;
    match_id: string;
    event_type: 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'substitution_in' | 'substitution_out';
    player_id: string | null;
    player_name: string;
    minute: number;
    details: Record<string, string>;
}

export interface MatchLineup {
    id: string;
    match_id: string;
    player_id: string | null;
    player_name: string;
    jersey_number: number;
    is_starter: boolean;
    position_role: 'GK' | 'DF' | 'MF' | 'FW';
    position_x: number;
    position_y: number;
}

export interface Player {
    id: string;
    name: string;
    number: number;
    position: string | null;
    pixel_config: {
        skinTone: 'light' | 'medium' | 'dark';
        hairStyle: 'short' | 'medium' | 'bald' | 'afro';
        hairColor: 'black' | 'brown' | 'blonde';
    } | null;
}

export interface PlayerSeason {
    id: string;
    player_id: string;
    season_id: string;
    jersey_number: number;
    is_active: boolean;
    joined_date: string | null;
    left_date: string | null;
}

export interface MatchPlayer {
    id: string;
    match_id: string;
    player_id: string;
    is_starter: boolean;
}

export interface Rating {
    id: string;
    user_id: string;
    match_id: string;
    player_id: string;
    score: number;
    comment: string | null;
    created_at: string;
}

// Join types for queries
export interface MatchWithDetails extends Match {
    match_players?: (MatchPlayer & { player: Player })[];
}

export interface PlayerWithRating extends Player {
    ratings?: Rating[];
    average_rating?: number;
    total_ratings?: number;
}

export interface RatingWithUser extends Rating {
    user?: Profile;
}

// Database type for Supabase client
export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: Profile;
                Insert: Omit<Profile, 'id'> & { id?: string };
                Update: Partial<Profile>;
            };
            matches: {
                Row: Match;
                Insert: Omit<Match, 'id'> & { id?: string };
                Update: Partial<Match>;
            };
            players: {
                Row: Player;
                Insert: Omit<Player, 'id'> & { id?: string };
                Update: Partial<Player>;
            };
            match_players: {
                Row: MatchPlayer;
                Insert: Omit<MatchPlayer, 'id'> & { id?: string };
                Update: Partial<MatchPlayer>;
            };
            ratings: {
                Row: Rating;
                Insert: Omit<Rating, 'id' | 'created_at'> & { id?: string; created_at?: string };
                Update: Partial<Rating>;
            };
        };
    };
}
