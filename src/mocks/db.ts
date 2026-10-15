// src/mocks/db.ts
import type { MatchRecord, RankingEntry, MatchConfig } from '../api/types';

const STORAGE_MATCHES_KEY = 'pirate_battle_mock_matches';
const STORAGE_SCENARIO_KEY = 'pirate_battle_network_scenario';

export type NetworkScenario = 'success' | 'empty' | 'slow' | 'error' | 'timeout';

// Jogadores simulados para o ranking
const FIXTURES: MatchRecord[] = [
  {
    id: 'fix-1',
    playerId: 'p-blackbeard',
    playerName: 'Captain Blackbeard',
    date: '2026-10-14T10:00:00Z',
    score: 18,
    durationSeconds: 90,
    endReason: 'time_out',
    config: { sessionDuration: 90, spawnInterval: 3.2 },
  },
  {
    id: 'fix-2',
    playerId: 'p-anne',
    playerName: 'Anne Bonny',
    date: '2026-10-14T11:30:00Z',
    score: 14,
    durationSeconds: 90,
    endReason: 'time_out',
    config: { sessionDuration: 90, spawnInterval: 3.2 },
  },
  {
    id: 'fix-3',
    playerId: 'p-calico',
    playerName: 'Calico Jack',
    date: '2026-10-14T14:15:00Z',
    score: 11,
    durationSeconds: 78,
    endReason: 'player_dead',
    config: { sessionDuration: 90, spawnInterval: 3.2 },
  },
  {
    id: 'fix-4',
    playerId: 'p-morgan',
    playerName: 'Henry Morgan',
    date: '2026-10-14T15:00:00Z',
    score: 9,
    durationSeconds: 65,
    endReason: 'player_dead',
    config: { sessionDuration: 90, spawnInterval: 3.2 },
  },
  {
    id: 'fix-5',
    playerId: 'p-mary',
    playerName: 'Mary Read',
    date: '2026-10-14T16:20:00Z',
    score: 7,
    durationSeconds: 52,
    endReason: 'player_dead',
    config: { sessionDuration: 90, spawnInterval: 3.2 },
  },
];

export class MockDatabase {
  private matches: MatchRecord[] = [];

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_MATCHES_KEY);
      if (raw) {
        this.matches = JSON.parse(raw);
      } else {
        this.matches = [...FIXTURES];
        this.save();
      }
    } catch {
      this.matches = [...FIXTURES];
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_MATCHES_KEY, JSON.stringify(this.matches));
  }

  public getScenario(): NetworkScenario {
    return (localStorage.getItem(STORAGE_SCENARIO_KEY) as NetworkScenario) || 'success';
  }

  public setScenario(scenario: NetworkScenario): void {
    localStorage.setItem(STORAGE_SCENARIO_KEY, scenario);
  }

  public resetDatabase(): void {
    this.matches = [...FIXTURES];
    this.save();
    this.setScenario('success');
  }

  // Registra uma partida sem permitir duplicidade pelo mesmo ID
  public recordMatch(record: MatchRecord): MatchRecord {
    const existing = this.matches.find((m) => m.id === record.id);
    if (existing) {
      return existing; // Recupera o existente sem duplicar
    }

    this.matches.unshift(record);
    this.save();
    return record;
  }

  // Retorna o histórico do jogador paginado
  public getPlayerMatches(page = 1, pageSize = 5): { items: MatchRecord[]; total: number } {
    const playerItems = this.matches.filter((m) => m.playerId === 'local-player');
    const start = (page - 1) * pageSize;
    return {
      items: playerItems.slice(start, start + pageSize),
      total: playerItems.length,
    };
  }

  // Retorna o ranking ordenado com desempate determinístico
  public getRanking(
    config: MatchConfig,
    page = 1,
    pageSize = 5,
  ): { items: RankingEntry[]; total: number } {
    // Compara partidas com a mesma configuração
    const matching = this.matches.filter(
      (m) =>
        m.config.sessionDuration === config.sessionDuration &&
        Math.abs(m.config.spawnInterval - config.spawnInterval) < 0.1,
    );

    // Critério determinístico de desempate:
    // 1. Maior pontuação
    // 2. Maior duração sobrevivida
    // 3. Data mais recente
    matching.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.durationSeconds !== a.durationSeconds) return b.durationSeconds - a.durationSeconds;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    const ranked: RankingEntry[] = matching.map((item, index) => ({
      rank: index + 1,
      playerId: item.playerId,
      playerName: item.playerName,
      score: item.score,
      durationSeconds: item.durationSeconds,
      date: item.date,
      config: item.config,
    }));

    const start = (page - 1) * pageSize;
    return {
      items: ranked.slice(start, start + pageSize),
      total: ranked.length,
    };
  }
}

export const mockDb = new MockDatabase();