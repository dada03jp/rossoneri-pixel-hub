import type { Metadata } from "next";
import { Geist, Geist_Mono, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { SeasonProvider } from "@/contexts/season-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pressStart2P = Press_Start_2P({
  weight: "400",
  variable: "--font-pixel",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "AC MILAN PIXEL HUB | ACミランファンコミュニティ",
  description: "ACミランファンのための、熱狂と分析が共存するコミュニティサイト。試合採点、選手評価をドット絵UIで楽しもう。",
  keywords: ["AC Milan", "ミラン", "セリエA", "サッカー", "採点", "コミュニティ"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pressStart2P.variable} antialiased min-h-screen bg-background`}
      >
        <SeasonProvider>
          <Header />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-border mt-16">
            <div className="container mx-auto px-4 py-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 milan-stripes rounded" />
                  <span className="text-sm text-muted-foreground">
                    AC MILAN PIXEL HUB © 2026
                  </span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  このサイトはファンによる非公式サイトです。AC Milanとは直接の関係はありません。
                </p>
              </div>
            </div>
          </footer>
        </SeasonProvider>
      </body>
    </html>
  );
}

