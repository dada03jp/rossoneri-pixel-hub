'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    redirectUrl?: string; // Optional: specify where to redirect after login
}

export function LoginModal({ isOpen, onClose, redirectUrl }: LoginModalProps) {
    const handleGoogleLogin = async () => {
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl || (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback?next=${window.location.pathname}` : undefined),
            },
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[101]">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="w-[90%] max-w-sm bg-white rounded-xl shadow-2xl p-6 pointer-events-auto border border-gray-100 relative"
                        >
                            <button
                                onClick={onClose}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="flex flex-col items-center text-center space-y-4 pt-2">
                                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-1">
                                    <LogIn className="w-6 h-6 text-blue-600" />
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                                        ログインが必要です
                                    </h2>
                                    <p className="text-xs text-gray-500 max-w-[260px] mx-auto leading-relaxed">
                                        評価やコメントの投稿には<br />Googleアカウントでのログインが必要です
                                    </p>
                                </div>

                                <Button
                                    onClick={handleGoogleLogin}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-lg shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                                        <path
                                            fill="currentColor"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    Googleでログイン
                                </Button>

                                <button
                                    onClick={onClose}
                                    className="text-xs text-gray-400 hover:text-gray-600 font-medium pb-2 select-none"
                                >
                                    キャンセル
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
