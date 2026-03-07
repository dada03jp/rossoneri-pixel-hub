'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useCallback, useRef } from 'react';
import type { Rating } from '@/types/database';

// ======== 型定義 ========

interface RatingData {
    average: number;
    count: number;
}

export interface ProcessedComment {
    id: string;
    playerId: string;
    playerName: string;
    userId: string;
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

// ======== Delta マージユーティリティ ========

/** 個別スコアを保持し、平均を即座に再計算するための内部ストア */
type ScoreStore = Record<string, Map<string, number>>;
// ScoreStore[playerId] = Map<ratingId, score>

function buildRatingData(store: ScoreStore): Record<string, RatingData> {
    const result: Record<string, RatingData> = {};
    for (const [playerId, scoreMap] of Object.entries(store)) {
        if (scoreMap.size === 0) continue;
        let sum = 0;
        scoreMap.forEach(s => { sum += s; });
        result[playerId] = {
            average: sum / scoreMap.size,
            count: scoreMap.size,
        };
    }
    return result;
}

// ======== バックグラウンド同期間隔 ========
const BACKGROUND_SYNC_INTERVAL_MS = 60_000; // 60秒

// ======== Hook本体 ========

export function useRealtimeRatings({ matchId, initialRatings }: UseRealtimeRatingsOptions) {
    const [ratings, setRatings] = useState<Record<string, RatingData>>(initialRatings);
    const [comments, setComments] = useState<Record<string, ProcessedComment[]>>({});
    const [isConnected, setIsConnected] = useState(false);

    // 内部スコアストア (ref で保持し、delta計算の元データとする)
    // initialRatings から仮の ScoreStore を生成（fetchAll で実データに上書きされる）
    const initialStore: ScoreStore = {};
    for (const [playerId, data] of Object.entries(initialRatings)) {
        const map = new Map<string, number>();
        for (let i = 0; i < data.count; i++) {
            map.set(`__init_${playerId}_${i}`, data.average);
        }
        initialStore[playerId] = map;
    }
    const scoreStoreRef = useRef<ScoreStore>(initialStore);
    const isMounted = useRef(true);

    // ======== 全件取得（初期ロード + バックグラウンド同期） ========
    const fetchAll = useCallback(async () => {
        const supabase = createClient();

        // 1. 評価データ全件取得
        const { data: ratingsData, error: ratingsError } = await supabase
            .from('ratings')
            .select('id, player_id, score')
            .eq('match_id', matchId);

        if (!ratingsError && ratingsData) {
            const newStore: ScoreStore = {};
            ratingsData.forEach((r: { id: string; player_id: string; score: number }) => {
                if (!newStore[r.player_id]) newStore[r.player_id] = new Map();
                newStore[r.player_id].set(r.id, r.score);
            });
            scoreStoreRef.current = newStore;
            if (isMounted.current) {
                setRatings(buildRatingData(newStore));
            }
        }

        // 2. コメント付き評価取得
        const { data: commentsData, error: commentsError } = await supabase
            .from('ratings')
            .select('id, player_id, user_id, user_name, score, comment, created_at')
            .eq('match_id', matchId)
            .neq('comment', '')
            .order('created_at', { ascending: false });

        if (!commentsError && commentsData && isMounted.current) {
            const processed: Record<string, ProcessedComment[]> = {};
            commentsData.forEach((c: {
                id: string;
                player_id: string;
                user_id: string;
                user_name: string | null;
                score: number;
                comment: string;
                created_at: string;
            }) => {
                if (!processed[c.player_id]) processed[c.player_id] = [];
                processed[c.player_id].push({
                    id: c.id,
                    playerId: c.player_id,
                    playerName: '',
                    userId: c.user_id,
                    userName: c.user_name || 'ファン',
                    score: c.score,
                    comment: c.comment,
                    createdAt: c.created_at,
                    likesCount: 0,
                    hasLiked: false,
                });
            });
            setComments(processed);
        }
    }, [matchId]);

    // ======== Delta マージ (INSERT) ========
    const mergeInsert = useCallback((payload: { new: Record<string, unknown> }) => {
        const row = payload.new as {
            id: string;
            player_id: string;
            score: number;
            comment: string | null;
            user_id: string;
            user_name: string | null;
            created_at: string;
        };

        // スコアストアに追加
        const store = scoreStoreRef.current;
        if (!store[row.player_id]) store[row.player_id] = new Map();
        store[row.player_id].set(row.id, row.score);

        // ratings state 更新
        setRatings(buildRatingData(store));

        // コメントがあれば comments state にも追加
        if (row.comment && row.comment.trim() !== '') {
            setComments(prev => {
                const playerComments = [...(prev[row.player_id] || [])];
                // 重複防止
                if (playerComments.some(c => c.id === row.id)) return prev;
                playerComments.unshift({
                    id: row.id,
                    playerId: row.player_id,
                    playerName: '',
                    userId: row.user_id,
                    userName: row.user_name || 'ファン',
                    score: row.score,
                    comment: row.comment || '',
                    createdAt: row.created_at,
                    likesCount: 0,
                    hasLiked: false,
                });
                return { ...prev, [row.player_id]: playerComments };
            });
        }
    }, []);

    // ======== Delta マージ (UPDATE) ========
    const mergeUpdate = useCallback((payload: { new: Record<string, unknown> }) => {
        const row = payload.new as {
            id: string;
            player_id: string;
            score: number;
            comment: string | null;
            user_name: string | null;
        };

        const store = scoreStoreRef.current;
        if (!store[row.player_id]) store[row.player_id] = new Map();
        store[row.player_id].set(row.id, row.score);

        setRatings(buildRatingData(store));

        // コメント更新
        setComments(prev => {
            const playerComments = [...(prev[row.player_id] || [])];
            const idx = playerComments.findIndex(c => c.id === row.id);
            if (idx >= 0) {
                if (row.comment && row.comment.trim() !== '') {
                    playerComments[idx] = { ...playerComments[idx], score: row.score, comment: row.comment };
                } else {
                    playerComments.splice(idx, 1);
                }
                return { ...prev, [row.player_id]: playerComments };
            } else if (row.comment && row.comment.trim() !== '') {
                // 新規コメント
                playerComments.unshift({
                    id: row.id,
                    playerId: row.player_id,
                    playerName: '',
                    userId: '',
                    userName: row.user_name || 'ファン',
                    score: row.score,
                    comment: row.comment,
                    createdAt: new Date().toISOString(),
                    likesCount: 0,
                    hasLiked: false,
                });
                return { ...prev, [row.player_id]: playerComments };
            }
            return prev;
        });
    }, []);

    // ======== 楽観的更新 ========
    const optimisticSubmit = useCallback((
        ratingId: string,
        playerId: string,
        score: number,
        comment: string,
        userName: string,
        userId: string,
    ) => {
        // スコアストアに即時反映
        const store = scoreStoreRef.current;
        if (!store[playerId]) store[playerId] = new Map();
        store[playerId].set(ratingId, score);
        setRatings(buildRatingData(store));

        // コメントも即時反映
        if (comment.trim() !== '') {
            setComments(prev => {
                const playerComments = [...(prev[playerId] || [])];
                const existingIdx = playerComments.findIndex(c => c.userId === userId);
                const newComment: ProcessedComment = {
                    id: ratingId,
                    playerId,
                    playerName: '',
                    userId,
                    userName,
                    score,
                    comment,
                    createdAt: new Date().toISOString(),
                    likesCount: 0,
                    hasLiked: false,
                };
                if (existingIdx >= 0) {
                    playerComments[existingIdx] = newComment;
                } else {
                    playerComments.unshift(newComment);
                }
                return { ...prev, [playerId]: playerComments };
            });
        }
    }, []);

    // ======== Realtime チャネル接続 + バックグラウンド同期 ========
    useEffect(() => {
        isMounted.current = true;

        // 初回フェッチ
        fetchAll();

        const supabase = createClient();
        const channel = supabase
            .channel(`ratings:${matchId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'ratings',
                    filter: `match_id=eq.${matchId}`,
                },
                (payload) => {
                    mergeInsert(payload as unknown as { new: Record<string, unknown> });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'ratings',
                    filter: `match_id=eq.${matchId}`,
                },
                (payload) => {
                    mergeUpdate(payload as unknown as { new: Record<string, unknown> });
                }
            )
            .subscribe((status) => {
                if (!isMounted.current) return;

                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    setIsConnected(false);
                    // 自動再接続: Supabase クライアントが内部で再試行するが、
                    // フォールバックとして5秒後に全件同期
                    setTimeout(() => {
                        if (isMounted.current) fetchAll();
                    }, 5000);
                } else {
                    setIsConnected(false);
                }
            });

        // バックグラウンド同期 (ドリフト防止)
        const syncTimer = setInterval(() => {
            if (isMounted.current) fetchAll();
        }, BACKGROUND_SYNC_INTERVAL_MS);

        return () => {
            isMounted.current = false;
            supabase.removeChannel(channel);
            clearInterval(syncTimer);
        };
    }, [matchId, fetchAll, mergeInsert, mergeUpdate]);

    return {
        ratings,
        comments,
        isConnected,
        refresh: fetchAll,
        optimisticSubmit,
    };
}
