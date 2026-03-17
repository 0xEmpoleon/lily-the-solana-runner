import React from 'react';
import type { CharacterType, DailyChallenge } from '../store/useGameState';
import { MASCOT_ASSETS } from '../../../assets';

// ── CharacterCard ─────────────────────────────────────────────────────────────
const CharacterCard = ({
  label, emoji, desc, selected, onSelect,
}: { label: string; emoji: string; desc: string; selected: boolean; onSelect: () => void }) => (
  <button
    onClick={onSelect}
    className={`flex-1 rounded-2xl p-4 border-2 transition-all text-center ${
      selected
        ? 'border-cyan-400 bg-cyan-500/20 scale-105 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
        : 'border-slate-600 bg-slate-800/60 hover:border-slate-400'
    }`}
  >
    <div className="text-5xl mb-2">{emoji}</div>
    <p className="text-white font-black text-base">{label}</p>
    <p className="text-slate-400 text-xs mt-1">{desc}</p>
    {selected && <p className="text-cyan-400 text-xs font-bold mt-2">SELECTED ✓</p>}
  </button>
);

// ── ChallengeBadge ────────────────────────────────────────────────────────────
const ChallengeBadge = ({ dc }: { dc: DailyChallenge }) => {
  const pct = Math.min((dc.progress / dc.target) * 100, 100);
  return (
    <div className={`w-full max-w-[320px] px-4 py-3 rounded-xl border flex flex-col gap-1 ${
      dc.completed ? 'border-green-500/60 bg-green-900/30' : 'border-yellow-500/40 bg-yellow-900/20'
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{dc.completed ? '✅' : '📋'}</span>
        <span className="text-yellow-300 font-bold text-xs uppercase tracking-wider">Daily Challenge</span>
      </div>
      <p className="text-white text-sm">{dc.description}</p>
      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${dc.completed ? 'bg-green-400' : 'bg-yellow-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-slate-400 text-xs text-right">
        {dc.completed ? 'Complete!' : `${dc.progress} / ${dc.target}`}
      </p>
    </div>
  );
};

// ── GameMenu ──────────────────────────────────────────────────────────────────
interface GameMenuProps {
  highScore:         number;
  character:         CharacterType;
  setCharacter:      (c: CharacterType) => void;
  dailyChallenge:    DailyChallenge;
  muted:             boolean;
  onToggleMute:      () => void;
  onStart:           () => void;
  onShowLeaderboard: () => void;
}

export const GameMenu: React.FC<GameMenuProps> = ({
  highScore, character, setCharacter, dailyChallenge,
  muted, onToggleMute, onStart, onShowLeaderboard,
}) => (
  <div className="absolute inset-0 flex flex-col items-center justify-start pt-10 pb-6 overflow-y-auto bg-slate-900/88 pointer-events-auto backdrop-blur-sm gap-4">
    <button className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl" onClick={onToggleMute}>
      {muted ? '🔇' : '🔊'}
    </button>

    <img src={MASCOT_ASSETS.PLAYING} alt="JOY" className="w-28 h-28 object-contain drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
    <div className="text-center -mt-2">
      <h1 className="text-5xl font-black text-white leading-tight">MARS</h1>
      <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent italic">SURFERS</h1>
    </div>

    {highScore > 0 && (
      <div className="px-5 py-1.5 rounded-full bg-yellow-400/20 border border-yellow-400/50">
        <span className="text-yellow-400 font-bold text-sm">🏆 BEST: {highScore}</span>
      </div>
    )}

    <div className="w-full max-w-[320px] flex flex-col gap-2">
      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider text-center">Choose Character</p>
      <div className="flex gap-3">
        <CharacterCard label="Penguin" emoji="🐧" desc="Space explorer"
          selected={character === 'penguin'} onSelect={() => setCharacter('penguin')} />
        <CharacterCard label="Bear" emoji="🐻" desc="Tough adventurer"
          selected={character === 'bear'} onSelect={() => setCharacter('bear')} />
      </div>
    </div>

    <ChallengeBadge dc={dailyChallenge} />

    <button
      onClick={onStart}
      className="px-12 py-4 bg-cyan-500 hover:bg-cyan-400 hover:scale-105 active:scale-95 text-white font-black rounded-full transition-all text-2xl shadow-[0_0_25px_rgba(6,182,212,0.7)] border border-cyan-300"
    >
      RUN
    </button>

    <button onClick={onShowLeaderboard} className="text-slate-300 hover:text-white text-sm underline transition-colors">
      🏆 View Leaderboard
    </button>

    <div className="text-center text-slate-500 text-xs space-y-0.5">
      <p>← → Lane &nbsp;|&nbsp; ↑ Jump &nbsp;|&nbsp; ↑↑ Double Jump &nbsp;|&nbsp; ↓ Roll</p>
      <p>🛡 Shield · ⚡ Invincible · 🧲 Magnet · ⏱ Slow-Mo · ⭐ Star=5 coins</p>
    </div>
  </div>
);
