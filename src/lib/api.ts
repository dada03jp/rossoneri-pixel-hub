// Supabase API functions for ROSSONERI PIXEL HUB
import { createClient } from './supabase/client';
import { Match, Player, Rating } from '@/types/database';
import { PixelConfig } from '@/components/pixel-player';

// Get all matches ordered by date
export async function getMatches() {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_date', { ascending: false });

    if (error) {
        console.error('Error fetching matches:', error);
        return [];
    }

    return data as Match[];
}

// Get a single match by ID
export async function getMatch(id: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching match:', error);
        return null;
    }

    return data as Match;
}

// Get all players
export async function getPlayers() {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('position', { ascending: true })
        .order('number', { ascending: true });

    if (error) {
        console.error('Error fetching players:', error);
        return [];
    }

    return data as (Player & { pixel_config: PixelConfig })[];
}

// Get players for a specific match
export async function getMatchPlayers(matchId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('match_players')
        .select(`
      *,
      player:players(*)
    `)
        .eq('match_id', matchId);

    if (error) {
        console.error('Error fetching match players:', error);
        return [];
    }

    // Extract player data from the join
    return (data as any[]).map((mp: any) => ({
        ...mp.player,
        is_starter: mp.is_starter
    })) as (Player & { pixel_config: PixelConfig; is_starter: boolean })[];
}

// Get ratings for a match with average calculation
export async function getMatchRatings(matchId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('match_id', matchId);

    if (error) {
        console.error('Error fetching ratings:', error);
        return {};
    }

    // Calculate average ratings per player
    const ratingsByPlayer: Record<string, { scores: number[]; comments: string[] }> = {};

    data.forEach((rating: Rating) => {
        if (!ratingsByPlayer[rating.player_id]) {
            ratingsByPlayer[rating.player_id] = { scores: [], comments: [] };
        }
        ratingsByPlayer[rating.player_id].scores.push(rating.score);
        if (rating.comment) {
            ratingsByPlayer[rating.player_id].comments.push(rating.comment);
        }
    });

    // Convert to average format
    const averages: Record<string, { average: number; count: number }> = {};

    Object.entries(ratingsByPlayer).forEach(([playerId, { scores }]) => {
        averages[playerId] = {
            average: scores.reduce((a, b) => a + b, 0) / scores.length,
            count: scores.length
        };
    });

    return averages;
}

// Get user's rating for a specific match/player
export async function getUserRating(userId: string, matchId: string, playerId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('user_id', userId)
        .eq('match_id', matchId)
        .eq('player_id', playerId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No rating found - this is normal
            return null;
        }
        console.error('Error fetching user rating:', error);
        return null;
    }

    return data as Rating;
}

// Submit or update a rating
export async function submitRating(
    userId: string,
    matchId: string,
    playerId: string,
    score: number,
    comment?: string
) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('ratings')
        .upsert({
            user_id: userId,
            match_id: matchId,
            player_id: playerId,
            score,
            comment: comment || null
        } as any, {
            onConflict: 'user_id,match_id,player_id'
        })
        .select()
        .single();

    if (error) {
        console.error('Error submitting rating:', error);
        throw error;
    }

    return data as Rating;
}

// Get current authenticated user
export async function getCurrentUser() {
    const supabase = createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    return user;
}

// Sign in with Google
export async function signInWithGoogle() {
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: typeof window !== 'undefined'
                ? `${window.location.origin}/auth/callback`
                : undefined
        }
    });

    if (error) {
        console.error('Error signing in:', error);
        throw error;
    }
}

// Sign out
export async function signOut() {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error('Error signing out:', error);
        throw error;
    }
}
