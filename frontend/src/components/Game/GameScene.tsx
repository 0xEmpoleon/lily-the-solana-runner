import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';
import Player from './Player';
import { ObstacleManager } from './world/ObstacleManager';
import { TrackManager } from './world/TrackManager';
import { CollectibleManager } from './world/Collectibles';
import { PowerupManager } from './world/PowerupManager';
import { ParticleSystem } from './world/ParticleSystem';
import { useGameState } from './store/useGameState';
import type { CharacterType } from './store/useGameState';
import { Tutorial, shouldShowTutorial } from './Tutorial';
import { Leaderboard, submitScore } from './Leaderboard';
import { soundEngine } from '../../utils/sound';

// ── Asset paths ──────────────────────────────────────────────────────────────
const MASCOT = {
  playing:    '/mascot/PLAYING JOY.png',
  running:    '/mascot/RUNNING.png',
  jump:       '/mascot/JUMP.png',
  betterLuck: '/mascot/Better luck.png',
  reward:     '/mascot/NFTHAPPY reward.png',
  thumbsUp:   '/mascot/4 thumbs up.png',
  hodl:       '/mascot/HODL.png',
};

const POWERUP_ICONS: Record<string, string> = {
  shield: '🛡️', magnet: '🧲', invincible: '⚡',
};
const POWERUP_COLORS: Record<string, string> = {
  shield:    'from-blue-500 to-cyan-400',
  magnet:    'from-purple-500 to-pink-400',
  invincible:'from-yellow-400 to-orange-500',
};
const POWERUP_DURATIONS: Record<string, number> = {
  shield: 8, magnet: 10, invincible: 6,
};

