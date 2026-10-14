// src/game/ArenaCanvas.tsx
import { useEffect, useRef, useState } from 'react';
import { mountArena, type ArenaController } from './mountArena';
import type { GameSnapshot } from './simulation/GameSimulation';

interface ArenaCanvasProps {
  onSnapshot?: (snapshot: GameSnapshot) => void;
  onRegisterController?: (controller: ArenaController) => void;
}

type LoadingStatus = 'loading' | 'ready' | 'error';

export function ArenaCanvas({ onSnapshot, onRegisterController }: ArenaCanvasProps) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<LoadingStatus>('loading');
  const [attempt, setAttempt] = useState(0);

  // Mantém as referências dos callbacks sempre atualizadas sem recriar o canvas
  const callbacksRef = useRef({ onSnapshot, onRegisterController });
  useEffect(() => {
    callbacksRef.current = { onSnapshot, onRegisterController };
  });

  useEffect(() => {
    if (!host.current) return;

    return mountArena(host.current, {
      onReady: () => setStatus('ready'),
      onError: () => setStatus('error'),
      onSnapshot: (snapshot) => callbacksRef.current.onSnapshot?.(snapshot),
      onRegisterController: (controller) => callbacksRef.current.onRegisterController?.(controller),
    });
  }, [attempt]); // <-- Depende apenas de 'attempt'. O Pixi roda contínuo e sem piscar!

  function retry() {
    setStatus('loading');
    setAttempt((value) => value + 1);
  }

  return (
    <section className="arena-section" aria-label="Arena battle">
      <div className="arena-shell">
        <div ref={host} className="arena-host" aria-busy={status === 'loading'} />
        {status === 'loading' && (
          <div className="arena-overlay" role="status">
            <span className="loading-mark" aria-hidden="true" />
            <p>Preparing the waters…</p>
          </div>
        )}
        {status === 'error' && (
          <div className="arena-overlay">
            <p role="alert">The arena could not load. Check your connection and WebGL support.</p>
            <button className="secondary-button" onClick={retry}>Try Again</button>
          </div>
        )}
      </div>
    </section>
  );
}