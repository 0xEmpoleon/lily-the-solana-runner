import React from 'react';
import type { PowerupType } from '../store/useGameState';
import type { DailyChallenge } from '../store/useGameState';
import { POWERUP_PALETTE } from '../../../assets';
import { ScorePopups } from '../ScorePopups';

type ActivePowerup = NonNullable<PowerupType>;

const POWERUP_ICONS: Record<ActivePowerup, string> = {
  shield: '🛡️', magnet: '🧲', invincible: '⚡', slowmo: '⏱',
};
const POWERUP_COLORS: Record<ActivePowerup, string> = {
  shield:    'from-blue-500 to-cyan-400',
  magnet:    'from-purple-500 to-pink-400',
  invincible:'from-yellow-400 to-orange-500',
  slowmo:    'from-green-400 to-emerald-500',
};

interface GameHUDProps {
  score:          number;
  highScore:      number;
  coins:          number;
  multiplier:     number;
  combo:          number;
  activePowerup:  PowerupType;
  powerupTimeLeft:number;
  dailyChallenge: DailyChallenge;
  milestoneBanner:string | null;
  muted:          boolean;
  onToggleMute:   () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  score, highScore, coins, multiplier, combo,
  activePowerup, powerupTimeLeft, dailyChallenge, milestoneBanner,
  muted, onToggleMute,
}) => (
  <>
    {/* Top bar */}
    <div className="w-full p-4 px-5 flex justify-between items-start">
      <div>
        <p className="text-white font-black text-sm leading-none">SCORE</p>
        <p className="text-cyan-400 font-mono text-3xl font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
          {Math.floor(score)}
        </p>
        {highScore > 0 && <p className="text-slate-400 text-xs font-mono">BEST {highScore}</p>}
      </div>

      <button
        className="pointer-events-auto text-slate-400 hover:text-white text-xl mt-1 transition-colors"
        onClick={onToggleMute}
      >
        {muted ? '🔇' : '🔊'}
      </button>

      <div className="text-right">
        <p className="text-white font-black text-sm leading-none">COINS</p>
        <p className="text-yellow-400 font-mono text-3xl font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">
          {coins}
        </p>
        {multiplier > 1 && (
          <p className="text-orange-400 font-black text-sm animate-pulse">×{multiplier}</p>
        )}
      </div>
    </div>

    {/* Combo counter */}
    {combo >= 3 && (
      <div className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <span className="text-orange-400 font-black text-2xl drop-shadow-[0_0_12px_rgba(251,146,60,0.9)] animate-bounce">
          {combo}× COMBO!
        </span>
        <span className="text-yellow-300 font-bold text-xs">×{multiplier} MULTIPLIER</span>
      </div>
    )}

    {/* Active power-up */}
    {activePowerup && (
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r ${POWERUP_COLORS[activePowerup]} shadow-lg`}>
          <span>{POWERUP_ICONS[activePowerup]}</span>
          <span className="text-white font-black text-sm uppercase tracking-wider">{activePowerup}</span>
        </div>
        <div className="w-28 h-1.5 bg-white/30 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${POWERUP_COLORS[activePowerup]} transition-all`}
            style={{ width: `${Math.min((powerupTimeLeft / POWERUP_PALETTE[activePowerup].duration) * 100, 100)}%` }}
          />
        </div>
      </div>
    )}

    {/* Milestone banner */}
    {milestoneBanner && (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="px-6 py-3 rounded-2xl bg-cyan-500/30 border-2 border-cyan-400 backdrop-blur-sm animate-bounce">
          <p className="text-cyan-300 font-black text-2xl text-center drop-shadow-[0_0_15px_rgba(34,211,238,1)]">
            {milestoneBanner}
          </p>
        </div>
      </div>
    )}

    {/* Daily challenge mini-badge */}
    {!dailyChallenge.completed ? (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 border border-yellow-500/40">
          <span className="text-xs text-yellow-300">📋 {dailyChallenge.progress}/{dailyChallenge.target}</span>
        </div>
      </div>
    ) : (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-900/70 border border-green-400/60">
          <span className="text-xs text-green-300 font-bold">✅ Daily complete!</span>
        </div>
      </div>
    )}

    <ScorePopups />
  </>
);
