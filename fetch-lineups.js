const https = require('https');

const API_KEY = 'f4b7a36909b14117c565aa78d24c5e6c';
const FIXTURE_ID = 1223676; // Bologna vs AC Milan

const options = {
    hostname: 'v3.football.api-sports.io',
    path: `/fixtures/lineups?fixture=${FIXTURE_ID}`,
    method: 'GET',
    headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io'
    }
};

console.log(`Fetching lineups for match ${FIXTURE_ID}...`);

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.errors && Object.keys(json.errors).length > 0) {
                console.error('API Error:', json.errors);
                return;
            }

            const lineups = json.response;
            console.log(`Found lineups for ${lineups.length} teams.`);

            const milan = lineups.find(l => l.team.id === 489);
            if (milan) {
                console.log('AC Milan Lineup:', JSON.stringify(milan.startXI, null, 2));
                console.log('Substitutes:', JSON.stringify(milan.substitutes, null, 2));
                console.log('Formation:', milan.formation);
            } else {
                console.log('AC Milan lineup not found');
            }

        } catch (e) {
            console.error('Parse Error:', e);
        }
    });
});

req.on('error', (e) => {
    console.error('Request Error:', e);
});

req.end();
