import { createClient } from '@/lib/supabase/server';
import { MatchDetailClient } from './client';
import {
    getMatchById,
    getPlayersForMatch,
    getRatingsForMatch,
} from '@/lib/mock-data';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ id: string }>;
}

async function getMatch(id: string) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('matches')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return null;
        }
        return data;
    } catch (e) {
        console.error('Failed to fetch from Supabase:', e);
        return null;
    }
}

async function getMatchPlayers(matchId: string) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('match_players')
            .select(`
        *,
        player:players(*)
      `)
            .eq('match_id', matchId);

        if (error) {
            console.error('Supabase error:', error);
            return null;
        }

        if (!data) return null;

        return data.map((mp: any) => ({
            ...mp.player,
            is_starter: mp.is_starter
        }));
    } catch (e) {
        console.error('Failed to fetch from Supabase:', e);
        return null;
    }
}

async function getRatings(matchId: string) {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('ratings')
            .select('*')
            .eq('match_id', matchId);

        if (error) {
            console.error('Supabase error:', error);
            return null;
        }

        // Calculate average ratings per player
        const ratingsByPlayer: Record<string, number[]> = {};

        data.forEach((rating: any) => {
            if (!ratingsByPlayer[rating.player_id]) {
                ratingsByPlayer[rating.player_id] = [];
            }
            ratingsByPlayer[rating.player_id].push(rating.score);
        });

        const averages: Record<string, { average: number; count: number }> = {};

        Object.entries(ratingsByPlayer).forEach(([playerId, scores]) => {
            averages[playerId] = {
                average: scores.reduce((a, b) => a + b, 0) / scores.length,
                count: scores.length
            };
        });

        return averages;
    } catch (e) {
        console.error('Failed to fetch from Supabase:', e);
        return null;
    }
}

export default async function MatchDetailPage({ params }: PageProps) {
    const { id: matchId } = await params;

    // Try Supabase first, then fall back to mock data
    const supabaseMatch = await getMatch(matchId);
    const supabasePlayers = supabaseMatch ? await getMatchPlayers(matchId) : null;
    const supabaseRatings = supabaseMatch ? await getRatings(matchId) : null;

    // Use Supabase data or fall back to mock
    const match = supabaseMatch || getMatchById(matchId);
    const players = supabasePlayers || (match ? getPlayersForMatch(matchId) : []);
    const ratings = supabaseRatings || (match ? getRatingsForMatch(matchId) : {});
    const isUsingMockData = !supabaseMatch;

    if (!match) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <AlertCircle className="w-12 h-12 text-muted-foreground" />
                <h1 className="text-xl font-bold">試合が見つかりません</h1>
                <p className="text-muted-foreground">指定された試合IDが存在しません。</p>
                <Link
                    href="/"
                    className="text-primary hover:underline"
                >
                    ホームに戻る
                </Link>
            </div>
        );
    }

    return (
        <MatchDetailClient
            match={match}
            players={players}
            ratings={ratings}
            isUsingMockData={isUsingMockData}
        />
    );
}
