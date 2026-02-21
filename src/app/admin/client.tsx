'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Match, Player, MatchEvent } from '@/types/database';
import { Trophy, Users, Settings, Plus, Save, Check, X, AlertTriangle } from 'lucide-react';

interface AdminClientProps {
    initialMatches: Match[];
    initialPlayers: Player[];
    initialEvents: Record<string, MatchEvent[]>;
}

type Tab = 'matches' | 'lineups' | 'players';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    upcoming: { label: '予定', color: 'bg-blue-100 text-blue-700' },
    live: { label: 'LIVE', color: 'bg-red-100 text-red-700 animate-pulse' },
    finished: { label: '終了', color: 'bg-gray-100 text-gray-700' },
};

export function AdminClient({ initialMatches, initialPlayers, initialEvents }: AdminClientProps) {
    const [tab, setTab] = useState<Tab>('matches');
    const [matches, setMatches] = useState<Match[]>(initialMatches);
    const [players, setPlayers] = useState<Player[]>(initialPlayers);
    const [matchEvents, setMatchEvents] = useState<Record<string, MatchEvent[]>>(initialEvents);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // ========== 試合管理 ==========
    const updateMatchScore = async (matchId: string, field: 'home_score' | 'away_score', delta: number) => {
        const match = matches.find(m => m.id === matchId);
        if (!match) return;

        const currentScore = (field === 'home_score' ? match.home_score : match.away_score) ?? 0;
        const newScore = Math.max(0, currentScore + delta);

        const supabase = createClient();
        const { error } = await supabase
            .from('matches')
            .update({ [field]: newScore } as any)
            .eq('id', matchId);

        if (error) {
            showMessage('error', `スコア更新失敗: ${error.message}`);
            return;
        }

        setMatches(prev => prev.map(m => m.id === matchId ? { ...m, [field]: newScore } : m));
        showMessage('success', 'スコア更新完了');
    };

    const updateMatchStatus = async (matchId: string, status: 'upcoming' | 'live' | 'finished') => {
        const supabase = createClient();
        const updateData: Record<string, unknown> = { status };
        if (status === 'finished') {
            updateData.is_finished = true;
        } else if (status === 'upcoming') {
            updateData.is_finished = false;
        }

        const { error } = await supabase
            .from('matches')
            .update(updateData as any)
            .eq('id', matchId);

        if (error) {
            showMessage('error', `ステータス更新失敗: ${error.message}`);
            return;
        }

        setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status, is_finished: status === 'finished' } as Match : m));
        showMessage('success', `ステータスを「${STATUS_LABELS[status].label}」に変更しました`);
    };

    // 新規試合追加
    const [showNewMatch, setShowNewMatch] = useState(false);
    const [newMatch, setNewMatch] = useState({
        opponent_name: '',
        match_date: '',
        competition: 'Serie A',
        is_home: true,
    });

    const addMatch = async () => {
        if (!newMatch.opponent_name || !newMatch.match_date) {
            showMessage('error', '対戦相手と日時を入力してください');
            return;
        }
        setSaving(true);
        const supabase = createClient();
        const { data, error } = await supabase
            .from('matches')
            .insert({
                opponent_name: newMatch.opponent_name,
                match_date: newMatch.match_date,
                competition: newMatch.competition,
                is_home: newMatch.is_home,
                status: 'upcoming',
                is_finished: false,
                home_score: 0,
                away_score: 0,
            } as any)
            .select()
            .single();

        setSaving(false);
        if (error) {
            showMessage('error', `試合追加失敗: ${error.message}`);
            return;
        }
        if (data) {
            setMatches(prev => [data as Match, ...prev]);
            setNewMatch({ opponent_name: '', match_date: '', competition: 'Serie A', is_home: true });
            setShowNewMatch(false);
            showMessage('success', '試合を追加しました');
        }
    };

    // ========== イベント管理 ==========
    const [eventMatchId, setEventMatchId] = useState<string>('');
    const [showEventForm, setShowEventForm] = useState(false);
    const [newEvent, setNewEvent] = useState({
        event_type: 'goal' as 'goal' | 'assist' | 'yellow_card' | 'red_card',
        player_id: '',
        minute: 0,
        assisted_by_id: '',
    });

    const addEvent = async () => {
        if (!eventMatchId || !newEvent.player_id || !newEvent.minute) {
            showMessage('error', '選手と分を入力してください');
            return;
        }
        const player = activePlayers.find(p => p.id === newEvent.player_id);
        if (!player) return;

        setSaving(true);
        const supabase = createClient();

        // 管理画面から追加するイベントはすべてミラン側
        const details: Record<string, unknown> = { is_milan: true };

        // アシスト情報を追加
        if (newEvent.event_type === 'goal' && newEvent.assisted_by_id) {
            const assistPlayer = activePlayers.find(p => p.id === newEvent.assisted_by_id);
            if (assistPlayer) {
                details.assisted_by = assistPlayer.name;
            }
        }

        const eventData: Record<string, unknown> = {
            match_id: eventMatchId,
            event_type: newEvent.event_type,
            player_id: newEvent.player_id,
            player_name: player.name,
            minute: newEvent.minute,
            details,
        };

        const { data, error } = await supabase
            .from('match_events')
            .insert(eventData as any)
            .select()
            .single();

        setSaving(false);
        if (error) {
            showMessage('error', `イベント追加失敗: ${error.message}`);
            return;
        }
        if (data) {
            setMatchEvents(prev => ({
                ...prev,
                [eventMatchId]: [...(prev[eventMatchId] || []), data as MatchEvent],
            }));
            setNewEvent({ event_type: 'goal', player_id: '', minute: 0, assisted_by_id: '' });
            setShowEventForm(false);
            showMessage('success', 'イベントを追加しました');
        }
    };

    const deleteEvent = async (eventId: string, matchId: string) => {
        const supabase = createClient();
        const { error } = await supabase.from('match_events').delete().eq('id', eventId);
        if (error) {
            showMessage('error', `削除失敗: ${error.message}`);
            return;
        }
        setMatchEvents(prev => ({
            ...prev,
            [matchId]: (prev[matchId] || []).filter(e => e.id !== eventId),
        }));
        showMessage('success', 'イベントを削除しました');
    };

    // ========== ラインナップ管理 ==========
    const [selectedMatchId, setSelectedMatchId] = useState<string>('');
    const [lineup, setLineup] = useState<Record<string, { selected: boolean; isStarter: boolean }>>({});
    const [loadingLineup, setLoadingLineup] = useState(false);

    const loadLineup = async (matchId: string) => {
        setSelectedMatchId(matchId);
        setLoadingLineup(true);
        const supabase = createClient();
        const { data } = await supabase
            .from('match_lineups')
            .select('*')
            .eq('match_id', matchId);

        const newLineup: Record<string, { selected: boolean; isStarter: boolean }> = {};
        activePlayers.forEach(p => {
            const existing = data?.find((ml: any) => ml.player_id === p.id);
            newLineup[p.id] = {
                selected: !!existing,
                isStarter: existing?.is_starter ?? false,
            };
        });
        setLineup(newLineup);
        setLoadingLineup(false);
    };

    const saveLineup = async () => {
        if (!selectedMatchId) return;
        setSaving(true);
        const supabase = createClient();

        await supabase.from('match_lineups').delete().eq('match_id', selectedMatchId);

        const entries = Object.entries(lineup)
            .filter(([_, v]) => v.selected)
            .map(([playerId, v]) => {
                const player = activePlayers.find(p => p.id === playerId);
                return {
                    match_id: selectedMatchId,
                    player_id: playerId,
                    player_name: player?.name || '',
                    jersey_number: player?.number || 0,
                    is_starter: v.isStarter,
                    position_role: player?.position || 'MF',
                };
            });

        if (entries.length > 0) {
            const { error } = await supabase.from('match_lineups').insert(entries as any);
            if (error) {
                showMessage('error', `ラインナップ保存失敗: ${error.message}`);
                setSaving(false);
                return;
            }
        }

        await supabase.from('match_players').delete().eq('match_id', selectedMatchId);
        const mpEntries = Object.entries(lineup)
            .filter(([_, v]) => v.selected)
            .map(([playerId, v]) => ({
                match_id: selectedMatchId,
                player_id: playerId,
                is_starter: v.isStarter,
            }));
        if (mpEntries.length > 0) {
            await supabase.from('match_players').insert(mpEntries as any);
        }

        setSaving(false);
        showMessage('success', `${entries.length}人のラインナップを保存しました`);
    };

    // ========== 選手管理 ==========
    const togglePlayerActive = async (playerId: string) => {
        const player = players.find(p => p.id === playerId);
        if (!player) return;
        const supabase = createClient();
        const { error } = await supabase
            .from('players')
            .update({ is_active: !player.is_active } as any)
            .eq('id', playerId);

        if (error) {
            showMessage('error', `選手更新失敗: ${error.message}`);
            return;
        }
        setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, is_active: !p.is_active } : p));
    };

    const [showNewPlayer, setShowNewPlayer] = useState(false);
    const [newPlayer, setNewPlayer] = useState({
        name: '', number: 0, position: 'MF',
    });

    const addPlayer = async () => {
        if (!newPlayer.name || !newPlayer.number) {
            showMessage('error', '名前と背番号を入力してください');
            return;
        }
        setSaving(true);
        const supabase = createClient();
        const { data, error } = await supabase
            .from('players')
            .insert({
                name: newPlayer.name,
                number: newPlayer.number,
                position: newPlayer.position,
                is_active: true,
                pixel_config: { skinTone: 'medium', hairStyle: 'short', hairColor: 'black' },
            } as any)
            .select()
            .single();

        setSaving(false);
        if (error) {
            showMessage('error', `選手追加失敗: ${error.message}`);
            return;
        }
        if (data) {
            setPlayers(prev => [...prev, data as Player]);
            setNewPlayer({ name: '', number: 0, position: 'MF' });
            setShowNewPlayer(false);
            showMessage('success', '選手を追加しました');
        }
    };

    // ========== ユーティリティ ==========
    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('ja-JP', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    // 重複排除: name で一意にする
    const uniquePlayers = players.filter((p, i, arr) => arr.findIndex(x => x.name === p.name) === i);
    const activePlayers = uniquePlayers.filter(p => p.is_active);
    const inactivePlayers = uniquePlayers.filter(p => !p.is_active);

    const EVENT_TYPE_LABELS: Record<string, string> = {
        goal: '⚽ ゴール',
        yellow_card: '🟨 イエローカード',
        red_card: '🟥 レッドカード',
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* メッセージ */}
            {message && (
                <div className={`fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                    {message.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {message.text}
                </div>
            )}

            {/* タブ */}
            <div className="flex gap-1 bg-muted p-1.5 rounded-xl">
                {([
                    { key: 'matches' as Tab, label: '試合管理', icon: Trophy },
                    { key: 'lineups' as Tab, label: 'ラインナップ', icon: Users },
                    { key: 'players' as Tab, label: '選手管理', icon: Settings },
                ]).map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <t.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{t.label}</span>
                    </button>
                ))}
            </div>

            {/* ===== 試合管理タブ ===== */}
            {tab === 'matches' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold">試合一覧</h2>
                        <button
                            onClick={() => setShowNewMatch(!showNewMatch)}
                            className="flex items-center gap-1.5 text-sm bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 active:scale-95 transition-all"
                        >
                            <Plus className="w-4 h-4" /> 試合追加
                        </button>
                    </div>

                    {/* 新規試合フォーム */}
                    {showNewMatch && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    placeholder="対戦相手（例: Juventus）"
                                    value={newMatch.opponent_name}
                                    onChange={e => setNewMatch(prev => ({ ...prev, opponent_name: e.target.value }))}
                                    className="px-4 py-3 border rounded-lg text-sm"
                                />
                                <input
                                    type="datetime-local"
                                    value={newMatch.match_date}
                                    onChange={e => setNewMatch(prev => ({ ...prev, match_date: e.target.value }))}
                                    className="px-4 py-3 border rounded-lg text-sm"
                                />
                                <select
                                    value={newMatch.competition}
                                    onChange={e => setNewMatch(prev => ({ ...prev, competition: e.target.value }))}
                                    className="px-4 py-3 border rounded-lg text-sm"
                                >
                                    <option value="Serie A">Serie A</option>
                                    <option value="UCL">UCL</option>
                                    <option value="Coppa Italia">Coppa Italia</option>
                                    <option value="Supercoppa">Supercoppa</option>
                                </select>
                                <label className="flex items-center gap-3 text-sm px-4 py-3 border rounded-lg bg-white cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newMatch.is_home}
                                        onChange={e => setNewMatch(prev => ({ ...prev, is_home: e.target.checked }))}
                                        className="w-5 h-5"
                                    />
                                    ホーム戦
                                </label>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={addMatch} disabled={saving}
                                    className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-all">
                                    <Save className="w-4 h-4" /> {saving ? '保存中...' : '追加'}
                                </button>
                                <button onClick={() => setShowNewMatch(false)}
                                    className="text-sm text-gray-500 px-4 py-2.5 hover:text-gray-700">キャンセル</button>
                            </div>
                        </div>
                    )}

                    {/* 試合リスト */}
                    <div className="space-y-3">
                        {matches.map(match => {
                            const minutesSinceKickoff = (Date.now() - new Date(match.match_date).getTime()) / 60000;
                            const shouldConfirm = match.status === 'live' && minutesSinceKickoff > 120;
                            const events = matchEvents[match.id] || [];

                            return (
                                <div key={match.id} className={`border rounded-xl p-4 space-y-4 ${shouldConfirm ? 'border-orange-300 bg-orange-50' : 'border-border bg-white'
                                    }`}>
                                    {shouldConfirm && (
                                        <div className="flex items-center gap-2 text-xs text-orange-700 font-medium bg-orange-100 px-3 py-2 rounded-lg">
                                            <AlertTriangle className="w-4 h-4" />
                                            120分経過 — 試合終了を確認してください
                                        </div>
                                    )}

                                    {/* ヘッダー */}
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_LABELS[match.status || 'upcoming']?.color || ''}`}>
                                                {STATUS_LABELS[match.status || 'upcoming']?.label || match.status}
                                            </span>
                                            <span className="font-bold text-sm">
                                                {match.is_home ? 'Milan' : match.opponent_name} vs {match.is_home ? match.opponent_name : 'Milan'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs text-muted-foreground mr-1">{match.competition}</span>
                                            <span className="text-xs text-muted-foreground">{formatDate(match.match_date)}</span>
                                        </div>
                                    </div>

                                    {/* スコア操作 - モバイルフレンドリー */}
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-xs text-muted-foreground font-medium">{match.is_home ? 'Milan' : match.opponent_name?.slice(0, 8)}</span>
                                            <div className="flex items-center gap-1.5">
                                                <button onClick={() => updateMatchScore(match.id, 'home_score', -1)}
                                                    className="w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-lg font-bold transition-all active:scale-90 select-none">−</button>
                                                <span className="w-12 text-center font-mono font-bold text-2xl">{match.home_score ?? 0}</span>
                                                <button onClick={() => updateMatchScore(match.id, 'home_score', 1)}
                                                    className="w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-lg font-bold transition-all active:scale-90 select-none">+</button>
                                            </div>
                                        </div>
                                        <span className="text-xl text-muted-foreground font-bold">-</span>
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-xs text-muted-foreground font-medium">{match.is_home ? match.opponent_name?.slice(0, 8) : 'Milan'}</span>
                                            <div className="flex items-center gap-1.5">
                                                <button onClick={() => updateMatchScore(match.id, 'away_score', -1)}
                                                    className="w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-lg font-bold transition-all active:scale-90 select-none">−</button>
                                                <span className="w-12 text-center font-mono font-bold text-2xl">{match.away_score ?? 0}</span>
                                                <button onClick={() => updateMatchScore(match.id, 'away_score', 1)}
                                                    className="w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-lg font-bold transition-all active:scale-90 select-none">+</button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ステータスボタン - モバイルフレンドリー */}
                                    <div className="flex gap-2 flex-wrap">
                                        {match.status !== 'finished' && (
                                            <button onClick={() => updateMatchStatus(match.id, 'finished')}
                                                className="flex-1 min-w-[100px] text-sm bg-gray-700 text-white px-4 py-3 rounded-xl hover:bg-gray-800 active:scale-95 font-medium transition-all">
                                                ✅ 試合終了
                                            </button>
                                        )}
                                        {match.status === 'upcoming' && (
                                            <button onClick={() => updateMatchStatus(match.id, 'live')}
                                                className="flex-1 min-w-[100px] text-sm bg-red-600 text-white px-4 py-3 rounded-xl hover:bg-red-700 active:scale-95 font-medium transition-all">
                                                🔴 LIVE開始
                                            </button>
                                        )}
                                        {match.status === 'finished' && (
                                            <button onClick={() => updateMatchStatus(match.id, 'upcoming')}
                                                className="flex-1 min-w-[100px] text-sm bg-blue-100 text-blue-700 px-4 py-3 rounded-xl hover:bg-blue-200 active:scale-95 font-medium transition-all">
                                                🔄 リセット
                                            </button>
                                        )}
                                    </div>

                                    {/* イベント表示 & 追加 */}
                                    <div className="border-t pt-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-muted-foreground">イベント ({events.length})</span>
                                            <button
                                                onClick={() => { setEventMatchId(match.id); setShowEventForm(eventMatchId === match.id ? !showEventForm : true); }}
                                                className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 font-medium active:scale-95 transition-all"
                                            >
                                                <Plus className="w-3 h-3 inline mr-1" /> イベント追加
                                            </button>
                                        </div>

                                        {/* 既存イベント */}
                                        {events.length > 0 && (
                                            <div className="space-y-1">
                                                {[...events].sort((a, b) => a.minute - b.minute).map(event => (
                                                    <div key={event.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                                                        <span className="font-mono text-xs text-muted-foreground w-8">{event.minute}'</span>
                                                        <span>{EVENT_TYPE_LABELS[event.event_type]?.slice(0, 2) || '📋'}</span>
                                                        <span className="flex-1 font-medium">{event.player_name}</span>
                                                        {event.event_type === 'goal' && event.details?.assisted_by && (
                                                            <span className="text-xs text-muted-foreground">🅰️ {String(event.details.assisted_by)}</span>
                                                        )}
                                                        <button
                                                            onClick={() => deleteEvent(event.id, match.id)}
                                                            className="text-red-400 hover:text-red-600 p-1"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* イベント追加フォーム */}
                                        {showEventForm && eventMatchId === match.id && (
                                            <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    <select
                                                        value={newEvent.event_type}
                                                        onChange={e => setNewEvent(prev => ({ ...prev, event_type: e.target.value as any }))}
                                                        className="px-3 py-2.5 border rounded-lg text-sm"
                                                    >
                                                        <option value="goal">⚽ ゴール</option>
                                                        <option value="yellow_card">🟨 イエローカード</option>
                                                        <option value="red_card">🟥 レッドカード</option>
                                                    </select>
                                                    <input
                                                        type="number"
                                                        placeholder="分 (例: 45)"
                                                        value={newEvent.minute || ''}
                                                        onChange={e => setNewEvent(prev => ({ ...prev, minute: parseInt(e.target.value) || 0 }))}
                                                        className="px-3 py-2.5 border rounded-lg text-sm"
                                                    />
                                                    <select
                                                        value={newEvent.player_id}
                                                        onChange={e => setNewEvent(prev => ({ ...prev, player_id: e.target.value }))}
                                                        className="px-3 py-2.5 border rounded-lg text-sm"
                                                    >
                                                        <option value="">選手を選択...</option>
                                                        {activePlayers.map(p => (
                                                            <option key={p.id} value={p.id}>{p.number} {p.name}</option>
                                                        ))}
                                                    </select>
                                                    {newEvent.event_type === 'goal' && (
                                                        <select
                                                            value={newEvent.assisted_by_id}
                                                            onChange={e => setNewEvent(prev => ({ ...prev, assisted_by_id: e.target.value }))}
                                                            className="px-3 py-2.5 border rounded-lg text-sm"
                                                        >
                                                            <option value="">アシスト（なし）</option>
                                                            {activePlayers.map(p => (
                                                                <option key={p.id} value={p.id}>{p.number} {p.name}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={addEvent} disabled={saving}
                                                        className="flex items-center gap-1.5 text-sm bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 active:scale-95 transition-all">
                                                        <Save className="w-4 h-4" /> {saving ? '保存中...' : '追加'}
                                                    </button>
                                                    <button onClick={() => setShowEventForm(false)}
                                                        className="text-sm text-gray-500 px-4 py-2.5 hover:text-gray-700">キャンセル</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ===== ラインナップタブ ===== */}
            {tab === 'lineups' && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold">ラインナップ登録</h2>

                    <select
                        value={selectedMatchId}
                        onChange={e => loadLineup(e.target.value)}
                        className="w-full px-4 py-3 border rounded-xl text-sm"
                    >
                        <option value="">試合を選択...</option>
                        {matches.map(m => (
                            <option key={m.id} value={m.id}>
                                {formatDate(m.match_date)} — {m.opponent_name} ({m.competition})
                                {m.status === 'finished' ? ' [終了]' : m.status === 'live' ? ' [LIVE]' : ''}
                            </option>
                        ))}
                    </select>

                    {selectedMatchId && !loadingLineup && (
                        <>
                            <div className="space-y-2">
                                {['GK', 'DF', 'MF', 'FW'].map(pos => {
                                    const posPlayers = activePlayers.filter(p => p.position === pos);
                                    if (posPlayers.length === 0) return null;
                                    return (
                                        <div key={pos} className="space-y-1">
                                            <span className="text-xs font-bold text-muted-foreground uppercase px-1">{pos}</span>
                                            {posPlayers.map(player => (
                                                <div key={player.id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-muted/50 active:bg-muted/70 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={lineup[player.id]?.selected || false}
                                                        onChange={e => setLineup(prev => ({
                                                            ...prev,
                                                            [player.id]: { ...prev[player.id], selected: e.target.checked }
                                                        }))}
                                                        className="w-5 h-5 rounded"
                                                    />
                                                    <span className="w-8 text-xs font-mono text-muted-foreground">{player.number}</span>
                                                    <span className="text-sm flex-1">{player.name}</span>
                                                    {lineup[player.id]?.selected && (
                                                        <button
                                                            onClick={() => setLineup(prev => ({
                                                                ...prev,
                                                                [player.id]: { ...prev[player.id], isStarter: !prev[player.id].isStarter }
                                                            }))}
                                                            className={`text-xs px-3 py-1.5 rounded-lg font-medium active:scale-95 transition-all ${lineup[player.id]?.isStarter
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-gray-100 text-gray-600'
                                                                }`}
                                                        >
                                                            {lineup[player.id]?.isStarter ? 'スタメン' : 'サブ'}
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={saveLineup} disabled={saving}
                                    className="flex items-center gap-1.5 bg-primary text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 active:scale-95 transition-all">
                                    <Save className="w-4 h-4" /> {saving ? '保存中...' : 'ラインナップ保存'}
                                </button>
                                <span className="text-xs text-muted-foreground self-center">
                                    選択: {Object.values(lineup).filter(v => v.selected).length}人
                                    （スタメン: {Object.values(lineup).filter(v => v.selected && v.isStarter).length}人）
                                </span>
                            </div>
                        </>
                    )}
                    {loadingLineup && <p className="text-sm text-muted-foreground">読み込み中...</p>}
                </div>
            )}

            {/* ===== 選手管理タブ ===== */}
            {tab === 'players' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold">選手マスター</h2>
                        <button
                            onClick={() => setShowNewPlayer(!showNewPlayer)}
                            className="flex items-center gap-1.5 text-sm bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 active:scale-95 transition-all"
                        >
                            <Plus className="w-4 h-4" /> 選手追加
                        </button>
                    </div>

                    {showNewPlayer && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <input
                                    type="text"
                                    placeholder="選手名"
                                    value={newPlayer.name}
                                    onChange={e => setNewPlayer(prev => ({ ...prev, name: e.target.value }))}
                                    className="px-4 py-3 border rounded-lg text-sm"
                                />
                                <input
                                    type="number"
                                    placeholder="背番号"
                                    value={newPlayer.number || ''}
                                    onChange={e => setNewPlayer(prev => ({ ...prev, number: parseInt(e.target.value) || 0 }))}
                                    className="px-4 py-3 border rounded-lg text-sm"
                                />
                                <select
                                    value={newPlayer.position}
                                    onChange={e => setNewPlayer(prev => ({ ...prev, position: e.target.value }))}
                                    className="px-4 py-3 border rounded-lg text-sm"
                                >
                                    <option value="GK">GK</option>
                                    <option value="DF">DF</option>
                                    <option value="MF">MF</option>
                                    <option value="FW">FW</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={addPlayer} disabled={saving}
                                    className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 active:scale-95 transition-all">
                                    <Save className="w-4 h-4" /> {saving ? '保存中...' : '追加'}
                                </button>
                                <button onClick={() => setShowNewPlayer(false)}
                                    className="text-sm text-gray-500 px-4 py-2.5 hover:text-gray-700">キャンセル</button>
                            </div>
                        </div>
                    )}

                    {/* アクティブ選手 */}
                    <div>
                        <h3 className="text-sm font-semibold text-green-700 mb-2">
                            ✅ 現在所属（{activePlayers.length}人）
                        </h3>
                        <div className="grid gap-1">
                            {activePlayers.map(player => (
                                <div key={player.id} className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-muted/50 active:bg-muted/70 border border-transparent hover:border-border transition-colors">
                                    <span className="w-6 text-xs font-mono text-muted-foreground text-right">{player.number}</span>
                                    <span className="text-xs font-medium text-muted-foreground w-8">{player.position}</span>
                                    <span className="text-sm flex-1">{player.name}</span>
                                    <button
                                        onClick={() => togglePlayerActive(player.id)}
                                        className="text-xs text-red-600 hover:text-red-800 px-3 py-2 hover:bg-red-50 rounded-lg active:scale-95 transition-all"
                                    >
                                        退団
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 非アクティブ選手 */}
                    {inactivePlayers.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 mb-2">
                                退団済み（{inactivePlayers.length}人）
                            </h3>
                            <div className="grid gap-1 opacity-60">
                                {inactivePlayers.map(player => (
                                    <div key={player.id} className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-muted/50">
                                        <span className="w-6 text-xs font-mono text-muted-foreground text-right">{player.number}</span>
                                        <span className="text-xs font-medium text-muted-foreground w-8">{player.position}</span>
                                        <span className="text-sm flex-1 line-through">{player.name}</span>
                                        <button
                                            onClick={() => togglePlayerActive(player.id)}
                                            className="text-xs text-green-600 hover:text-green-800 px-3 py-2 hover:bg-green-50 rounded-lg active:scale-95 transition-all"
                                        >
                                            復帰
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
