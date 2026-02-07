'use client';

import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

export function AuthButton() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const supabase = createClient();

        // 現在のユーザーを取得
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            setLoading(false);
        });

        // 認証状態の変更を監視
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const handleSignIn = async () => {
        setLoading(true);
        const supabase = createClient();

        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    const handleSignOut = async () => {
        setLoading(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="w-24 h-9 bg-muted animate-pulse rounded" />
        );
    }

    if (user) {
        return (
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    {user.user_metadata?.avatar_url ? (
                        <img
                            src={user.user_metadata.avatar_url}
                            alt="Avatar"
                            className="w-8 h-8 rounded-full border-2 border-primary"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-primary" />
                        </div>
                    )}
                    <span className="text-sm font-medium hidden md:block max-w-[100px] truncate">
                        {user.user_metadata?.name || user.email?.split('@')[0]}
                    </span>
                </div>
                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden md:inline">ログアウト</span>
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleSignIn}
            className="flex items-center gap-2 text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors"
        >
            <LogIn className="w-4 h-4" />
            ログイン
        </button>
    );
}
