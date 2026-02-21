import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 未ログインまたは管理者以外はリダイレクト
    if (!user || user.email !== 'marketing.workself@gmail.com') {
        redirect('/');
    }

    return (
        <div className="-mt-8 -mx-4">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-xl">⚙️</span>
                    <h1 className="text-lg font-bold tracking-tight">管理画面</h1>
                    <span className="text-xs bg-red-600 px-2 py-0.5 rounded-full font-medium">ADMIN</span>
                </div>
                <span className="text-xs text-slate-400">{user.email}</span>
            </div>
            <div className="px-4 py-6">
                {children}
            </div>
        </div>
    );
}