// ── Character card ────────────────────────────────────────────────────────────
const CharacterCard = ({
  label, emoji, desc, selected, onSelect,
}: { id: CharacterType; label: string; emoji: string; desc: string; selected: boolean; onSelect: () => void }) => (
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

// ── Daily challenge badge ────────────────────────────────────────────────────
const ChallengeBadge = () => {
  const { dailyChallenge } = useGameState();
  const dc = dailyChallenge;
  const pct = Math.min((dc.progress / dc.target) * 100, 100);
  return (
    <div className={`w-full max-w-[320px] px-4 py-3 rounded-xl border flex flex-col gap-1 ${
      dc.completed
        ? 'border-green-500/60 bg-green-900/30'
        : 'border-yellow-500/40 bg-yellow-900/20'
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

// ── Main component ────────────────────────────────────────────────────────────
const GameScene: React.FC = () => {
  const {
    gameState, score, coins, highScore,
    startGame, endGame,
    activePowerup, powerupTimeLeft,
    combo, multiplier,
    character, setCharacter,
    dailyChallenge, updateChallenge,
  } = useGameState();

  const playerPosRef = useRef(new THREE.Vector3(0, 0, 0));
  const playerHitboxRef = useRef({ y: 0, height: 1.8 });

  // UI state
  const [showTutorial, setShowTutorial]   = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [muted, setMuted]                 = useState(false);
  const [playerName, setPlayerName]       = useState('');
  const [walletAddr, setWalletAddr]       = useState('');
  const [submitted, setSubmitted]         = useState(false);

  const isNewHighScore = gameState === 'GAMEOVER' && Math.floor(score) > 0 && Math.floor(score) >= highScore;

  // Keyboard shortcuts for menus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        if (gameState === 'MENU' || gameState === 'GAMEOVER') handleStart();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gameState]);

  // Reset submission state when game restarts
  useEffect(() => {
    if (gameState === 'PLAYING') setSubmitted(false);
  }, [gameState]);

  // Check tutorial on first play
  const handleStart = () => {
    if (gameState === 'MENU' && shouldShowTutorial()) {
      setShowTutorial(true);
      return;
    }
    startGame();
  };

  const handleTutorialDismiss = () => {
    setShowTutorial(false);
    startGame();
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setSubmitted(true);
    await submitScore({
      name:   playerName || 'Anonymous',
      score:  Math.floor(score),
      coins,
      wallet: walletAddr,
    });
    // Also update daily challenge for score type
    updateChallenge('score', Math.floor(score));
    updateChallenge('combo', useGameState.getState().maxCombo);
  };

  const toggleMute = () => setMuted(soundEngine.toggle());

  // Sky color tint per theme (based on score)
  return (
    <div className="w-full h-screen bg-black relative touch-none select-none">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 4, 8]} fov={50} rotation={[-0.2, 0, 0]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

        {gameState === 'PLAYING' && (
          <Suspense fallback={null}>
            <TrackManager />
            <Player positionRef={playerPosRef} hitboxRef={playerHitboxRef} onHitObstacle={() => {}} onCoinCollect={() => {}} />
            <ObstacleManager playerPosRef={playerPosRef} playerHitboxRef={playerHitboxRef} onCrash={endGame} onStumble={() => {}} />
            <CollectibleManager playerPosRef={playerPosRef} />
            <PowerupManager playerPosRef={playerPosRef} />
            <ParticleSystem />
          </Suspense>
        )}

        <Suspense fallback={null}>
          <Environment preset="night" />
        </Suspense>
      </Canvas>

      {/* ── UI Overlays ───────────────────────────────────────────────────── */}
      <div className="absolute inset-0 flex flex-col pointer-events-none">

        {/* ── PLAYING HUD ── */}
        {gameState === 'PLAYING' && (
          <>
            {/* Top bar */}
            <div className="w-full p-4 px-5 flex justify-between items-start">
              <div>
                <p className="text-white font-black text-sm leading-none">SCORE</p>
                <p className="text-cyan-400 font-mono text-3xl font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                  {Math.floor(score)}
                </p>
                {highScore > 0 && (
                  <p className="text-slate-400 text-xs font-mono">BEST {highScore}</p>
                )}
              </div>

              {/* Mute button (pointer-events-auto) */}
              <button
                className="pointer-events-auto text-slate-400 hover:text-white text-xl mt-1 transition-colors"
                onClick={toggleMute}
              >
                {muted ? '🔇' : '🔊'}
              </button>

              <div className="text-right">
                <p className="text-white font-black text-sm leading-none">COINS</p>
                <p className="text-yellow-400 font-mono text-3xl font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">
                  {coins}
                </p>
              </div>
            </div>

            {/* Combo counter */}
            {combo >= 3 && (
              <div className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <span className="text-orange-400 font-black text-2xl drop-shadow-[0_0_12px_rgba(251,146,60,0.9)] animate-bounce">
                  {combo}× COMBO!
                </span>
                {multiplier > 1 && (
                  <span className="text-yellow-300 font-bold text-xs">×{multiplier} MULTIPLIER</span>
                )}
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
                    style={{ width: `${Math.min((powerupTimeLeft / POWERUP_DURATIONS[activePowerup]) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Daily challenge mini-badge */}
            {!dailyChallenge.completed && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 border border-yellow-500/40">
                  <span className="text-xs text-yellow-300">📋 {dailyChallenge.progress}/{dailyChallenge.target}</span>
                </div>
              </div>
            )}
            {dailyChallenge.completed && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce pointer-events-none">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-900/70 border border-green-400/60">
                  <span className="text-xs text-green-300 font-bold">✅ Daily complete!</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── MENU ── */}
        {gameState === 'MENU' && (
          <div className="absolute inset-0 flex flex-col items-center justify-start pt-10 pb-6 overflow-y-auto bg-slate-900/88 pointer-events-auto backdrop-blur-sm gap-4">
            {/* Mute */}
            <button className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl" onClick={toggleMute}>
              {muted ? '🔇' : '🔊'}
            </button>

            {/* Mascot + title */}
            <img src={MASCOT.playing} alt="JOY" className="w-28 h-28 object-contain drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
            <div className="text-center -mt-2">
              <h1 className="text-5xl font-black text-white leading-tight">MARS</h1>
              <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent italic">SURFERS</h1>
            </div>

            {/* High score */}
            {highScore > 0 && (
              <div className="px-5 py-1.5 rounded-full bg-yellow-400/20 border border-yellow-400/50">
                <span className="text-yellow-400 font-bold text-sm">🏆 BEST: {highScore}</span>
              </div>
            )}

            {/* Character select */}
            <div className="w-full max-w-[320px] flex flex-col gap-2">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider text-center">Choose Character</p>
              <div className="flex gap-3">
                <CharacterCard
                  id="penguin" label="Penguin" emoji="🐧" desc="Space explorer"
                  selected={character === 'penguin'} onSelect={() => setCharacter('penguin')}
                />
                <CharacterCard
                  id="bear" label="Bear" emoji="🐻" desc="Tough adventurer"
                  selected={character === 'bear'} onSelect={() => setCharacter('bear')}
                />
              </div>
            </div>

            {/* Daily challenge */}
            <ChallengeBadge />

            {/* Run button */}
            <button
              onClick={handleStart}
              className="px-12 py-4 bg-cyan-500 hover:bg-cyan-400 hover:scale-105 active:scale-95 text-white font-black rounded-full transition-all text-2xl shadow-[0_0_25px_rgba(6,182,212,0.7)] border border-cyan-300"
            >
              RUN
            </button>

            {/* Leaderboard button */}
            <button
              onClick={() => setShowLeaderboard(true)}
              className="text-slate-300 hover:text-white text-sm underline transition-colors"
            >
              🏆 View Leaderboard
            </button>

            {/* Controls hint */}
            <div className="text-center text-slate-500 text-xs space-y-0.5">
              <p>← → Lane &nbsp;|&nbsp; ↑ Jump &nbsp;|&nbsp; ↓ Roll</p>
              <p>❤️ Shield · ⚡ Invincible · 🧲 Magnet · ⭐ Star=5 coins</p>
            </div>
          </div>
        )}

        {/* ── GAME OVER ── */}
        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/92 pointer-events-auto backdrop-blur-md px-4 gap-4">

            <img
              src={isNewHighScore ? MASCOT.reward : MASCOT.betterLuck}
              alt="JOY"
              className="w-28 h-28 object-contain drop-shadow-[0_0_15px_rgba(255,100,100,0.6)]"
            />

            <div className="text-center">
              <h1 className="text-5xl font-black text-white tracking-widest">
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
              <div className="w-full h-px bg-slate-700 my-3" />
              <div className="flex gap-6">
                <span className="text-yellow-400 font-mono text-xl font-bold">💰 {coins}</span>
                {highScore > 0 && <span className="text-cyan-400 font-mono text-xl font-bold">🏆 {highScore}</span>}
              </div>
            </div>

            {/* Wallet + name + submit */}
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="0x... wallet (optional)"
                    value={walletAddr}
                    onChange={e => setWalletAddr(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleSubmit}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                  >
                    SUBMIT
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-green-400 font-bold text-sm">✓ Score submitted!</div>
            )}

            <div className="flex flex-col gap-2 w-full max-w-[300px]">
              <button
                onClick={startGame}
                className="w-full py-4 bg-white hover:bg-slate-200 hover:scale-105 active:scale-95 text-red-900 font-black rounded-full transition-all text-xl shadow-[0_0_15px_rgba(255,255,255,0.4)] border-2 border-white"
              >
                PLAY AGAIN
              </button>
              <button
                onClick={() => setShowLeaderboard(true)}
                className="text-slate-300 hover:text-white text-sm underline text-center transition-colors"
              >
                🏆 View Leaderboard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Tutorial overlay ── */}
      {showTutorial && <Tutorial onDismiss={handleTutorialDismiss} />}

      {/* ── Leaderboard overlay ── */}
      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
    </div>
  );
};

export default GameScene;
