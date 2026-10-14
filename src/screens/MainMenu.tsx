import { useEffect, useRef } from 'react';
import titleUrl from '../../assets/png/default/ui/menu/title_pirate_battle.png';
import shipUrl from '../../assets/png/default/ships/ship_14.png';
import logoUrl from '../../assets/logo_jungle_gaming.svg';

interface MainMenuProps {
  onPlay: () => void;
}

export function MainMenu({ onPlay }: MainMenuProps) {
  const playButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    playButton.current?.focus();
  }, []);

  return (
    <main className="menu-screen">
      <header className="site-header">
        <img className="studio-logo" src={logoUrl} alt="Jungle Gaming" />
        <span className="preview-badge">Development preview</span>
      </header>

      <section className="menu-panel" aria-labelledby="game-title">
        <h1 id="game-title" className="game-title">
          <img src={titleUrl} alt="Pirate Battle" />
        </h1>
        <p className="eyebrow">Set sail. Take command.</p>
        <img className="menu-ship" src={shipUrl} alt="" />
        <p className="menu-description">Your adventure starts on the open sea.</p>
        <button ref={playButton} className="play-button" onClick={onPlay}>
          Play
        </button>
        <p className="preview-note">
          Explore the arena preview.
          <br />
          Movement and combat are coming next.
        </p>
      </section>

      <footer className="menu-footer">A single-player naval adventure</footer>
    </main>
  );
}
