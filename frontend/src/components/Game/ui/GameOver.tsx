import React from 'react';
import { MASCOT_ASSETS } from '../../../assets';

interface GameOverProps {
  score:             number;
  coins:             number;
  highScore:         number;
  prevRuns:          number[];
  isNewHighScore:    boolean;
  playerName:        string;
  setPlayerName:     (v: string) => void;
  submitted:         boolean;
  onSubmit:          () => void;
  onPlayAgain:       () => void;
  onShowLeaderboard: () => void;
  // Wallet
  isConnected:       boolean;
  connectedAddress:  string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onOpenWallet:      (opts?: any) => void;
}

export const GameOver: React.FC<GameOverProps> = ({
  score, coins, highScore, prevRuns, isNewHighScore,
  playerName, setPlayerName, submitted, onSubmit,
  onPlayAgain, onShowLeaderboard,
  isConnected, connectedAddress, onOpenWallet,
}) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/92 pointer-events-auto backdrop-blur-md px-4 gap-3 overflow-y-auto py-6">

    <img
      src={isNewHighScore ? MASCOT_ASSETS.REWARD : MASCOT_ASSETS.BETTER_LUCK}
      alt="result"
      className="w-24 h-24 object-contain drop-shadow-[0_0_15px_rgba(255,100,100,0.6)]"
    />

    <div className="text-center">
      <h1 className="text-4xl font-black text-white tracking-widest">
        {isNewHighScore ? '🏆 NEW BEST!' : 'BUSTED'}
      </h1>
      {isNewHighScore && <p className="text-yellow-300 text-sm font-bold animate-pulse">HIGH SCORE!</p>}
    </div>

    {/* Score panel */}
    <div className="bg-slate-800/80 px-6 py-4 rounded-2xl border border-red-500/50 flex flex-col items-center w-full max-w-[300px]">
      <span className="text-slate-400 text-xs font-bold tracking-widest">FINAL SCORE</span>
      <span className="text-red-400 font-mono text-5xl font-black drop-shadow-[0_0_10px_rgba(248,113,113,0.5)] mt-1">
        {Math.floor(score)}
      </span>
      <div className="w-full h-px bg-slate-700 my-2" />
      <div className="flex gap-6">
        <span className="text-yellow-400 font-mono text-xl font-bold">💰 {coins}</span>
        {highScore > 0 && <span className="text-cyan-400 font-mono text-xl font-bold">🏆 {highScore}</span>}
      </div>
    </div>

    {/* Run history */}
    {prevRuns.length > 0 && (
      <div className="w-full max-w-[300px] bg-slate-900/60 px-4 py-2 rounded-xl border border-slate-700">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5">Previous Runs</p>
        <div className="flex gap-2 flex-wrap">
          {prevRuns.map((s, i) => (
            <span key={i} className="text-slate-300 font-mono text-sm bg-slate-800 px-2 py-0.5 rounded-lg">{s}</span>
          ))}
        </div>
      </div>
    )}

    {/* Submit score */}
    {!submitted ? (
      <div className="w-full max-w-[300px] bg-slate-800/80 p-4 rounded-xl border border-cyan-500/50 flex flex-col gap-2">
        <label className="text-cyan-400 text-xs font-bold tracking-wider">CLAIM REWARD</label>
        <input
          type="text"
          placeholder="Your name (optional)"
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
          className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
        />
        {isConnected && connectedAddress ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-green-500/50 rounded-lg">
            <span className="text-green-400 text-xs shrink-0">●</span>
            <span className="text-white font-mono text-xs truncate flex-1">
              {connectedAddress.slice(0, 10)}…{connectedAddress.slice(-6)}
            </span>
            <button
              onClick={() => onOpenWallet({ view: 'Account' })}
              className="text-slate-400 hover:text-white text-xs shrink-0 transition-colors"
            >
              change
            </button>
          </div>
        ) : (
          <button
            onClick={() => onOpenWallet()}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition-colors"
          >
            🔗 Connect Wallet
          </button>
        )}
        <button
          onClick={onSubmit}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
        >
          SUBMIT
        </button>
      </div>
    ) : (
      <div className="text-green-400 font-bold text-sm">✓ Score submitted!</div>
    )}

    <div className="flex flex-col gap-2 w-full max-w-[300px]">
      <button
        onClick={onPlayAgain}
        className="w-full py-4 bg-white hover:bg-slate-200 hover:scale-105 active:scale-95 text-red-900 font-black rounded-full transition-all text-xl shadow-[0_0_15px_rgba(255,255,255,0.4)] border-2 border-white"
      >
        PLAY AGAIN
      </button>
      <button
        onClick={onShowLeaderboard}
        className="text-slate-300 hover:text-white text-sm underline text-center transition-colors"
      >
        🏆 View Leaderboard
      </button>
    </div>
  </div>
);
