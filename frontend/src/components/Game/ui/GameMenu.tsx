import React from 'react';
import type { CharacterType, DailyChallenge } from '../store/useGameState';


// ── CharacterCard ─────────────────────────────────────────────────────────────
const CharacterCard = ({
  label, emoji, desc, selected, onSelect,
}: { label: string; emoji: string; desc: string; selected: boolean; onSelect: () => void }) => (
  <button
    onClick={onSelect}
    className={`flex-1 rounded-2xl p-3 border-2 transition-all text-center ${
      selected
        ? 'border-[#14F195] bg-[#14F195]/10 scale-105 shadow-[0_0_20px_rgba(20,241,149,0.3)]'
        : 'border-slate-700 bg-slate-900/60 hover:border-[#9945FF]/50'
    }`}
  >
    <div className="text-4xl mb-1">{emoji}</div>
    <p className="text-[#14F195] font-black text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>{label}</p>
    <p className="text-slate-400 text-[10px] mt-0.5">{desc}</p>
    {selected && <p className="text-[#14F195] text-[10px] font-bold mt-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>SELECTED ✓</p>}
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
  highScore:          number;
  character:          CharacterType;
  setCharacter:       (c: CharacterType) => void;
  dailyChallenge:     DailyChallenge;
  muted:              boolean;
  onToggleMute:       () => void;
  onStart:            () => void;
  onShowLeaderboard:  () => void;
  isConnected:        boolean;
  connectedAddress?:  string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onOpenWallet:       (opts?: any) => void;
}

export const GameMenu: React.FC<GameMenuProps> = ({
  highScore, character, setCharacter, dailyChallenge,
  muted, onToggleMute, onStart, onShowLeaderboard,
  isConnected, connectedAddress, onOpenWallet,
}) => (
  <div className="absolute inset-0 flex flex-col items-center justify-start pt-8 pb-6 overflow-y-auto bg-black/92 pointer-events-auto backdrop-blur-sm gap-4">
    <button className="absolute top-4 right-4 text-yellow-400/60 hover:text-yellow-300 text-xl" onClick={onToggleMute}>
      {muted ? '🔇' : '🔊'}
    </button>

    <div className="text-6xl mb-1 drop-shadow-[0_0_25px_rgba(20,241,149,0.5)]">🐭</div>
    <div className="text-center -mt-2">
      <p className="text-[#14F195]/60 text-[10px] tracking-[0.4em] uppercase" style={{ fontFamily: 'Orbitron, sans-serif' }}>Surfing the blockchain at light speed…</p>
      <h1 className="text-5xl font-black leading-tight mt-2 drop-shadow-[0_0_20px_rgba(153,69,255,0.5)]" style={{ fontFamily: 'Orbitron, sans-serif', background: 'linear-gradient(135deg, #9945FF, #14F195)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>LILY</h1>
      <h1 className="text-2xl font-black text-[#14F195]/90 italic tracking-widest" style={{ fontFamily: 'Orbitron, sans-serif' }}>THE SOLANA RUNNER</h1>
    </div>

    {highScore > 0 && (
      <div className="px-5 py-1.5 rounded-full bg-[#14F195]/10 border border-[#14F195]/40">
        <span className="text-[#14F195] font-bold text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>BEST: {highScore}</span>
      </div>
    )}

    <div className="w-full max-w-[340px] flex flex-col gap-2">
      <p className="text-[#14F195]/50 text-xs font-bold uppercase tracking-wider text-center" style={{ fontFamily: 'Orbitron, sans-serif' }}>Choose Your Runner</p>
      <div className="flex gap-2">
        <CharacterCard label="Lily" emoji="🐭" desc="Solana speedster"
          selected={character === 'mouse'} onSelect={() => setCharacter('mouse')} />
        <CharacterCard label="Penguin" emoji="🐧" desc="Space explorer"
          selected={character === 'penguin'} onSelect={() => setCharacter('penguin')} />
        <CharacterCard label="Bear" emoji="🐻" desc="Tough adventurer"
          selected={character === 'bear'} onSelect={() => setCharacter('bear')} />
      </div>
    </div>

    <ChallengeBadge dc={dailyChallenge} />

    <button
      onClick={onStart}
      className="px-12 py-4 hover:scale-105 active:scale-95 text-black font-black rounded-full transition-all text-2xl shadow-[0_0_30px_rgba(20,241,149,0.5)] border-2 border-[#14F195]"
      style={{ fontFamily: 'Orbitron, sans-serif', background: 'linear-gradient(135deg, #9945FF, #14F195)' }}
    >
      RUN
    </button>

    <button onClick={onShowLeaderboard} className="text-[#14F195]/60 hover:text-[#14F195] text-sm underline transition-colors" style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '11px' }}>
      VIEW LEADERBOARD
    </button>

    {/* Wallet connect */}
    <div className="flex items-center justify-center">
      {isConnected && connectedAddress ? (
        <button
          onClick={() => onOpenWallet({ view: 'Account' })}
          className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-900/40 border border-green-500/50 text-green-400 text-xs"
        >
          <span>●</span>
          <span>{connectedAddress.slice(0, 8)}…{connectedAddress.slice(-4)}</span>
        </button>
      ) : (
        <button
          onClick={() => onOpenWallet()}
          className="flex items-center gap-1 px-3 py-1 rounded-full border border-slate-600 text-slate-400 hover:border-cyan-400 hover:text-cyan-400 text-xs transition-colors"
        >
          🔗 Connect Wallet
        </button>
      )}
    </div>

    <div className="text-center text-[#14F195]/25 text-[9px] space-y-0.5" style={{ fontFamily: 'Orbitron, sans-serif' }}>
      <p>← → LANE &nbsp;|&nbsp; ↑ JUMP &nbsp;|&nbsp; ↑↑ DOUBLE JUMP &nbsp;|&nbsp; ↓ ROLL</p>
      <p>SHIELD · INVINCIBLE · MAGNET · SLOW-MO · STAR=5 COINS</p>
    </div>
  </div>
);
