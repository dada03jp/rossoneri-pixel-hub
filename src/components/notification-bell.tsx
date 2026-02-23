'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface NotificationItem {
    id: string;
    type: 'like' | 'reply';
    is_read: boolean;
    created_at: string;
    rating_id: string | null;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUserId(session.user.id);
                loadNotifications(session.user.id);
            }
        });
    }, []);

    const loadNotifications = async (uid: string) => {
        const supabase = createClient();
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', uid)
            .order('created_at', { ascending: false })
            .limit(20);
        if (data) setNotifications(data as NotificationItem[]);
    };

    const markAllRead = async () => {
        if (!userId) return;
        const supabase = createClient();
        await supabase
            .from('notifications')
            .update({ is_read: true } as any)
            .eq('user_id', userId)
            .eq('is_read', false);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (!userId) return null;

    return (
        <div className="relative">
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen && unreadCount > 0) markAllRead();
                }}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.2)' }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg border-2 border-gray-200 z-50 overflow-hidden"
                        style={{ boxShadow: '4px 4px 0px rgba(0,0,0,0.15)' }}>
                        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-sm font-bold">通知</span>
                            {unreadCount > 0 && (
                                <button onClick={markAllRead} className="text-xs text-primary">
                                    すべて既読
                                </button>
                            )}
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-400">
                                    通知はありません
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div key={n.id} className={`p-3 border-b border-gray-50 text-sm ${!n.is_read ? 'bg-blue-50/50' : ''
                                        }`}>
                                        <p className="text-gray-700">
                                            {n.type === 'like' ? '👍 あなたのコメントにいいねがつきました' : '💬 あなたのコメントに返信がありました'}
                                        </p>
                                        <span className="text-xs text-gray-400">
                                            {new Date(n.created_at).toLocaleDateString('ja-JP', {
                                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
