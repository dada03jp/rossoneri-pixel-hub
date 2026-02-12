const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');

// 環境変数を直接指定（ローカル実行用）
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rqjxphgumgdojhyqqexx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxanhwaGd1bWdkb2poeXFxZXh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MzcwNTAsImV4cCI6MjA4NjAxMzA1MH0.kTwOYbXFr81IARRL38tki5_RmPrLgCaIaj0BwKMu1dU';
const API_KEY = 'f4b7a36909b14117c565aa78d24c5e6c';
const TEAM_ID = 489; // AC Milan
const SEASON = 2024; // User's 2025-26 corresponds to API's 2024-25 data structure likely

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function fetchAPI(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'v3.football.api-sports.io',
            path: path,
            method: 'GET',
            headers: {
                'x-rapidapi-key': API_KEY,
                'x-rapidapi-host': 'v3.football.api-sports.io'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.errors && Object.keys(json.errors).length > 0) {
                        reject(json.errors);
                    } else {
                        resolve(json.response);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function syncData() {
    console.log('Starting data sync...');

    // 1. Get all matches from API
    console.log('Fetching matches from API...');
    const fixtures = await fetchAPI(`/fixtures?season=${SEASON}&team=${TEAM_ID}`);
    console.log(`Found ${fixtures.length} matches from API.`);

    // 2. Get matches from DB that need lineups
    // We target finished matches in 25-26 season (id ending in '...2')
    const { data: dbMatches, error } = await supabase
        .from('matches')
        .select('*')
        .eq('season_id', 'aaaaaaaa-0000-0000-0000-000000000002')
        .eq('is_finished', true);

    if (error) {
        console.error('DB Error:', error);
        return;
    }

    console.log(`Found ${dbMatches.length} finished matches in DB to likely update.`);

    // 3. Match and Update
    for (const dbMatch of dbMatches) {
        // Find corresponding API match
        // マッチングロジック: 対戦相手の名前が一致、かつステータスが完了
        // 日付はズレがあるため、近いものを選ぶか、対戦相手+ホーム/アウェイで判断

        const apiMatch = fixtures.find(f => {
            const isHome = f.teams.home.id === TEAM_ID;
            const opponentName = isHome ? f.teams.away.name : f.teams.home.name;

            // 名前マッチング（簡易）
            // DBのopponent_nameとAPIのnameを正規化して比較できればベストだが、
            // ここでは対戦相手名の一部が含まれているかで判定してみる
            return f.fixture.status.short === 'FT' &&
                (opponentName.includes(dbMatch.opponent_name) || dbMatch.opponent_name.includes(opponentName)) &&
                (isHome === dbMatch.is_home); // ホーム/アウェイの一致は重要
        });

        if (!apiMatch) {
            console.log(`No API match found for: ${dbMatch.opponent_name} (ID: ${dbMatch.id})`);
            continue;
        }

        console.log(`Processing: ${dbMatch.opponent_name} (API ID: ${apiMatch.fixture.id})`);

        // Check if lineup already exists in DB? 
        // No, user wants to overwrite with "correct" data, so we fetch lineups

        // Fetch Lineups
        // API limit check: sleep briefly to be nice?
        try {
            const lineups = await fetchAPI(`/fixtures/lineups?fixture=${apiMatch.fixture.id}`);
            const milanLineup = lineups.find(l => l.team.id === TEAM_ID);

            if (!milanLineup) {
                console.log('  No lineup data for this match.');
                continue;
            }

            // Update Players & Insert Lineups
            await updateLineups(dbMatch.id, milanLineup);

            // Update Match Info (Formation, Score if needed)
            await supabase.from('matches').update({
                formation: milanLineup.formation,
                home_score: apiMatch.goals.home,
                away_score: apiMatch.goals.away
            }).eq('id', dbMatch.id);

            console.log('  Updated successfully.');

        } catch (e) {
            console.error(`  Error processing match ${dbMatch.id}:`, e);
        }

        // Limit API calls just in case (process 5 matches max for safety first run?)
        // No, user gave us the key to fix data. Let's do as many as possible (limit is 100/day).
        // Matches count is around 27. So 27 calls is fine.
    }
}

async function updateLineups(matchId, lineupData) {
    // 1. Delete existing lineups for this match
    await supabase.from('match_lineups').delete().eq('match_id', matchId);

    // 2. Prepare players and lineup entries
    const entries = [];

    // Starters
    for (const item of lineupData.startXI) {
        await ensurePlayer(item.player);
        entries.push({
            match_id: matchId,
            player_name: item.player.name,
            jersey_number: item.player.number,
            is_starter: true,
            position_role: mapPosition(item.player.pos),
            position_x: mapGridToX(item.player.grid),
            position_y: mapGridToY(item.player.grid)
        });
    }

    // Subs
    for (const item of lineupData.substitutes) {
        await ensurePlayer(item.player);
        entries.push({
            match_id: matchId,
            player_name: item.player.name,
            jersey_number: item.player.number,
            is_starter: false,
            position_role: mapPosition(item.player.pos),
            position_x: 0,
            position_y: 0
        });
    }

    // Bulk Insert
    if (entries.length > 0) {
        const { error } = await supabase.from('match_lineups').insert(entries);
        if (error) console.error('  Insert Error:', error);
    }
}

async function ensurePlayer(playerData) {
    // Check if player exists, if not insert
    // We use number as a weak identifier or name? Name is better but API names vary.
    // Ideally we should have player_id column in DB, but we don't.
    // We'll rely on jersey_number for uniqueness? No, numbers change. 
    // Use Name.

    // First, try to find by number (more stable within a season usually)
    let { data } = await supabase.from('players').select('id').eq('number', playerData.number).single();

    if (!data) {
        // Create new player
        const { error } = await supabase.from('players').insert({
            name: playerData.name,
            number: playerData.number,
            position: mapPosition(playerData.pos),
            pixel_config: { // Random config
                hairColor: '#000000',
                skinColor: '#e0ac69',
                kitStyle: 'stripes'
            }
        });
        if (error && error.code !== '23505') { // Ignore unique constraint errors
            console.error('  Player Create Error:', error);
        }
    }
}

function mapPosition(apiPos) {
    const map = { 'G': 'GK', 'D': 'DF', 'M': 'MF', 'F': 'FW' };
    return map[apiPos] || 'MF';
}

function mapGridToX(grid) {
    // grid format: "line:pos" e.g. "4:1" (GK is 1:1)
    if (!grid) return 50;
    const [line, pos] = grid.split(':').map(Number);
    // X is horizontal (0-100, Left-Right)
    // API grid: line 2 has 4 players -> pos 1..4
    // We need to distribute them.
    // Simple logic:
    return 10 + ((pos - 1) * 20); // Very rough approximation
}

function mapGridToY(grid) {
    // Y is vertical (0-100, Top-Bottom). Home team attacks Up? No, usually displayed bottom-up in lineup.
    // GK is "1:1". 
    if (!grid) return 90;
    const [line, pos] = grid.split(':').map(Number);
    // Line 1 (GK) -> 90
    // Line 2 (DF) -> 75
    // Line 3 (MF) -> 50
    // Line 4 (FW) -> 20
    return 100 - (line * 15);
}

syncData().catch(console.error);
