/**
 * GameVault — k6 Load Test
 * Target: GET /api/games/
 * Config: 50 Virtual Users, 30 seconds
 * Threshold: p95 response time < 500ms
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ─── Custom Metrics ─────────────────────────────────────────────────────────
const errorRate = new Rate('error_rate');
const gamesListTrend = new Trend('games_list_response_time');

// ─── Test Configuration ──────────────────────────────────────────────────────
export const options = {
  vus: 50,          // 50 virtual users
  duration: '30s',  // for 30 seconds

  thresholds: {
    // 95th percentile must be under 500ms
    'http_req_duration{name:games_list}': ['p(95)<500'],
    // Global p95 threshold
    http_req_duration: ['p(95)<500'],
    // Error rate must stay below 5%
    error_rate: ['rate<0.05'],
    // HTTP failures below 1%
    http_req_failed: ['rate<0.01'],
  },
};

// ─── Base Configuration ──────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

// ─── Main Test Scenario ───────────────────────────────────────────────────────
export default function () {
  // Test 1: List games (main endpoint under load)
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

  sleep(0.5); // Small pause between iterations

  // Test 2: Get genres list
  const genresRes = http.get(`${BASE_URL}/api/genres/`, {
    tags: { name: 'genres_list' },
  });

  check(genresRes, {
    'genres list: status is 200': (r) => r.status === 200,
    'genres list: response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(0.3);

  // Test 3: Search games
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

// ─── Setup Function (runs once before the test) ─────────────────────────────
export function setup() {
  console.log(`Starting load test against: ${BASE_URL}`);
  console.log('Config: 50 VU, 30s duration');
  console.log('Threshold: p95 < 500ms');
}

// ─── Teardown Function (runs once after the test) ───────────────────────────
export function teardown(data) {
  console.log('Load test completed!');
}
