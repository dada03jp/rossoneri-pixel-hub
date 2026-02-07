import { createClient } from '@/lib/supabase/server';
import { MatchCard } from '@/components/match-card';
import { PixelPlayer } from '@/components/pixel-player';
import { Calendar, Users, Star, TrendingUp, AlertCircle } from 'lucide-react';
import { MOCK_MATCHES, MOCK_PLAYERS } from '@/lib/mock-data';

async function getMatches() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: false });

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

  // Sort matches by date (newest first)
  const sortedMatches = [...matches].sort(
    (a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
  );

  // Separate finished and upcoming matches
  const finishedMatches = sortedMatches.filter(m => m.is_finished);
  const upcomingMatches = sortedMatches.filter(m => !m.is_finished);

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
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-background to-background border border-border p-8 md:p-12">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <div className="w-full h-full milan-stripes rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              <span className="text-primary">ROSSONERI</span>
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

          {/* Pixel Player Showcase */}
          <div className="flex items-end gap-1">
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

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold">今後の試合</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingMatches.map(match => (
              <MatchCard
                key={match.id}
                id={match.id}
                opponentName={match.opponent_name}
                matchDate={match.match_date}
                homeScore={match.home_score}
                awayScore={match.away_score}
                isFinished={match.is_finished}
                competition={match.competition || 'League'}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recent Results */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold">試合結果</h2>
          <span className="text-sm text-muted-foreground">- 選手採点受付中</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {finishedMatches.map(match => (
            <MatchCard
              key={match.id}
              id={match.id}
              opponentName={match.opponent_name}
              matchDate={match.match_date}
              homeScore={match.home_score}
              awayScore={match.away_score}
              isFinished={match.is_finished}
              competition={match.competition || 'League'}
            />
          ))}
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '最高評価選手', value: 'Rafael Leão', subtext: '平均 9.0' },
          { label: '直近の勝利', value: 'vs Juventus', subtext: '2-1' },
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
