// src/api/pendingQueue.ts
import type { MatchRecord } from './types';
import { apiClient } from './client';

const PENDING_QUEUE_KEY = 'pirate_battle_pending_matches';

export function getPendingMatches(): MatchRecord[] {
  try {
    const raw = localStorage.getItem(PENDING_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePendingMatch(match: MatchRecord): void {
  const current = getPendingMatches();
  // Evita duplicar na fila local pelo mesmo id
  if (!current.some((m) => m.id === match.id)) {
    current.push(match);
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(current));
  }
}

export function removePendingMatch(matchId: string): void {
  const current = getPendingMatches().filter((m) => m.id !== matchId);
  localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(current));
}

// Tenta sincronizar todas as partidas pendentes com a API
export async function flushPendingMatches(): Promise<void> {
  const pending = getPendingMatches();
  if (pending.length === 0) return;

  for (const match of pending) {
    try {
      await apiClient.post('/api/matches', match);
      removePendingMatch(match.id);
    } catch {
      // Se falhar (ex: rede offline), mantém na fila para tentar depois
      break;
    }
  }
}