// Database Types for ROSSONERI PIXEL HUB

export interface Profile {
    id: string;
    username: string | null;
    avatar_url: string | null;
    is_premium: boolean;
    plan_type: 'free' | 'premium';
    stripe_customer_id?: string | null;
    role?: 'user' | 'admin';
    updated_at: string | null;
}

export interface Season {
    id: string;
    name: string;
    start_year: number;
    end_year: number;
    is_current: boolean;
}

export type MatchStatus = 'upcoming' | 'live' | 'finished';

export interface Match {
    id: string;
    team_id: string;
    opponent_name: string;
    match_date: string;
    home_score: number | null;
    away_score: number | null;
    is_finished: boolean;
    status: MatchStatus;
    competition: string | null;
    season_id: string | null;
    is_home: boolean | null;
    formation: string | null;
    external_id?: string | null;
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

// 詳細ロール
export type DetailedRole = 'GK' | 'CB' | 'WB' | 'DM' | 'CM' | 'AM' | 'ST';
// レガシー互換ロール
export type LegacyRole = 'GK' | 'DF' | 'MF' | 'FW';

export interface MatchLineup {
    id: string;
    match_id: string;
    player_id: string | null;
    player_name: string;
    jersey_number: number;
    is_starter: boolean;
    position_role: LegacyRole;
    role: DetailedRole | LegacyRole;
    position_side: 'Left' | 'Center' | 'Right';
    position_row: number; // 1:GK, 2:DF, 3:DM/WB, 4:CM/AM, 5:FW
    position_col?: number; // 1:左, 2:左寄り, 3:中央, 4:右寄り, 5:右
    position_x: number;
    position_y: number;
    minutes_played?: number;
}

export interface Player {
    id: string;
    team_id: string;
    name: string;
    number: number;
    position: string | null;
    is_active: boolean;
    pixel_config: {
        skinTone: 'light' | 'medium' | 'dark';
        hairStyle: 'short' | 'medium' | 'bald' | 'afro';
        hairColor: 'black' | 'brown' | 'blonde';
    } | null;
    external_id?: string | null;
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
    user_name: string | null;
    is_deleted?: boolean;
    created_at: string;
}

// ========== コミュニティ機能 ==========

export interface CommentLike {
    id: string;
    rating_id: string;
    user_id: string;
    created_at: string;
}

export interface CommentReply {
    id: string;
    rating_id: string;
    user_id: string;
    user_name?: string | null;
    content: string;
    parent_id?: string | null;
    is_deleted?: boolean;
    created_at: string;
}

export interface Notification {
    id: string;
    user_id: string;
    actor_id: string | null;
    type: 'like' | 'reply';
    rating_id: string | null;
    reply_id: string | null;
    is_read: boolean;
    created_at: string;
}

export interface Report {
    id: string;
    target_type: 'rating' | 'reply';
    target_id: string;
    reporter_id: string;
    reason: string;
    status: 'pending' | 'reviewed' | 'dismissed';
    created_at: string;
}

// ========== フォーメーションテンプレート ==========

export interface FormationTemplatePosition {
    role: DetailedRole;
    position_row: number;
    position_side: 'Left' | 'Center' | 'Right';
    position_col?: number;
}

export interface FormationTemplate {
    id: string;
    name: string;
    formation_type: string;
    positions: FormationTemplatePosition[];
    created_at: string;
}

// ========== View / 集計型 ==========

export interface PlayerSeasonStats {
    player_id: string;
    name: string;
    number: number;
    position: string | null;
    is_active: boolean;
    pixel_config: Player['pixel_config'];
    team_id: string;
    avg_rating: number;
    rated_matches: number;
    total_ratings: number;
    goals: number;
    assists: number;
    yellow_cards: number;
    red_cards: number;
    appearances: number;
}

export interface UserStats {
    total_ratings: number;
    matches_rated: number;
    favorite_player: {
        name: string;
        number: number;
        avg_score: number;
        count: number;
    } | null;
    recent_ratings: {
        score: number;
        comment: string | null;
        created_at: string;
        opponent_name: string;
        match_date: string;
        is_home: boolean;
        player_name: string;
        player_number: number;
    }[];
    rated_matches: {
        id: string;
        opponent_name: string;
        match_date: string;
        home_score: number;
        away_score: number;
        is_home: boolean;
        competition: string;
        player_count: number;
        avg_given: number;
    }[];
}

// ========== Join types ==========

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

export interface RatingWithLikes extends Rating {
    user?: Profile;
    likes_count: number;
    replies_count: number;
    user_has_liked: boolean;
    replies?: (CommentReply & { user?: Profile })[];
}

// ========== Database type for Supabase client ==========

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
            match_lineups: {
                Row: MatchLineup;
                Insert: Omit<MatchLineup, 'id'> & { id?: string };
                Update: Partial<MatchLineup>;
            };
            ratings: {
                Row: Rating;
                Insert: Omit<Rating, 'id' | 'created_at'> & { id?: string; created_at?: string };
                Update: Partial<Rating>;
            };
            comment_likes: {
                Row: CommentLike;
                Insert: Omit<CommentLike, 'id' | 'created_at'> & { id?: string; created_at?: string };
                Update: Partial<CommentLike>;
            };
            comment_replies: {
                Row: CommentReply;
                Insert: Omit<CommentReply, 'id' | 'created_at'> & { id?: string; created_at?: string };
                Update: Partial<CommentReply>;
            };
            notifications: {
                Row: Notification;
                Insert: Omit<Notification, 'id' | 'created_at' | 'is_read'> & { id?: string; created_at?: string; is_read?: boolean };
                Update: Partial<Notification>;
            };
            formation_templates: {
                Row: FormationTemplate;
                Insert: Omit<FormationTemplate, 'id' | 'created_at'> & { id?: string; created_at?: string };
                Update: Partial<FormationTemplate>;
            };
        };
        Views: {
            player_season_stats: {
                Row: PlayerSeasonStats;
            };
        };
        Functions: {
            get_user_stats: {
                Args: { target_user_id: string };
                Returns: UserStats;
            };
        };
    };
}
