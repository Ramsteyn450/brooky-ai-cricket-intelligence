import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeDashboardAnalytics,
  filterMatches,
  sortMatchesByDateDesc,
} from '../src/utils/analytics.ts';
import type { MatchRecord } from '../src/types/cricket.ts';

const sampleMatches: MatchRecord[] = [
  {
    Match_ID: 'HB-2024-001',
    Match_Date: '2024-06-01',
    Season: 2024,
    Format: 'Test',
    Opposition: 'Australia',
    Venue: 'Edgbaston',
    Innings: 1,
    Runs: 120,
    Balls_Faced: 100,
    Fours: 12,
    Sixes: 2,
    Dismissal: 'Caught',
    Not_Out_Flag: 0,
    Strike_Rate: 120,
    Match_Result: 'Won',
  },
  {
    Match_ID: 'HB-2025-002',
    Match_Date: '2025-02-10',
    Season: 2025,
    Format: 'ODI',
    Opposition: 'India',
    Venue: 'Chennai',
    Innings: 2,
    Runs: 60,
    Balls_Faced: 50,
    Fours: 6,
    Sixes: 1,
    Dismissal: 'Not Out',
    Not_Out_Flag: 1,
    Strike_Rate: 120,
    Match_Result: 'Won',
  },
  {
    Match_ID: 'HB-2026-003',
    Match_Date: '2026-08-01',
    Season: 2026,
    Format: 'T20I',
    Opposition: 'Australia',
    Venue: "Lord's",
    Innings: 1,
    Runs: 30,
    Balls_Faced: 20,
    Fours: 3,
    Sixes: 1,
    Dismissal: 'Bowled',
    Not_Out_Flag: 0,
    Strike_Rate: 150,
    Match_Result: 'Lost',
  },
];

test('computes KPI totals accurately including Not Out adjustment', () => {
  const analytics = computeDashboardAnalytics(sampleMatches);
  assert.equal(analytics.kpis.totalMatches, 3);
  assert.equal(analytics.kpis.totalRuns, 210);
  assert.equal(analytics.kpis.dismissals, 2);
  assert.equal(analytics.kpis.battingAverage, 105);
  assert.equal(analytics.kpis.centuries, 1);
  assert.equal(analytics.kpis.halfCenturies, 1);
  assert.equal(analytics.kpis.totalFours, 21);
  assert.equal(analytics.kpis.totalSixes, 4);
  assert.equal(analytics.kpis.highestScore?.runs, 120);
});

test('handles all-not-out edge case without Infinity or NaN', () => {
  const notOutOnly = filterMatches(sampleMatches, { formats: ['ODI'] });
  const analytics = computeDashboardAnalytics(notOutOnly);
  assert.equal(analytics.kpis.battingAverage, null);
  assert.equal(analytics.kpis.highestScore?.label, '60*');
});

test('sorts latest matches descending by Match_Date', () => {
  const sorted = sortMatchesByDateDesc(sampleMatches);
  assert.deepEqual(
    sorted.map((m) => m.Match_ID),
    ['HB-2026-003', 'HB-2025-002', 'HB-2024-001'],
  );
});
