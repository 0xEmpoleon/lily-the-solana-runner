import React, { useState, useEffect, useCallback } from 'react';

// Empty string = same origin (works on Vercel); localhost fallback for Docker dev
const API = import.meta.env.VITE_API_URL || '';

interface Entry {
  _id: string;
  name: string;
  score: number;
  coins: number;
  wallet: string;
  createdAt: string;
}

interface LeaderboardProps {
  onClose: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/leaderboard`);
      if (!res.ok) throw new Error('Failed to load');
      setEntries(await res.json());
    } catch {
      setError('Could not load scores. Is the server running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md pointer-events-auto">
      <div className="bg-slate-900 rounded-3xl p-6 mx-4 w-full max-w-sm border border-cyan-500/40 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-cyan-400 font-black text-2xl tracking-tight">🏆 LEADERBOARD</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl transition-colors leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="text-center py-10 text-slate-400 animate-pulse">Loading scores…</div>
          )}
          {error && (
            <div className="text-center py-6 text-red-400 text-sm">{error}</div>
          )}
          {!loading && !error && entries.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              <p className="text-4xl mb-3">🏃</p>
              <p>No scores yet. Be the first!</p>
            </div>
          )}
          {!loading && entries.map((e, i) => (
            <div
              key={e._id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1.5 ${
                i < 3 ? 'bg-slate-800/80 border border-slate-700' : 'bg-slate-800/40'
              }`}
            >
              <span className="text-xl w-8 text-center shrink-0">
                {i < 3 ? medals[i] : `${i + 1}.`}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">
                  {e.name || 'Anonymous'}
                </p>
                {e.wallet && (
                  <p className="text-slate-500 font-mono text-xs truncate">
                    {e.wallet.slice(0, 10)}…
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-cyan-400 font-mono font-bold text-lg leading-tight">{e.score}</p>
                <p className="text-yellow-400 font-mono text-xs">💰{e.coins}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Refresh */}
        <button
          onClick={fetchLeaderboard}
          className="mt-4 w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors text-sm"
        >
          Refresh
        </button>
      </div>
    </div>
  );
};

/** Submit a score to the backend */
export const submitScore = async (payload: {
  name: string;
  score: number;
  coins: number;
  wallet: string;
}) => {
  try {
    await fetch(`${API}/api/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch { /* ignore network errors */ }
};
