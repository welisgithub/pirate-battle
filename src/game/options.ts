// src/game/options.ts

export interface GameOptions {
  sessionDuration: number; // entre 60 e 180s
  spawnInterval: number;   // positivo, ex: 1 a 10s
}

const STORAGE_KEY = 'pirate_battle_options';

export const DEFAULT_OPTIONS: GameOptions = {
  sessionDuration: 90,
  spawnInterval: 3.2,
};

export function loadGameOptions(): GameOptions {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_OPTIONS };
    const parsed = JSON.parse(raw);

    const sessionDuration = Math.max(60, Math.min(180, Number(parsed.sessionDuration) || 90));
    const spawnInterval = Math.max(1.0, Math.min(10.0, Number(parsed.spawnInterval) || 3.2));

    return { sessionDuration, spawnInterval };
  } catch {
    return { ...DEFAULT_OPTIONS };
  }
}

export function saveGameOptions(options: GameOptions): void {
  const sessionDuration = Math.max(60, Math.min(180, options.sessionDuration));
  const spawnInterval = Math.max(1.0, Math.min(10.0, options.spawnInterval));
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionDuration, spawnInterval }));
}