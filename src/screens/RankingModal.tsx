// src/screens/RankingModal.tsx
import { useState } from 'react';
import { useRanking } from '../api/queries';
import { loadGameOptions } from '../game/options';
import { mockDb, type NetworkScenario } from '../mocks/db';

interface RankingModalProps {
  onClose: () => void;
}

export function RankingModal({ onClose }: RankingModalProps) {
  const [page, setPage] = useState(1);
  const options = loadGameOptions();
  const [scenario, setScenario] = useState<NetworkScenario>(() => mockDb.getScenario());

  const { data, isLoading, isError, error, refetch } = useRanking(options, page);

  function handleScenarioChange(newScenario: NetworkScenario) {
    mockDb.setScenario(newScenario);
    setScenario(newScenario);
    refetch();
  }

  function handleReset() {
    mockDb.resetDatabase();
    setScenario('success');
    refetch();
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="ranking-heading">
      <div className="modal-box data-modal-box">
        <h2 id="ranking-heading">Global Ranking</h2>
        <p className="eyebrow">
          Config: {options.sessionDuration}s duration · {options.spawnInterval.toFixed(1)}s spawn
        </p>

        {/* Seletor de Cenários do MSW */}
        <div className="scenario-bar">
          <label htmlFor="scenario-select">Network Scenario:</label>
          <select
            id="scenario-select"
            value={scenario}
            onChange={(e) => handleScenarioChange(e.target.value as NetworkScenario)}
          >
            <option value="success">Success (Normal)</option>
            <option value="slow">Slow Network (Latency)</option>
            <option value="empty">Empty Results</option>
            <option value="error">Server Error (500)</option>
          </select>
          <button type="button" className="small-button" onClick={handleReset}>
            Reset Data
          </button>
        </div>

        {/* Estados de Carregamento, Erro e Tabela */}
        {isLoading && <p className="data-status">Loading ranking from server…</p>}

        {isError && (
          <div className="data-error">
            <p>Failed to load ranking: {error instanceof Error ? error.message : 'Unknown error'}</p>
            <button className="secondary-button" onClick={() => refetch()}>
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !isError && data && (
          <>
            {data.items.length === 0 ? (
              <p className="data-status">No ranking records found for this configuration.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Captain</th>
                    <th>Score</th>
                    <th>Survived</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((entry) => (
                    <tr key={`${entry.playerId}-${entry.rank}`} className={entry.playerId === 'local-player' ? 'current-player' : ''}>
                      <td className="rank-col">{entry.rank}</td>
                      <td>{entry.playerName} {entry.playerId === 'local-player' ? '(You)' : ''}</td>
                      <td className="score-col">{entry.score} pts</td>
                      <td>{entry.durationSeconds}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Paginação */}
            <div className="pagination-bar">
              <button
                className="small-button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ◀ Previous
              </button>
              <span>Page {data.page} of {data.totalPages || 1}</span>
              <button
                className="small-button"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next ▶
              </button>
            </div>
          </>
        )}

        <div className="modal-buttons" style={{ marginTop: '20px' }}>
          <button className="secondary-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}