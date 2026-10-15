// src/screens/HistoryModal.tsx
import { useState } from 'react';
import { useMatchHistory } from '../api/queries';

interface HistoryModalProps {
  onClose: () => void;
}

export function HistoryModal({ onClose }: HistoryModalProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useMatchHistory(page);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="history-heading">
      <div className="modal-box data-modal-box">
        <h2 id="history-heading">Match History</h2>
        <p className="eyebrow">Your Recent Voyages</p>

        {isLoading && <p className="data-status">Loading match logs…</p>}

        {isError && (
          <div className="data-error">
            <p>Could not load match history: {error instanceof Error ? error.message : 'Error'}</p>
            <button className="secondary-button" onClick={() => refetch()}>
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !isError && data && (
          <>
            {data.items.length === 0 ? (
              <p className="data-status">You have not completed any matches yet. Set sail to record history!</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Score</th>
                    <th>Time</th>
                    <th>Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((m) => (
                    <tr key={m.id}>
                      <td>{new Date(m.date).toLocaleDateString()}</td>
                      <td className="score-col">{m.score} pts</td>
                      <td>{m.durationSeconds}s</td>
                      <td>{m.endReason === 'time_out' ? 'Victory (Time)' : 'Sunk'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

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