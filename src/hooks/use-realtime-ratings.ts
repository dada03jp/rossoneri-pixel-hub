'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';


interface RatingData {
    average: number;
    count: number;
}

interface Comment {
    id: string;
    playerId: string;
    players: { name: string };
    users: { email: string }; // ユーザー名はemailの@前を使用するか、profilesテーブルがあればそちらを使用
    score: number;
    comment: string;
    created_at: string;
    likes_count: { count: number }[];
    user_has_liked: { count: number }[];
}

interface ProcessedComment {
    id: string;
    playerId: string;
    playerName: string;
    userId: string; // 実際のIDは取得できないためplaceholder
    userName: string;
    score: number;
    comment: string;
    createdAt: string;
    likesCount: number;
    hasLiked: boolean;
}

interface UseRealtimeRatingsOptions {
    matchId: string;
    initialRatings: Record<string, RatingData>;
}

export function useRealtimeRatings({ matchId, initialRatings }: UseRealtimeRatingsOptions) {
    const [ratings, setRatings] = useState<Record<string, RatingData>>(initialRatings);
    const [comments, setComments] = useState<Record<string, ProcessedComment[]>>({});
    const [isConnected, setIsConnected] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // ユーザー取得
    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            setCurrentUser(data.user);
        });
    }, []);

    const fetchRatingsAndComments = useCallback(async () => {
        const supabase = createClient();

        // 1. 全評価を取得（平均計算用）
        const { data: ratingsData, error: ratingsError } = await supabase
            .from('ratings')
            .select('player_id, score')
            .eq('match_id', matchId);

        if (!ratingsError && ratingsData) {
            const ratingsByPlayer: Record<string, number[]> = {};
            ratingsData.forEach((r: any) => {
                if (!ratingsByPlayer[r.player_id]) ratingsByPlayer[r.player_id] = [];
                ratingsByPlayer[r.player_id].push(r.score);
            });

            const newRatings: Record<string, RatingData> = {};
            Object.entries(ratingsByPlayer).forEach(([pid, scores]) => {
                newRatings[pid] = {
                    average: scores.reduce((a, b) => a + b, 0) / scores.length,
                    count: scores.length
                };
            });
            setRatings(newRatings);
        }

        // 2. コメント付き評価を取得（最新順）
        // 注: ユーザー名はauth.usersと結合できないため、簡易的にemailから生成するか、別途profilesを取得する必要がある
        // ここでは一旦emailの@前を表示名とする（security上好ましくないが、metadataにnameがない場合）

        // 複雑なJOINクエリを避けるため、まずはコメントがあるratingのみ取得
        const { data: commentsData, error: commentsError } = await supabase
            .from('ratings')
            .select(`
                id,
                player_id,
                user_id,
                user_name,
                score,
                comment,
                created_at
            `)
            .eq('match_id', matchId)
            .neq('comment', '') // 空コメント除外
            .order('created_at', { ascending: false });

        if (!commentsError && commentsData) {
            // いいね数を取得するための別クエリ（本来はJOINしたいが、PostgRESTの制約を考慮し単純化）
            // N+1問題を避けるため、comment_likesテーブルから集計を取得するのが理想

            // クライアントサイドで加工
            const processed: Record<string, ProcessedComment[]> = {};

            commentsData.forEach((c: any) => {
                if (!processed[c.player_id]) processed[c.player_id] = [];

                processed[c.player_id].push({
                    id: c.id,
                    playerId: c.player_id,
                    playerName: '', // コンポーネント側で保管
                    userId: c.user_id,
                    userName: c.user_name || 'ミラニスタ', // DBのuser_nameを使用、なければデフォルト
                    score: c.score,
                    comment: c.comment,
                    createdAt: c.created_at,
                    likesCount: 0, // 実装簡略化のため一旦0
                    hasLiked: false
                });
            });

            setComments(processed);
        }

    }, [matchId]);

    useEffect(() => {
        fetchRatingsAndComments();

        const supabase = createClient();
        const channel = supabase
            .channel(`ratings:${matchId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'ratings',
                    filter: `match_id=eq.${matchId}`
                },
                () => {
                    fetchRatingsAndComments();
                }
            )
            .subscribe((status) => {
                setIsConnected(status === 'SUBSCRIBED');
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [matchId, fetchRatingsAndComments]);

    return { ratings, comments, isConnected, refresh: fetchRatingsAndComments };
}

