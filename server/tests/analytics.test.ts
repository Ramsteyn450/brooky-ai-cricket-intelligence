import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCricketDataset } from '../src/data/loadDataset.js';
import {
  computeDashboardAnalytics,
  filterMatches,
  sortMatchesByDateDesc,
} from '../src/analytics/engine.js';
import { askBrookyAI } from '../src/ai/brookyService.js';

test('loads Harry_Brook_Tableau_Public_Corrected_Dataset.xlsx accurately', async () => {
  const dataset = await loadCricketDataset();
  assert.equal(dataset.matches.length, 85);
  assert.equal(dataset.playerProfile.Player, 'Harry Brook');

  const analytics = computeDashboardAnalytics(dataset.matches);
  assert.equal(analytics.kpis.totalMatches, 85);
  assert.equal(analytics.kpis.totalRuns, 3920);
  assert.equal(analytics.kpis.battingAverage, 49.62);
  assert.equal(Number(analytics.kpis.strikeRate.toFixed(1)), 101.3);
  assert.equal(analytics.kpis.centuries, 8);
  assert.equal(analytics.kpis.halfCenturies, 23);
  assert.equal(analytics.kpis.totalFours, 212);
  assert.equal(analytics.kpis.totalSixes, 45);
  assert.equal(analytics.kpis.highestScore?.runs, 150);
});

test('latest five matches are strictly ordered by Match_Date descending', async () => {
  const dataset = await loadCricketDataset();
  const sorted = sortMatchesByDateDesc(dataset.matches);
  const top5 = sorted.slice(0, 5);
  assert.deepEqual(
    top5.map((m) => m.Match_ID),
    ['HB-2026-061', 'HB-2026-034', 'HB-2026-015', 'HB-2026-045', 'HB-2026-025'],
  );
});

test('multi-filter intersection computes consistent KPIs', async () => {
  const dataset = await loadCricketDataset();
  const odiIndia = filterMatches(dataset.matches, {
    formats: ['ODI'],
    oppositions: ['India'],
  });
  assert.ok(odiIndia.length > 0);
  assert.ok(odiIndia.every((m) => m.Format === 'ODI' && m.Opposition === 'India'));

  const stats = computeDashboardAnalytics(odiIndia);
  assert.equal(stats.kpis.totalMatches, odiIndia.length);
  assert.equal(
    stats.kpis.totalRuns,
    odiIndia.reduce((sum, m) => sum + m.Runs, 0),
  );
});

test('Brooky AI answers grounded dataset questions and returns filter actions', async () => {
  const dataset = await loadCricketDataset();
  const res1 = await askBrookyAI(
    { message: 'How many runs did Harry Brook score?' },
    dataset.matches,
    dataset.playerProfile,
  );
  assert.ok(res1.reply.includes('3,920'));

  const res2 = await askBrookyAI(
    { message: 'Filter the dashboard to ODI' },
    dataset.matches,
    dataset.playerProfile,
  );
  assert.equal(res2.action?.type, 'apply_filters');
  assert.deepEqual(res2.action?.filters?.formats, ['ODI']);

  const res3 = await askBrookyAI(
    { message: 'Show his last five matches' },
    dataset.matches,
    dataset.playerProfile,
  );
  assert.equal(res3.action?.type, 'navigate');
  assert.equal(res3.action?.page, 'recent');
  assert.ok(res3.reply.includes('2026-12-26'));
});
