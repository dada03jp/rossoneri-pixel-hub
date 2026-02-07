import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function AuthErrorPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <AlertCircle className="w-16 h-16 text-destructive" />
            <h1 className="text-2xl font-bold">認証エラー</h1>
            <p className="text-muted-foreground text-center max-w-md">
                ログイン中にエラーが発生しました。<br />
                もう一度お試しください。
            </p>
            <Link
                href="/"
                className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
                ホームに戻る
            </Link>
        </div>
    );
}
