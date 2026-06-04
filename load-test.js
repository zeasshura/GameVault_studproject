import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('error_rate');
const gamesListTrend = new Trend('games_list_response_time');

export const options = {
  vus: 50,          
  duration: '30s',  

  thresholds: {
    'http_req_duration{name:games_list}': ['p(95)<500'],
    http_req_duration: ['p(95)<500'],
    error_rate: ['rate<0.05'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export default function () {
  const gamesRes = http.get(`${BASE_URL}/api/games/`, {
    tags: { name: 'games_list' },
  });

  gamesListTrend.add(gamesRes.timings.duration);
  errorRate.add(gamesRes.status !== 200);

  check(gamesRes, {
    'games list: status is 200': (r) => r.status === 200,
    'games list: response time < 500ms': (r) => r.timings.duration < 500,
    'games list: has results': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.results) || Array.isArray(body);
      } catch {
        return false;
      }
    },
  });

  sleep(0.5); 

  const genresRes = http.get(`${BASE_URL}/api/genres/`, {
    tags: { name: 'genres_list' },
  });

  check(genresRes, {
    'genres list: status is 200': (r) => r.status === 200,
    'genres list: response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(0.3);

  const queries = ['action', 'rpg', 'adventure', 'shooter', 'strategy'];
  const query = queries[Math.floor(Math.random() * queries.length)];

  const searchRes = http.get(`${BASE_URL}/api/games/?search=${query}`, {
    tags: { name: 'games_search' },
  });

  check(searchRes, {
    'games search: status is 200': (r) => r.status === 200,
    'games search: response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(0.2);
}

export function setup() {
  console.log(`Starting load test against: ${BASE_URL}`);
  console.log('Config: 50 VU, 30s duration');
  console.log('Threshold: p95 < 500ms');
}

export function teardown(data) {
  console.log('Load test completed!');
}
