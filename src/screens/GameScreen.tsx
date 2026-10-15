// src/screens/GameScreen.tsx
import { useEffect, useRef, useState } from 'react';
import { ArenaCanvas } from '../game/ArenaCanvas';
import type { ArenaController } from '../game/mountArena';
import type { GameSnapshot } from '../game/simulation/GameSimulation';
import { loadGameOptions } from '../game/options';
import { useRecordMatch } from '../api/queries';
import { flushPendingMatches } from '../api/pendingQueue';

interface GameScreenProps {
  onExit: () => void;
}

export function GameScreen({ onExit }: GameScreenProps) {
  const controllerRef = useRef<ArenaController | null>(null);
  const recordedMatchIdRef = useRef<string | null>(null);
  const recordMutation = useRecordMatch();

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

  // Salva automaticamente assim que a partida termina
  useEffect(() => {
    if (snapshot.isGameOver && snapshot.endReason && !recordedMatchIdRef.current) {
      const matchId = `match-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      recordedMatchIdRef.current = matchId;

      const options = loadGameOptions();

      recordMutation.mutate({
        id: matchId,
        playerId: 'local-player',
        playerName: 'Captain Player',
        date: new Date().toISOString(),
        score: snapshot.score,
        durationSeconds: snapshot.timePlayed,
        endReason: snapshot.endReason,
        config: {
          sessionDuration: options.sessionDuration,
          spawnInterval: options.spawnInterval,
        },
      });
    }
  }, [snapshot.isGameOver, snapshot.endReason, snapshot.score, snapshot.timePlayed, recordMutation]);

  function handleRestart() {
    recordedMatchIdRef.current = null;
    recordMutation.reset();
    controllerRef.current?.restart();
  }

  function handleExitToMenu() {
    // Garante que o que estiver na fila seja enviado antes ou em segundo plano
    void flushPendingMatches();
    onExit();
  }

  const minutes = Math.floor(snapshot.timeRemaining / 60);
  const seconds = (snapshot.timeRemaining % 60).toString().padStart(2, '0');

  return (
    <main className="game-screen">
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
          <button className="secondary-button" onClick={handleExitToMenu}>
            Exit
          </button>
        </div>
      </header>

      <ArenaCanvas
        onSnapshot={setSnapshot}
        onRegisterController={(controller) => {
          controllerRef.current = controller;
        }}
      />

      <p className="controls-hint">
        <strong>Controls:</strong> W / ↑: Forward | A / D / ← / →: Steer | Space: Front Cannon | Q / E: Broadside Cannons | Esc: Pause
      </p>

      {/* Modal de Pausa */}
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
              <button className="secondary-button" onClick={handleExitToMenu}>
                Abandon Match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Fim de Jogo */}
      {snapshot.isGameOver && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Game Over">
          <div className="modal-box">
            <h2>{snapshot.endReason === 'time_out' ? 'Time Is Up!' : 'Your Ship Has Sunk!'}</h2>
            <p className="result-reason">
              {snapshot.endReason === 'time_out'
                ? 'You survived the full match duration!'
                : 'Overwhelmed by enemy cannons and chasers.'}
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

            <div className="save-status">
              {recordMutation.isPending && <p>Recording voyage in archives…</p>}
              {recordMutation.isSuccess && <p className="success-txt">✓ Match recorded in Ranking & History!</p>}
              {recordMutation.isError && (
                <div className="retry-block">
                  <p>Saved locally (Pending sync with server).</p>
                  <button
                    className="small-button"
                    onClick={() => {
                      if (recordedMatchIdRef.current) {
                        const options = loadGameOptions();
                        recordMutation.mutate({
                          id: recordedMatchIdRef.current,
                          playerId: 'local-player',
                          playerName: 'Captain Player',
                          date: new Date().toISOString(),
                          score: snapshot.score,
                          durationSeconds: snapshot.timePlayed,
                          endReason: snapshot.endReason!,
                          config: {
                            sessionDuration: options.sessionDuration,
                            spawnInterval: options.spawnInterval,
                          },
                        });
                      }
                    }}
                  >
                    Retry Sync
                  </button>
                </div>
              )}
            </div>

            <div className="modal-buttons">
              <button className="secondary-button highlight-button" onClick={handleRestart}>
                Play Again
              </button>
              <button className="secondary-button" onClick={handleExitToMenu}>
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}