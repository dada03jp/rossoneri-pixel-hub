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

// ★ FIX #4: Track per-user scores independently from comments
// Maps player_id -> Map<user_id, { ratingId, score }>
type UserScoreEntry = { ratingId: string; score: number };
type UserScoreStore = Record<string, Map<string, UserScoreEntry>>;

function cloneStore(store: ScoreStore): ScoreStore {
    const cloned: ScoreStore = {};
    for (const [key, map] of Object.entries(store)) {
        cloned[key] = new Map(map);
    }
    return cloned;
}

function cloneUserScoreStore(store: UserScoreStore): UserScoreStore {
    const cloned: UserScoreStore = {};
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
    // ★ FIX #4: per-user score store (player_id -> user_id -> score)
    const userScoreStoreRef = useRef<UserScoreStore>({});
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
            .select('id, player_id, user_id, score')
            .eq('match_id', matchId);

        if (!ratingsError && ratingsData) {
            const newStore: ScoreStore = {};
            const newUserStore: UserScoreStore = {};
            ratingsData.forEach((r: { id: string; player_id: string; user_id: string; score: number }) => {
                if (!newStore[r.player_id]) newStore[r.player_id] = new Map();
                newStore[r.player_id].set(r.id, r.score);
                // ★ FIX #4: track per-user scores
                if (!newUserStore[r.player_id]) newUserStore[r.player_id] = new Map();
                newUserStore[r.player_id].set(r.user_id, { ratingId: r.id, score: r.score });
            });
            scoreStoreRef.current = newStore;
            userScoreStoreRef.current = newUserStore;
            if (isMounted.current) {
                setRatings(buildRatingData(newStore));
            }
        }

        // ★ コメント fetch: rating_comments テーブルから取得
        // rating_comments.rating_id → ratings.id で player_id を特定
        const { data: commentsData, error: commentsError } = await supabase
            .from('rating_comments')
            .select('id, rating_id, user_id, user_name, comment, is_deleted, is_edited, parent_comment_id, created_at, ratings!inner(player_id, score)')
            .in('rating_id', ratingsData ? ratingsData.map((r: any) => r.id) : [])
            .is('parent_comment_id', null) // root comments only
            .order('created_at', { ascending: false });

        if (!commentsError && commentsData && isMounted.current) {
            const processed: Record<string, ProcessedComment[]> = {};
            commentsData.forEach((c: any) => {
                const playerId = c.ratings?.player_id;
                const score = c.ratings?.score;
                if (!playerId) return;
                if (!processed[playerId]) processed[playerId] = [];
                processed[playerId].push({
                    id: c.id,
                    playerId: playerId,
                    playerName: '',
                    userId: c.user_id,
                    userName: c.user_name || 'ファン',
                    score: score || 0,
                    comment: c.is_deleted ? '削除されたコメントです' : c.comment,
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

        // ★ FIX #4: track per-user scores on INSERT
        if (row.user_id) {
            const uStore = cloneUserScoreStore(userScoreStoreRef.current);
            if (!uStore[row.player_id]) uStore[row.player_id] = new Map();
            uStore[row.player_id].set(row.user_id, { ratingId: row.id, score: row.score });
            userScoreStoreRef.current = uStore;
        }

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

        // ★ FIX #4: track per-user scores on UPDATE
        if (row.user_id) {
            const uStore = cloneUserScoreStore(userScoreStoreRef.current);
            if (!uStore[row.player_id]) uStore[row.player_id] = new Map();
            uStore[row.player_id].set(row.user_id, { ratingId: row.id, score: row.score });
            userScoreStoreRef.current = uStore;
        }

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
            // ★ FIX #5: remove old entry for same user before adding new
            // Find and remove existing ratingId for this user in this player
            const userEntry = userScoreStoreRef.current[playerId]?.get(userId);
            if (userEntry) {
                newStore[playerId].delete(userEntry.ratingId);
            }
            newStore[playerId].set(ratingId, score);
            return newStore;
        });

        // ★ FIX #4+#5: update user score store
        const uStore = cloneUserScoreStore(userScoreStoreRef.current);
        if (!uStore[playerId]) uStore[playerId] = new Map();
        uStore[playerId].set(userId, { ratingId, score });
        userScoreStoreRef.current = uStore;

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

    // ★ FIX #4: Get user ratings from userScoreStore, NOT from comments
    const getUserRatings = useCallback((userId: string): Record<string, number> => {
        const result: Record<string, number> = {};
        for (const [playerId, userMap] of Object.entries(userScoreStoreRef.current)) {
            const entry = userMap.get(userId);
            if (entry) {
                result[playerId] = entry.score;
            }
        }
        return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ratings]); // depend on ratings so it re-computes when store changes

    return {
        ratings,
        comments,
        isConnected,
        refresh: fetchAll,
        optimisticSubmit,
        getUserRatings,
    };
}
