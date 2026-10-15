// src/api/client.ts
import axios from 'axios';
import { mockDb } from '../mocks/db';
import type { MatchRecord, MatchConfig } from './types';

export const apiClient = axios.create({
  baseURL: '/',
  timeout: 4000,
});

// Blindagem: se o Service Worker do MSW ainda não estiver ativo na primeira carga,
// o Axios consulta diretamente o banco simulado em vez de retornar 404 ou travar.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const url = config?.url || '';

    // Fallback para Ranking
    if (url.includes('/api/ranking') && config.method === 'get') {
      const params = config.params || {};
      const page = Number(params.page) || 1;
      const pageSize = Number(params.limit) || 5;
      const matchConfig: MatchConfig = {
        sessionDuration: Number(params.sessionDuration) || 90,
        spawnInterval: Number(params.spawnInterval) || 3.2,
      };
      const { items, total } = mockDb.getRanking(matchConfig, page, pageSize);
      return {
        data: {
          items,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }

    // Fallback para Histórico e Registro de Partidas
    if (url.includes('/api/matches')) {
      if (config.method === 'get') {
        const params = config.params || {};
        const page = Number(params.page) || 1;
        const pageSize = Number(params.limit) || 5;
        const { items, total } = mockDb.getPlayerMatches(page, pageSize);
        return {
          data: {
            items,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize) || 1,
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }

      if (config.method === 'post') {
        const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
        const saved = mockDb.recordMatch(body as MatchRecord);
        return {
          data: saved,
          status: 201,
          statusText: 'Created',
          headers: {},
          config,
        };
      }
    }

    return Promise.reject(error);
  },
);