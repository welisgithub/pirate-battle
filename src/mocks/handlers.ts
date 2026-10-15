// src/mocks/handlers.ts
import { http, HttpResponse, delay } from 'msw';
import { mockDb, type NetworkScenario } from './db';
import type { MatchRecord, MatchConfig } from '../api/types';

async function applyScenario(scenario: NetworkScenario) {
  if (scenario === 'slow') {
    await delay(1200);
  } else if (scenario === 'timeout') {
    await delay(3000);
    throw new Error('Network timeout simulated');
  } else if (scenario === 'error') {
    await delay(200);
    return HttpResponse.json({ message: 'Internal Server Error (Simulated)' }, { status: 500 });
  }
  return null;
}

export const handlers = [
  // GET /api/ranking
  http.get('/api/ranking', async ({ request }) => {
    const scenario = mockDb.getScenario();
    const failure = await applyScenario(scenario);
    if (failure) return failure;

    if (scenario === 'empty') {
      return HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 5, totalPages: 0 });
    }

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('limit')) || 5;
    const sessionDuration = Number(url.searchParams.get('sessionDuration')) || 90;
    const spawnInterval = Number(url.searchParams.get('spawnInterval')) || 3.2;

    const config: MatchConfig = { sessionDuration, spawnInterval };
    const { items, total } = mockDb.getRanking(config, page, pageSize);

    return HttpResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    });
  }),

  // GET /api/matches (Histórico)
  http.get('/api/matches', async ({ request }) => {
    const scenario = mockDb.getScenario();
    const failure = await applyScenario(scenario);
    if (failure) return failure;

    if (scenario === 'empty') {
      return HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 5, totalPages: 0 });
    }

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page')) || 1;
    const pageSize = Number(url.searchParams.get('limit')) || 5;

    const { items, total } = mockDb.getPlayerMatches(page, pageSize);

    return HttpResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    });
  }),

  // POST /api/matches (Registrar partida)
  http.post('/api/matches', async ({ request }) => {
    const scenario = mockDb.getScenario();
    const failure = await applyScenario(scenario);
    if (failure) return failure;

    const body = (await request.json()) as MatchRecord;
    const saved = mockDb.recordMatch(body);

    return HttpResponse.json(saved, { status: 201 });
  }),
];