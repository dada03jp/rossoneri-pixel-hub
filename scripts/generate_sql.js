const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');

// 環境変数
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rqjxphgumgdojhyqqexx.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxanhwaGd1bWdkb2poeXFxZXh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MzcwNTAsImV4cCI6MjA4NjAxMzA1MH0.kTwOYbXFr81IARRL38tki5_RmPrLgCaIaj0BwKMu1dU';
const API_KEY = 'f4b7a36909b14117c565aa78d24c5e6c';
const TEAM_ID = 489; // AC Milan
const SEASON = 2024; // Use 2024-25 data for 25-26 placeholder

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// SQL File Stream
const sqlStream = fs.createWriteStream('match_data_fix.sql');

function writeSQL(sql) {
    sqlStream.write(sql + '\n');
}

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

function escapeLiteral(str) {
    if (str === null || str === undefined) return 'NULL';
    return "'" + str.replace(/'/g, "''") + "'";
}

async function generateSQL() {
    console.log('Generating SQL...');

    // Header
    writeSQL('-- 25-26シーズン（実態は24-25）の試合データ修正SQL');
    writeSQL('-- API-Footballより取得したデータでラインナップとスコアを更新します');
    writeSQL('BEGIN;');

    // 1. Get Matches
    console.log('Fetching API matches...');
    const fixtures = await fetchAPI(`/fixtures?season=${SEASON}&team=${TEAM_ID}`);

    console.log('Fetching DB matches...');
    const { data: dbMatches, error } = await supabase
        .from('matches')
        .select('*')
        .eq('season_id', 'aaaaaaaa-0000-0000-0000-000000000002')
        .eq('is_finished', true);

    if (error) {
        console.error('DB Error:', error);
        return;
    }

    console.log(`Found ${dbMatches.length} matches to process.`);

    for (const dbMatch of dbMatches) {
        // Matching Logic
        const apiMatch = fixtures.find(f => {
            const isHome = f.teams.home.id === TEAM_ID;
            const opponentName = isHome ? f.teams.away.name : f.teams.home.name;
            return f.fixture.status.short === 'FT' &&
                (opponentName.includes(dbMatch.opponent_name) || dbMatch.opponent_name.includes(opponentName)) &&
                (isHome === dbMatch.is_home);
        });

        if (!apiMatch) {
            console.log(`Skipping ${dbMatch.opponent_name}: No matching API fixture found.`);
            continue;
        }

        console.log(`Processing ${dbMatch.opponent_name}...`);

        // Fetch Lineups
        try {
            await new Promise(r => setTimeout(r, 7000)); // Rate limit buffer (10 req/min -> 6s delay needed)
            const lineups = await fetchAPI(`/fixtures/lineups?fixture=${apiMatch.fixture.id}`);
            const milanLineup = lineups.find(l => l.team.id === TEAM_ID);

            if (!milanLineup) {
                console.log('  No Milan lineup data.');
                continue;
            }

            if (!milanLineup.team.name.includes('Milan')) {
                console.error(`  CRITICAL ERROR: Found lineup team name is "${milanLineup.team.name}" but ID matched ${TEAM_ID}! Skipping.`);
                continue;
            }

            console.log(`  Verifying: Lineup is for ${milanLineup.team.name}`);

            // Generate SQL for this match

            // 1. Update Match Info
            writeSQL(`-- Match: vs ${dbMatch.opponent_name}`);
            writeSQL(`UPDATE matches SET ` +
                `formation = ${escapeLiteral(milanLineup.formation)}, ` +
                `home_score = ${apiMatch.goals.home}, ` +
                `away_score = ${apiMatch.goals.away} ` +
                `WHERE id = '${dbMatch.id}';`);

            // 2. Delete existing lineups
            writeSQL(`DELETE FROM match_lineups WHERE match_id = '${dbMatch.id}';`);

            // 3. Insert Players (Ensure they exist) & Lineups
            const allPlayers = [...milanLineup.startXI, ...milanLineup.substitutes];

            for (const item of allPlayers) {
                const p = item.player;
                // Insert player if not exists (using number? or name?)
                // Since we can't do "ON CONFLICT (name)" easily if name is not unique constraint, 
                // but usually name is unique enough or we don't care about duplicates in players table as much as lineups.
                // Best to try standard ON CONFLICT DO NOTHING if number/name constraint exists.
                // Assuming "players" table doesn't have unique constraint on number, but maybe on name?
                // Let's assume we can INSERT if not exists by checking something.
                // Actually, in SQL script, we can do:
                // INSERT INTO players (name, number, position, pixel_config) 
                // SELECT 'Name', 10, 'MF', '...' 
                // WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = 'Name');

                const pos = mapPosition(p.pos);
                const pixel = JSON.stringify({
                    skinTone: 'medium',
                    hairStyle: 'short',
                    hairColor: 'black'
                }); // Default pixel config

                writeSQL(`INSERT INTO players (name, number, position, pixel_config) ` +
                    `SELECT ${escapeLiteral(p.name)}, ${p.number}, ${escapeLiteral(pos)}, '${pixel}' ` +
                    `WHERE NOT EXISTS (SELECT 1 FROM players WHERE name = ${escapeLiteral(p.name)});`);

                // 4. Insert Lineup
                const isStarter = !!milanLineup.startXI.find(x => x.player.id === p.id);
                let posX = 0, posY = 0;

                if (isStarter) {
                    posX = mapGridToX(p.grid);
                    posY = mapGridToY(p.grid);
                }

                writeSQL(`INSERT INTO match_lineups (match_id, player_name, jersey_number, is_starter, position_role, position_x, position_y) ` +
                    `VALUES ('${dbMatch.id}', ${escapeLiteral(p.name)}, ${p.number}, ${isStarter}, ${escapeLiteral(pos)}, ${posX}, ${posY});`);
            }

        } catch (e) {
            console.error('Error:', e);
        }
    }

    writeSQL('COMMIT;');
    sqlStream.end();
    console.log('Done. SQL saved to match_data_fix.sql');
}

function mapPosition(apiPos) {
    const map = { 'G': 'GK', 'D': 'DF', 'M': 'MF', 'F': 'FW' };
    return map[apiPos] || 'MF';
}

function mapGridToX(grid) {
    if (!grid) return 50;
    const [line, pos] = grid.split(':').map(Number);
    return 10 + ((pos - 1) * 20); // Rough calc
}

function mapGridToY(grid) {
    if (!grid) return 90;
    const [line, pos] = grid.split(':').map(Number);
    return 100 - (line * 15);
}

generateSQL();
