import { createClient } from '@/lib/supabase/server';
import { MatchCard } from '@/components/match-card';
import { PixelPlayer } from '@/components/pixel-player';
import { TopRatedBanner } from '@/components/ranking-card';
import { Calendar, Users, Star, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react';
import { MOCK_MATCHES, MOCK_PLAYERS } from '@/lib/mock-data';
import Link from 'next/link';

// Helper to get ratings for a specific match
async function getMatchData(matchId: string) {
  const supabase = await createClient();
  const { data: ratingsData } = await supabase
    .from('ratings')
    .select('*, profiles(username)') // profiles(username) might fail if relation not set, use user_id if needed
    .eq('match_id', matchId);

  if (!ratingsData) return { ratings: {}, topComment: null };

  const ratings: Record<string, { average: number; count: number }> = {};
  const comments: any[] = [];

  ratingsData.forEach((r: any) => {
    // Calculate average
    if (!ratings[r.player_id]) {
      ratings[r.player_id] = { average: 0, count: 0, total: 0 } as any;
    }
    const current = ratings[r.player_id] as any;
    current.total += r.score;
    current.count += 1;
    current.average = current.total / current.count;

    // Collect comments
    if (r.comment) {
      comments.push({
        userName: r.profiles?.username || 'Milanista',
        comment: r.comment,
        score: r.score,
        createdAt: r.created_at
      });
    }
  });

  // Sort comments by date (newest first)
  comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return { ratings, topComment: comments[0] || null, totalComments: comments.length };
}

async function getMatches() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return null;
    }
    return data;
  } catch (e) {
    console.error('Failed to fetch from Supabase:', e);
    return null;
  }
}

async function getPlayers() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('number', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return null;
    }
    return data;
  } catch (e) {
    console.error('Failed to fetch from Supabase:', e);
    return null;
  }
}

export default async function Home() {
  // Try to fetch from Supabase, fall back to mock data
  const supabaseMatches = await getMatches();
  const supabasePlayers = await getPlayers();

  const matches = supabaseMatches || MOCK_MATCHES;
  const players = supabasePlayers || MOCK_PLAYERS;
  const isUsingMockData = !supabaseMatches;

  // 今後の試合: 昇順（近い順）
  const upcomingMatches = [...matches]
    .filter(m => !m.is_finished)
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());

  // 試合結果: 降順（最新順）
  const finishedMatches = [...matches]
    .filter(m => m.is_finished)
    .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

  // ホームページ表示用：次の4試合、最新の4結果
  const nextMatches = upcomingMatches.slice(0, 4);
  const recentResults = finishedMatches.slice(0, 4);

  // Get MVP data for the latest finished match
  const latestFinishedMatch = finishedMatches[0];
  const { ratings: latestRatings, topComment, totalComments } = latestFinishedMatch
    ? await getMatchData(latestFinishedMatch.id)
    : { ratings: {}, topComment: null, totalComments: 0 };

  // Get first 5 players for hero display
  const displayPlayers = players.slice(0, 5);

  return (
    <div className="space-y-12">
      {/* Debug Banner */}
      {isUsingMockData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div>
            <p className="text-sm text-yellow-800 font-medium">
              モックデータを使用中
            </p>
            <p className="text-xs text-yellow-600">
              Supabaseに接続できません。データベーステーブルを作成してください。
            </p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card to-muted/50 border border-border p-8">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <div className="w-full h-full milan-stripes rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              <span className="text-primary">AC MILAN</span>
              <br />
              <span>PIXEL HUB</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              ACミランファンのためのコミュニティ。
              試合ごとに選手を採点し、ミラニスタの声を集めよう。
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{matches.length}試合</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-primary" />
                <span>{players.length}選手</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Star className="w-4 h-4 text-primary" />
                <span>リアルタイム採点</span>
              </div>
            </div>
          </div>

          {/* Player showcase */}
          <div className="flex items-end gap-2">
            {displayPlayers.map((player, index) => (
              <div
                key={player.id}
                className="transform transition-transform hover:scale-110 hover:-translate-y-2"
                style={{
                  transform: `translateY(${Math.abs(index - 2) * 4}px)`,
                }}
              >
                {player.pixel_config && (
                  <PixelPlayer
                    config={player.pixel_config as any}
                    number={player.number}
                    size={index === 2 ? 80 : 64}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest MVP Section */}
      {latestFinishedMatch && Object.keys(latestRatings).length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-500" />
            <h2 className="text-2xl font-bold">前節のMVP & ハイライト</h2>
          </div>
          <TopRatedBanner
            players={players}
            ratings={latestRatings}
            topComment={topComment}
            totalComments={totalComments}
            matchId={latestFinishedMatch.id}
          />
        </section>
      )}

      {/* Recent Results - Last 4 (上に移動) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold">試合結果</h2>
            <span className="text-sm text-muted-foreground">- 選手採点受付中</span>
          </div>
          {finishedMatches.length > 4 && (
            <Link
              href="/matches?filter=finished"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              過去の試合一覧
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {recentResults.map(match => (
            <MatchCard
              key={match.id}
              id={match.id}
              opponentName={match.opponent_name}
              matchDate={match.match_date}
              homeScore={match.home_score}
              awayScore={match.away_score}
              isFinished={match.is_finished}
              competition={match.competition || 'League'}
              isHome={match.is_home ?? true}
            />
          ))}
        </div>
      </section>

      {/* Upcoming Matches - Next 4 (下に移動) */}
      {nextMatches.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">今後の試合</h2>
            </div>
            {upcomingMatches.length > 4 && (
              <Link
                href="/matches?filter=upcoming"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                すべて見る
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {nextMatches.map(match => (
              <MatchCard
                key={match.id}
                id={match.id}
                opponentName={match.opponent_name}
                matchDate={match.match_date}
                homeScore={match.home_score}
                awayScore={match.away_score}
                isFinished={match.is_finished}
                competition={match.competition || 'League'}
                isHome={match.is_home ?? true}
              />
            ))}
          </div>
        </section>
      )}

      {/* Quick Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '最高評価選手', value: 'Rafael Leão', subtext: '平均 9.0' },
          { label: '直近の勝利', value: 'vs Bologna', subtext: '3-0' },
          { label: '今季得点', value: '52', subtext: 'ゴール' },
          { label: 'コミュニティ', value: '1,234', subtext: '人が参加' },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-card border border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {stat.label}
            </p>
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-sm text-primary">{stat.subtext}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
