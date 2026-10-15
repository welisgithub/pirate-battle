// src/api/types.ts

export interface MatchConfig {
  sessionDuration: number;
  spawnInterval: number;
}

export interface MatchRecord {
  id: string;
  playerId: string;
  playerName: string;
  date: string; // ISO 8601
  score: number;
  durationSeconds: number;
  endReason: 'time_out' | 'player_dead';
  config: MatchConfig;
}

export interface RankingEntry {
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
  durationSeconds: number;
  date: string;
  config: MatchConfig;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}