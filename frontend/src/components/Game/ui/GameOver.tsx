import React from 'react';
import { MASCOT_ASSETS } from '../../../assets';
import type { RunStats } from '../store/useGameState';

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
  isConnected:       boolean;
  connectedAddress:  string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onOpenWallet:      (opts?: any) => void;
  runStats:          RunStats;
}

const font = { fontFamily: 'Orbitron, sans-serif' } as const;

export const GameOver: React.FC<GameOverProps> = ({
  score, coins, highScore, prevRuns, isNewHighScore,
  playerName, setPlayerName, submitted, onSubmit,
  onPlayAgain, onShowLeaderboard,
  isConnected, connectedAddress, onOpenWallet,
  runStats,
}) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/94 pointer-events-auto backdrop-blur-md px-4 gap-3 overflow-y-auto py-6">

    <img
      src={isNewHighScore ? MASCOT_ASSETS.REWARD : MASCOT_ASSETS.BETTER_LUCK}
      alt="result"
      className="w-24 h-24 object-contain drop-shadow-[0_0_15px_rgba(255,232,31,0.4)]"
    />

    <div className="text-center">
      <h1 className="text-4xl font-black text-yellow-400 tracking-widest" style={font}>
        {isNewHighScore ? 'NEW BEST!' : 'BUSTED'}
      </h1>
      {isNewHighScore && <p className="text-yellow-300 text-sm font-bold animate-pulse" style={font}>HIGH SCORE!</p>}
    </div>

    {/* Score panel */}
    <div className="bg-black/60 px-6 py-4 rounded-2xl border border-yellow-500/30 flex flex-col items-center w-full max-w-[300px]">
      <span className="text-yellow-400/60 text-xs font-bold tracking-widest" style={font}>FINAL SCORE</span>
      <span className="text-yellow-400 font-mono text-5xl font-black drop-shadow-[0_0_10px_rgba(255,232,31,0.4)] mt-1">
        {Math.floor(score)}
      </span>
      <div className="w-full h-px bg-yellow-500/20 my-2" />
      <div className="flex gap-6">
        <span className="text-yellow-300/80 font-mono text-xl font-bold">💰 {coins}</span>
        {highScore > 0 && <span className="text-yellow-400/60 font-mono text-xl font-bold">🏆 {highScore}</span>}
      </div>
    </div>

    {/* Run history */}
    {prevRuns.length > 0 && (
      <div className="w-full max-w-[300px] bg-black/40 px-4 py-2 rounded-xl border border-gray-800">
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1.5" style={font}>Previous Runs</p>
        <div className="flex gap-2 flex-wrap">
          {prevRuns.map((s, i) => (
            <span key={i} className="text-gray-300 font-mono text-sm bg-gray-900 px-2 py-0.5 rounded-lg">{s}</span>
          ))}
        </div>
      </div>
    )}

    {/* Run stats */}
    <div className="w-full max-w-[300px] bg-black/40 px-4 py-3 rounded-xl border border-gray-800">
      <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2" style={font}>Run Breakdown</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <div className="flex justify-between"><span className="text-gray-500 text-xs">Near Misses</span><span className="text-yellow-400/80 font-mono text-xs font-bold">{runStats.nearMisses}</span></div>
        <div className="flex justify-between"><span className="text-gray-500 text-xs">Max Combo</span><span className="text-yellow-300/80 font-mono text-xs font-bold">{runStats.maxCombo}x</span></div>
        <div className="flex justify-between"><span className="text-gray-500 text-xs">Powerups</span><span className="text-yellow-400/60 font-mono text-xs font-bold">{runStats.powerupsCollected}</span></div>
        <div className="flex justify-between"><span className="text-gray-500 text-xs">Distance</span><span className="text-yellow-300/60 font-mono text-xs font-bold">{Math.floor(runStats.distanceTraveled)}m</span></div>
      </div>
      {runStats.zonesReached.length > 1 && (
        <div className="mt-2 flex gap-1 flex-wrap">
          {runStats.zonesReached.map(z => (
            <span key={z} className="text-xs px-1.5 py-0.5 rounded bg-gray-900 text-gray-400">{z}</span>
          ))}
        </div>
      )}
    </div>

    {/* Submit score */}
    {!submitted ? (
      <div className="w-full max-w-[300px] bg-black/50 p-4 rounded-xl border border-yellow-500/30 flex flex-col gap-2">
        <label className="text-yellow-400 text-xs font-bold tracking-wider" style={font}>UPLOAD SCORE!</label>
        <input
          type="text"
          placeholder="Your name (optional)"
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
          className="bg-black border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-yellow-500"
        />
        {isConnected && connectedAddress ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-black border border-yellow-500/30 rounded-lg">
            <span className="text-yellow-400 text-xs shrink-0">●</span>
            <span className="text-white font-mono text-xs truncate flex-1">
              {connectedAddress.slice(0, 10)}…{connectedAddress.slice(-6)}
            </span>
            <button
              onClick={() => onOpenWallet({ view: 'Account' })}
              className="text-gray-500 hover:text-white text-xs shrink-0 transition-colors"
            >
              change
            </button>
          </div>
        ) : (
          <button
            onClick={() => onOpenWallet()}
            className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-yellow-400 font-bold rounded-lg text-sm transition-colors border border-gray-700"
            style={font}
          >
            Connect Wallet
          </button>
        )}
        <button
          onClick={onSubmit}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg font-bold text-sm transition-colors"
          style={font}
        >
          SUBMIT
        </button>
      </div>
    ) : (
      <div className="text-yellow-400 font-bold text-sm" style={font}>✓ Score uploaded!</div>
    )}

    <div className="flex flex-col gap-2 w-full max-w-[300px]">
      <button
        onClick={onPlayAgain}
        className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 hover:scale-105 active:scale-95 text-black font-black rounded-full transition-all text-xl shadow-[0_0_20px_rgba(255,232,31,0.4)] border-2 border-yellow-300"
        style={font}
      >
        PLAY AGAIN
      </button>
      <button
        onClick={onShowLeaderboard}
        className="text-yellow-400/50 hover:text-yellow-300 text-sm underline text-center transition-colors"
        style={{ ...font, fontSize: '11px' }}
      >
        VIEW LEADERBOARD
      </button>
    </div>
  </div>
);
