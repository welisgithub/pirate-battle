import { lazy, Suspense, useState } from 'react';
import { MainMenu } from '../screens/MainMenu';

const GameScreen = lazy(() => import('../screens/GameScreen').then((module) => ({
  default: module.GameScreen,
})));

type Screen = 'menu' | 'game';

export function App() {
  const [screen, setScreen] = useState<Screen>('menu');

  return screen === 'menu' ? (
    <MainMenu onPlay={() => setScreen('game')} />
  ) : (
    <Suspense fallback={<main className="game-screen"><p role="status">Loading the arena…</p></main>}>
      <GameScreen onExit={() => setScreen('menu')} />
    </Suspense>
  );
}
