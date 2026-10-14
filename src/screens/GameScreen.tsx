// src/screens/GameScreen.tsx
import { useRef, useState } from 'react';
import { ArenaCanvas } from '../game/ArenaCanvas';
import type { ArenaController } from '../game/mountArena';
import type { GameSnapshot } from '../game/simulation/GameSimulation';

interface GameScreenProps {
  onExit: () => void;
}

export function GameScreen({ onExit }: GameScreenProps) {
  const controllerRef = useRef<ArenaController | null>(null);
  const [snapshot, setSnapshot] = useState<GameSnapshot>({
    score: 0,
    timeRemaining: 90,
    timePlayed: 0,
    playerHealth: 100,
    playerMaxHealth: 100,
    isPaused: false,
    isGameOver: false,
    endReason: null,
  });

  const minutes = Math.floor(snapshot.timeRemaining / 60);
  const seconds = (snapshot.timeRemaining % 60).toString().padStart(2, '0');

  return (
    <main className="game-screen">
      {/* 1. HUD Superior */}
      <header className="game-hud">
        <div className="hud-metric">
          <span className="hud-label">TIME</span>
          <span className="hud-value">{minutes}:{seconds}</span>
        </div>

        <div className="hud-metric">
          <span className="hud-label">SCORE</span>
          <span className="hud-value highlight">{snapshot.score}</span>
        </div>

        <div className="hud-metric hud-hp">
          <span className="hud-label">HEALTH</span>
          <div className="hp-bar-bg">
            <div
              className="hp-bar-fill"
              style={{ width: `${(snapshot.playerHealth / snapshot.playerMaxHealth) * 100}%` }}
            />
          </div>
          <span className="hp-text">{snapshot.playerHealth}/{snapshot.playerMaxHealth}</span>
        </div>

        <div className="hud-actions">
          <button
            className="secondary-button"
            onClick={() => controllerRef.current?.togglePause()}
            disabled={snapshot.isGameOver}
          >
            {snapshot.isPaused ? 'Resume' : 'Pause'}
          </button>
          <button className="secondary-button" onClick={onExit}>
            Exit
          </button>
        </div>
      </header>

      {/* 2. O Canvas do Pixi */}
      <ArenaCanvas
        onSnapshot={setSnapshot}
        onRegisterController={(controller) => {
          controllerRef.current = controller;
        }}
      />

      {/* Instruções de controle logo abaixo do canvas */}
      <p className="controls-hint">
        <strong>Controls:</strong> W / ↑: Forward | A / D / ← / →: Steer | Space: Front Cannon | Q / E: Broadside Cannons | Esc: Pause
      </p>

      {/* 3. Modal de Pausa */}
      {snapshot.isPaused && !snapshot.isGameOver && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Game paused">
          <div className="modal-box">
            <h2>Game Paused</h2>
            <p>Catch your breath, Captain.</p>
            <div className="modal-buttons">
              <button
                className="secondary-button highlight-button"
                onClick={() => controllerRef.current?.setPaused(false)}
              >
                Resume Battle
              </button>
              <button className="secondary-button" onClick={onExit}>
                Abandon Match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal de Fim de Jogo (Game Over) */}
      {snapshot.isGameOver && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Game Over">
          <div className="modal-box">
            <h2>{snapshot.endReason === 'time_out' ? 'Time Is Up!' : 'Your Ship Has Sunk!'}</h2>
            <p className="result-reason">
              {snapshot.endReason === 'time_out'
                ? 'You survived the full match duration!'
                : 'Overwhelmed by enemy fire and chasers.'}
            </p>

            <div className="result-stats">
              <div className="result-stat-box">
                <span>Final Score</span>
                <strong>{snapshot.score} pts</strong>
              </div>
              <div className="result-stat-box">
                <span>Time Played</span>
                <strong>{snapshot.timePlayed}s</strong>
              </div>
            </div>

            <div className="modal-buttons">
              <button
                className="secondary-button highlight-button"
                onClick={() => controllerRef.current?.restart()}
              >
                Play Again
              </button>
              <button className="secondary-button" onClick={onExit}>
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}