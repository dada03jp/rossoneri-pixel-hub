'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState, useCallback, useRef } from 'react';

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

/** 個別スコアを保持し、平均を即座に再計算するための内部ストア
 *  IMPORTANT: 不変性を保つため、更新時は必ず新しいオブジェクトを生成する
 */
type ScoreStore = Record<string, Map<string, number>>;

function cloneStore(store: ScoreStore): ScoreStore {
    const cloned: ScoreStore = {};
    for (const [key, map] of Object.entries(store)) {
        cloned[key] = new Map(map);
    }
    return cloned;
}

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
const BACKGROUND_SYNC_INTERVAL_MS = 60_000;

// ======== Hook本体 ========

export function useRealtimeRatings({ matchId, initialRatings }: UseRealtimeRatingsOptions) {
    const [ratings, setRatings] = useState<Record<string, RatingData>>(initialRatings);
    const [comments, setComments] = useState<Record<string, ProcessedComment[]>>({});
    const [isConnected, setIsConnected] = useState(false);

    // 内部スコアストア（ref で保持し delta 計算の元データとする）
    const scoreStoreRef = useRef<ScoreStore>({});
    const isMounted = useRef(true);
    const initializedRef = useRef(false);

    // ======== スコアストア更新ヘルパー（不変更新 + setState） ========
    const updateStore = useCallback((mutator: (store: ScoreStore) => ScoreStore) => {
        const newStore = mutator(scoreStoreRef.current);
        scoreStoreRef.current = newStore;
        if (isMounted.current) {
            setRatings(buildRatingData(newStore));
        }
    }, []);

    // ======== 全件取得（初期ロード + バックグラウンド同期） ========
    const fetchAll = useCallback(async () => {
        const supabase = createClient();

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

        initializedRef.current = true;
    }, [matchId]);

    // ======== Delta マージ (INSERT) — 不変更新 ========
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

        // スコアストアをクローンして更新（不変性保証）
        updateStore((store) => {
            const newStore = cloneStore(store);
            if (!newStore[row.player_id]) newStore[row.player_id] = new Map();
            newStore[row.player_id].set(row.id, row.score);
            return newStore;
        });

        // コメントがあれば追加（既存配列をスプレッドし先頭に追加）
        if (row.comment && row.comment.trim() !== '') {
            setComments(prev => {
                const existing = prev[row.player_id] || [];
                // 重複防止
                if (existing.some(c => c.id === row.id)) return prev;
                const newComment: ProcessedComment = {
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
                };
                return {
                    ...prev,
                    [row.player_id]: [newComment, ...existing],
                };
            });
        }
    }, [updateStore]);

    // ======== Delta マージ (UPDATE) — 不変更新 ========
    const mergeUpdate = useCallback((payload: { new: Record<string, unknown> }) => {
        const row = payload.new as {
            id: string;
            player_id: string;
            score: number;
            comment: string | null;
            user_id: string;
            user_name: string | null;
        };

        updateStore((store) => {
            const newStore = cloneStore(store);
            if (!newStore[row.player_id]) newStore[row.player_id] = new Map();
            newStore[row.player_id].set(row.id, row.score);
            return newStore;
        });

        // コメント更新（既存配列を正しくスプレッド）
        setComments(prev => {
            const existing = prev[row.player_id] || [];
            const idx = existing.findIndex(c => c.id === row.id);

            if (idx >= 0) {
                const updated = [...existing];
                if (row.comment && row.comment.trim() !== '') {
                    updated[idx] = { ...updated[idx], score: row.score, comment: row.comment };
                } else {
                    updated.splice(idx, 1);
                }
                return { ...prev, [row.player_id]: updated };
            } else if (row.comment && row.comment.trim() !== '') {
                const newComment: ProcessedComment = {
                    id: row.id,
                    playerId: row.player_id,
                    playerName: '',
                    userId: row.user_id || '',
                    userName: row.user_name || 'ファン',
                    score: row.score,
                    comment: row.comment,
                    createdAt: new Date().toISOString(),
                    likesCount: 0,
                    hasLiked: false,
                };
                return {
                    ...prev,
                    [row.player_id]: [newComment, ...existing],
                };
            }
            return prev;
        });
    }, [updateStore]);

    // ======== 楽観的更新 — 不変更新 ========
    const optimisticSubmit = useCallback((
        ratingId: string,
        playerId: string,
        score: number,
        comment: string,
        userName: string,
        userId: string,
    ) => {
        updateStore((store) => {
            const newStore = cloneStore(store);
            if (!newStore[playerId]) newStore[playerId] = new Map();
            newStore[playerId].set(ratingId, score);
            return newStore;
        });

        // コメントも即時反映（既存コメントを保持）
        if (comment.trim() !== '') {
            setComments(prev => {
                const existing = prev[playerId] || [];
                const existingIdx = existing.findIndex(c => c.userId === userId);
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
                    const updated = [...existing];
                    updated[existingIdx] = newComment;
                    return { ...prev, [playerId]: updated };
                }
                return {
                    ...prev,
                    [playerId]: [newComment, ...existing],
                };
            });
        }
    }, [updateStore]);

    // ======== Realtime チャネル接続 + バックグラウンド同期 ========
    useEffect(() => {
        isMounted.current = true;
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
                    setTimeout(() => {
                        if (isMounted.current) fetchAll();
                    }, 5000);
                } else {
                    setIsConnected(false);
                }
            });

        const syncTimer = setInterval(() => {
            if (isMounted.current) fetchAll();
        }, BACKGROUND_SYNC_INTERVAL_MS);

        return () => {
            isMounted.current = false;
            supabase.removeChannel(channel);
            clearInterval(syncTimer);
        };
    }, [matchId, fetchAll, mergeInsert, mergeUpdate]);

    // ======== ユーザー個別スコア取得 ========
    const getUserRatings = useCallback((userId: string): Record<string, number> => {
        const result: Record<string, number> = {};
        // comments からユーザーのスコアを取り出す
        for (const [playerId, playerComments] of Object.entries(comments)) {
            const userComment = playerComments.find(c => c.userId === userId);
            if (userComment) {
                result[playerId] = userComment.score;
            }
        }
        return result;
    }, [comments]);

    return {
        ratings,
        comments,
        isConnected,
        refresh: fetchAll,
        optimisticSubmit,
        getUserRatings,
    };
}
