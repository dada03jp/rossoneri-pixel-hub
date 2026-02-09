'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, MessageSquare, ChevronDown, ChevronUp, Reply, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Comment {
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
    replies?: CommentReply[];
}

interface CommentReply {
    id: string;
    userId: string;
    userName: string;
    content: string;
    createdAt: string;
}

interface CommentSectionProps {
    matchId: string;
    playerId?: string;
    comments: Comment[];
    onLike?: (commentId: string) => void;
    onReply?: (commentId: string, content: string) => void;
    compact?: boolean;
}

export function CommentSection({
    matchId,
    playerId,
    comments,
    onLike,
    onReply,
    compact = false
}: CommentSectionProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');

    // トップコメントを取得（いいね数最多、または最新）
    const topComment = comments.length > 0
        ? comments.reduce((best, current) =>
            current.likesCount > best.likesCount ? current : best
            , comments[0])
        : null;

    // いいね数が0の場合は最新を選ぶ
    const displayComment = topComment && topComment.likesCount === 0
        ? comments[comments.length - 1]
        : topComment;

    const handleReply = async (commentId: string) => {
        if (replyContent.trim() && onReply) {
            await onReply(commentId, replyContent);
            setReplyContent('');
            setReplyingTo(null);
        }
    };

    if (comments.length === 0) {
        return null;
    }

    return (
        <div className="mt-3 pt-3 border-t border-border/50">
            {/* トップコメント表示 */}
            {displayComment && (
                <div className="space-y-2">
                    <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                    {displayComment.userName || '匿名'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {displayComment.score.toFixed(1)}点
                                </span>
                            </div>
                            <p className="text-sm mt-0.5 line-clamp-2">
                                {displayComment.comment}
                            </p>
                        </div>
                        {onLike && (
                            <button
                                onClick={() => onLike(displayComment.id)}
                                className={`flex items-center gap-1 text-xs transition-colors ${displayComment.hasLiked
                                        ? 'text-primary'
                                        : 'text-muted-foreground hover:text-primary'
                                    }`}
                            >
                                <ThumbsUp className="w-3 h-3" />
                                {displayComment.likesCount > 0 && displayComment.likesCount}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* その他のコメントボタン */}
            {comments.length > 1 && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                >
                    <MessageSquare className="w-3 h-3" />
                    その他のコメント ({comments.length - 1}件)
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
            )}

            {/* 展開時のコメント一覧 */}
            {isExpanded && (
                <div className="mt-3 space-y-3 max-h-60 overflow-y-auto">
                    {comments
                        .filter(c => c.id !== displayComment?.id)
                        .map(comment => (
                            <div key={comment.id} className="bg-muted/30 rounded-lg p-2.5">
                                <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium">
                                                {comment.userName || '匿名'}
                                            </span>
                                            <span className="text-xs text-primary font-bold">
                                                {comment.score.toFixed(1)}点
                                            </span>
                                        </div>
                                        <p className="text-sm mt-0.5">{comment.comment}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {onLike && (
                                            <button
                                                onClick={() => onLike(comment.id)}
                                                className={`flex items-center gap-1 text-xs transition-colors ${comment.hasLiked
                                                        ? 'text-primary'
                                                        : 'text-muted-foreground hover:text-primary'
                                                    }`}
                                            >
                                                <ThumbsUp className="w-3 h-3" />
                                                {comment.likesCount > 0 && comment.likesCount}
                                            </button>
                                        )}
                                        {onReply && (
                                            <button
                                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                                className="text-xs text-muted-foreground hover:text-primary"
                                            >
                                                <Reply className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* 返信入力 */}
                                {replyingTo === comment.id && (
                                    <div className="flex gap-2 mt-2">
                                        <Input
                                            placeholder="返信を入力..."
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            className="flex-1 h-8 text-xs"
                                        />
                                        <Button
                                            size="sm"
                                            className="h-8 px-2"
                                            onClick={() => handleReply(comment.id)}
                                        >
                                            <Send className="w-3 h-3" />
                                        </Button>
                                    </div>
                                )}

                                {/* 返信一覧 */}
                                {comment.replies && comment.replies.length > 0 && (
                                    <div className="mt-2 pl-3 border-l-2 border-border/50 space-y-1">
                                        {comment.replies.map(reply => (
                                            <div key={reply.id} className="text-xs">
                                                <span className="font-medium">{reply.userName}</span>
                                                <span className="text-muted-foreground ml-1">{reply.content}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}

// コンパクト版（MVPカード用）
export function TopCommentDisplay({ comment }: { comment: Comment | null }) {
    if (!comment || !comment.comment) {
        return null;
    }

    return (
        <div className="mt-2 pt-2 border-t border-yellow-200/50">
            <div className="flex items-center gap-1 text-xs text-yellow-700">
                <MessageSquare className="w-3 h-3" />
                <span className="truncate">{comment.comment}</span>
            </div>
        </div>
    );
}

export default CommentSection;
