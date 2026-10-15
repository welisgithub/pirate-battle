// src/screens/MainMenu.tsx
import { useEffect, useRef, useState } from 'react';
import titleUrl from '../../assets/png/default/ui/menu/title_pirate_battle.png';
import shipUrl from '../../assets/png/default/ships/ship_14.png';
import logoUrl from '../../assets/logo_jungle_gaming.svg';
import { OptionsMenu } from './OptionsMenu';
import { RankingModal } from './RankingModal';
import { HistoryModal } from './HistoryModal';

interface MainMenuProps {
  onPlay: () => void;
}

export function MainMenu({ onPlay }: MainMenuProps) {
  const playButton = useRef<HTMLButtonElement>(null);
  const [activeModal, setActiveModal] = useState<'none' | 'options' | 'ranking' | 'history'>('none');

  useEffect(() => {
    if (activeModal === 'none') {
      playButton.current?.focus();
    }
  }, [activeModal]);

  return (
    <main className="menu-screen">
      <header className="site-header">
        <img className="studio-logo" src={logoUrl} alt="Jungle Gaming" />
        <span className="preview-badge">React & PixiJS</span>
      </header>

      <section className="menu-panel" aria-labelledby="game-title">
        <h1 id="game-title" className="game-title">
          <img src={titleUrl} alt="Pirate Battle" />
        </h1>
        <p className="eyebrow">Set sail. Take command.</p>
        <img className="menu-ship" src={shipUrl} alt="" />

        <button ref={playButton} className="play-button" onClick={onPlay}>
          Play
        </button>

        <div className="menu-nav-grid">
          <button
            className="secondary-button"
            onClick={() => setActiveModal('ranking')}
          >
            Ranking
          </button>
          <button
            className="secondary-button"
            onClick={() => setActiveModal('history')}
          >
            Match History
          </button>
          <button
            className="secondary-button full-width"
            onClick={() => setActiveModal('options')}
          >
            Options
          </button>
        </div>
      </section>

      {activeModal === 'options' && <OptionsMenu onClose={() => setActiveModal('none')} />}
      {activeModal === 'ranking' && <RankingModal onClose={() => setActiveModal('none')} />}
      {activeModal === 'history' && <HistoryModal onClose={() => setActiveModal('none')} />}

      <footer className="menu-footer">A single-player naval shooter</footer>
    </main>
  );
}