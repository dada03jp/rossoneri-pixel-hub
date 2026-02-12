const https = require('https');
const fs = require('fs');

const API_KEY = 'f4b7a36909b14117c565aa78d24c5e6c';
const TEAM_ID = 489; // AC Milan
const SEASON = 2024; // 2024-2025

const options = {
    hostname: 'v3.football.api-sports.io',
    path: `/fixtures?season=${SEASON}&team=${TEAM_ID}`,
    method: 'GET',
    headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io'
    }
};

console.log('Fetching AC Milan matches...');

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

            const fixtures = json.response;
            console.log(`Found ${fixtures.length} matches.`);

            // 直近の完了した試合（Bolognaなど）を探す
            // 注: APIのデータは現実のものなので、ユーザーの「Bologna」が直近とは限らない（未来かも？）
            // 一旦ファイルに保存して確認する
            fs.writeFileSync('milan_matches_2025.json', JSON.stringify(fixtures, null, 2));
            console.log('Saved to milan_matches_2025.json');

            // 直近3試合のラインナップも取得したいのでIDを表示
            const finished = fixtures.filter(f => f.fixture.status.short === 'FT')
                .sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date));

            console.log('Recent finished matches:');
            finished.slice(0, 5).forEach(f => {
                console.log(`${f.fixture.date} vs ${f.teams.home.id === TEAM_ID ? f.teams.away.name : f.teams.home.name} (${f.score.fulltime.home}-${f.score.fulltime.away}) ID:${f.fixture.id}`);
            });

        } catch (e) {
            console.error('Parse Error:', e);
        }
    });
});

req.on('error', (e) => {
    console.error('Request Error:', e);
});

req.end();
