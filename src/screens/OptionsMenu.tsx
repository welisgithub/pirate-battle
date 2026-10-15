// src/screens/OptionsMenu.tsx
import { useState } from 'react';
import { loadGameOptions, saveGameOptions, DEFAULT_OPTIONS } from '../game/options';

interface OptionsMenuProps {
  onClose: () => void;
}

export function OptionsMenu({ onClose }: OptionsMenuProps) {
  const [options, setOptions] = useState(loadGameOptions);
  const [savedMessage, setSavedMessage] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    saveGameOptions(options);
    setSavedMessage(true);
    setTimeout(() => {
      onClose();
    }, 600);
  }

  function handleReset() {
    setOptions({ ...DEFAULT_OPTIONS });
    saveGameOptions(DEFAULT_OPTIONS);
    setSavedMessage(true);
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="options-heading">
      <div className="modal-box options-box">
        <h2 id="options-heading">Options</h2>
        <p className="eyebrow">Match Configuration</p>

        <form onSubmit={handleSave} className="options-form">
          <label className="option-field">
            <span className="field-label">Game Session Time ({options.sessionDuration}s)</span>
            <span className="field-hint">Duration between 60 and 180 seconds</span>
            <input
              type="range"
              min="60"
              max="180"
              step="5"
              value={options.sessionDuration}
              onChange={(e) => setOptions({ ...options, sessionDuration: Number(e.target.value) })}
            />
          </label>

          <label className="option-field">
            <span className="field-label">Enemy Spawn Interval ({options.spawnInterval.toFixed(1)}s)</span>
            <span className="field-hint">Interval between 1.0s (chaotic) and 8.0s (calm)</span>
            <input
              type="range"
              min="1.0"
              max="8.0"
              step="0.2"
              value={options.spawnInterval}
              onChange={(e) => setOptions({ ...options, spawnInterval: Number(e.target.value) })}
            />
          </label>

          {savedMessage && <p className="success-msg">Settings saved successfully!</p>}

          <div className="modal-buttons">
            <button type="submit" className="secondary-button highlight-button">
              Save Options
            </button>
            <button type="button" className="secondary-button" onClick={handleReset}>
              Defaults
            </button>
            <button type="button" className="secondary-button" onClick={onClose}>
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}