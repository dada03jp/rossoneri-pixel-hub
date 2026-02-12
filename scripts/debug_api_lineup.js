const https = require('https');

const API_KEY = 'f4b7a36909b14117c565aa78d24c5e6c';
const TEAM_ID = 489; // AC Milan
const OPPONENT_ID = 502; // Fiorentina (for testing specific case)

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
                    resolve(json.response);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function debugLineup() {
    console.log('Fetching Fiorentina vs Milan (Fixture 1240899)...');
    // Using known fixture ID for Fiorentina vs Milan if possible, or search
    // Actually we don't know the ID so let's find it first

    // 1. Get Fixtures
    const fixtures = await fetchAPI(`/fixtures?season=2024&team=${TEAM_ID}`);
    const match = fixtures.find(f =>
        (f.teams.home.id === TEAM_ID && f.teams.away.id === OPPONENT_ID) ||
        (f.teams.home.id === OPPONENT_ID && f.teams.away.id === TEAM_ID)
    );

    if (!match) {
        console.error('Match not found');
        return;
    }

    console.log(`Found match: ${match.fixture.id} - ${match.teams.home.name} vs ${match.teams.away.name}`);

    // 2. Get Lineup
    console.log('Fetching Lineups...');
    const lineups = await fetchAPI(`/fixtures/lineups?fixture=${match.fixture.id}`);

    console.log('Lineups response length:', lineups.length);

    lineups.forEach((l, i) => {
        console.log(`Lineup [${i}]: Team ID=${l.team.id}, Name=${l.team.name}`);
        // Check finding logic
        if (l.team.id === TEAM_ID) {
            console.log('  -> MATCHES TEAM_ID (489)');
            if (l.startXI.some(p => p.player.name.includes('Sottil'))) {
                console.error('  CRITICAL: Sottil found in Milan lineup!');
            }
        } else {
            console.log('  -> Does NOT match TEAM_ID');
            if (l.startXI.some(p => p.player.name.includes('Pulisic'))) {
                console.error('  CRITICAL: Pulisic found in Opponent lineup!');
            }
        }
    });

    const milanLineup = lineups.find(l => l.team.id === TEAM_ID);
    if (!milanLineup) {
        console.log('Milan lineup NOT found with find()');
    } else {
        console.log('Milan lineup FOUND. First player:', milanLineup.startXI[0]?.player.name);
    }
}

debugLineup();
