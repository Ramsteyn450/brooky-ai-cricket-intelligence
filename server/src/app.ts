import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { loadCricketDataset } from './data/loadDataset.js';
import { computeDashboardAnalytics, filterMatches, getFilterOptions } from './analytics/engine.js';
import { askBrookyAI, type BrookyChatRequest } from './ai/brookyService.js';
import type { FilterState } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface CreateAppOptions {
  serveStatic?: boolean;
}

export function createApp(options: CreateAppOptions = {}): express.Express {
  const { serveStatic = false } = options;
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', async (_req, res) => {
    try {
      const dataset = await loadCricketDataset();
      const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
      res.json({
        status: 'ok',
        datasetRows: dataset.matches.length,
        sourceFile: dataset.sourceFile,
        aiMode: hasGeminiKey ? 'gemini' : 'demo',
        model: hasGeminiKey ? 'gemini-3.8-flash' : 'brooky-analytics-engine',
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to load dataset',
      });
    }
  });

  app.get('/api/dataset', async (_req, res) => {
    try {
      const dataset = await loadCricketDataset();
      const filterOptions = getFilterOptions(dataset.matches);
      const analytics = computeDashboardAnalytics(dataset.matches);
      res.json({
        playerProfile: dataset.playerProfile,
        matches: dataset.matches,
        filterOptions,
        summary: analytics.kpis,
        sourceFile: dataset.sourceFile,
        aiMode: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) ? 'gemini' : 'demo',
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to read dataset',
      });
    }
  });

  app.post('/api/analytics/query', async (req, res) => {
    try {
      const dataset = await loadCricketDataset();
      const filters = (req.body?.filters ?? {}) as Partial<FilterState>;
      const filtered = filterMatches(dataset.matches, filters);
      const analytics = computeDashboardAnalytics(filtered);
      res.json({
        matchCount: filtered.length,
        analytics,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Analytics query failed',
      });
    }
  });

  app.post('/api/brooky/chat', async (req, res) => {
    try {
      const body = req.body as BrookyChatRequest;
      if (!body?.message || typeof body.message !== 'string') {
        res.status(400).json({ error: 'message is required' });
        return;
      }
      const dataset = await loadCricketDataset();
      const response = await askBrookyAI(body, dataset.matches, dataset.playerProfile);
      res.json(response);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Brooky AI request failed',
      });
    }
  });

  if (serveStatic) {
    const clientDist = path.resolve(__dirname, '..', '..', 'client', 'dist');
    if (fs.existsSync(clientDist)) {
      app.use(express.static(clientDist));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'));
      });
    }
  }

  return app;
}
