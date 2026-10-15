// src/screens/MainMenu.tsx
import { useEffect, useRef, useState } from 'react';
import titleUrl from '../../assets/png/default/ui/menu/title_pirate_battle.png';
import shipUrl from '../../assets/png/default/ships/ship_14.png';
import logoUrl from '../../assets/logo_jungle_gaming.svg';
import { OptionsMenu } from './OptionsMenu';

interface MainMenuProps {
  onPlay: () => void;
}

export function MainMenu({ onPlay }: MainMenuProps) {
  const playButton = useRef<HTMLButtonElement>(null);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    if (!showOptions) {
      playButton.current?.focus();
    }
  }, [showOptions]);

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
        <p className="menu-description">Defend the waters and defeat enemy ships.</p>

        <button ref={playButton} className="play-button" onClick={onPlay}>
          Play
        </button>

        <button
          className="secondary-button options-nav-btn"
          onClick={() => setShowOptions(true)}
        >
          Options
        </button>
      </section>

      {showOptions && <OptionsMenu onClose={() => setShowOptions(false)} />}

      <footer className="menu-footer">A single-player naval shooter</footer>
    </main>
  );
}