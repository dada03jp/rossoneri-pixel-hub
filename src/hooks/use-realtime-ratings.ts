'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RatingData {
    average: number;
    count: number;
}

interface UseRealtimeRatingsOptions {
    matchId: string;
    initialRatings: Record<string, RatingData>;
}

export function useRealtimeRatings({ matchId, initialRatings }: UseRealtimeRatingsOptions) {
    const [ratings, setRatings] = useState<Record<string, RatingData>>(initialRatings);
    const [isConnected, setIsConnected] = useState(false);

    const recalculateRatings = useCallback(async () => {
        const supabase = createClient();

        const { data, error } = await supabase
            .from('ratings')
            .select('player_id, score')
            .eq('match_id', matchId);

        if (error) {
            console.error('Error fetching ratings:', error);
            return;
        }

        // 選手ごとに平均を計算
        const ratingsByPlayer: Record<string, number[]> = {};

        data.forEach((rating: { player_id: string; score: number }) => {
            if (!ratingsByPlayer[rating.player_id]) {
                ratingsByPlayer[rating.player_id] = [];
            }
            ratingsByPlayer[rating.player_id].push(rating.score);
        });

        const newRatings: Record<string, RatingData> = {};

        Object.entries(ratingsByPlayer).forEach(([playerId, scores]) => {
            newRatings[playerId] = {
                average: scores.reduce((a, b) => a + b, 0) / scores.length,
                count: scores.length
            };
        });

        setRatings(newRatings);
    }, [matchId]);

    useEffect(() => {
        const supabase = createClient();
        let channel: RealtimeChannel;

        const setupRealtimeSubscription = async () => {
            channel = supabase
                .channel(`ratings:${matchId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'ratings',
                        filter: `match_id=eq.${matchId}`
                    },
                    (payload) => {
                        console.log('Realtime update received:', payload);
                        // 採点が変更されたら再計算
                        recalculateRatings();
                    }
                )
                .subscribe((status) => {
                    console.log('Realtime subscription status:', status);
                    setIsConnected(status === 'SUBSCRIBED');
                });
        };

        setupRealtimeSubscription();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [matchId, recalculateRatings]);

    return { ratings, isConnected };
}
