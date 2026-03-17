import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';
import Player from './Player';
import { ObstacleManager } from './world/ObstacleManager';
import { TrackManager } from './world/TrackManager';
import { CollectibleManager } from './world/Collectibles';
import { PowerupManager } from './world/PowerupManager';
import { ParticleSystem } from './world/ParticleSystem';
import { ScorePopups } from './ScorePopups';
import { useGameState } from './store/useGameState';
import type { PowerupType } from './store/useGameState';
import { Tutorial, shouldShowTutorial } from './Tutorial';
import { Leaderboard, submitScore } from './Leaderboard';
import { soundEngine } from '../../utils/sound';
import { scorePopupEvents } from '../../utils/scorePopupEvents';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { MASCOT_ASSETS as MASCOT } from '../../assets';

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
const POWERUP_DURATIONS: Record<ActivePowerup, number> = {
  shield: 8, magnet: 10, invincible: 6, slowmo: 5,
};

const MILESTONE_LABELS: Record<number, string> = {
  100: '🔥 GETTING HOT!',
  500: '⚡ SPEED RUNNER!',
  1000: '🌟 UNSTOPPABLE!',
  2500: '🚀 COSMIC!',
  5000: '💎 LEGENDARY!',
};

// ── Character card ────────────────────────────────────────────────────────────
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

// ── Camera controller — soft-follows player's lane so full body stays in view ─
const _lookAt = new THREE.Vector3();
const CameraController: React.FC<{ playerPosRef: React.MutableRefObject<THREE.Vector3> }> = ({ playerPosRef }) => {
  const { camera } = useThree();
  useFrame((_, delta) => {
    // Gently pan camera x toward 35 % of player's lane offset
    const targetX = playerPosRef.current.x * 0.35;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, delta * 5);
    // Always look toward the player's approximate mid-height
    _lookAt.set(camera.position.x * 0.4, 1.0, 0);
    camera.lookAt(_lookAt);
  });
  return null;
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
    milestoneScore, clearMilestone,
    runHistory,
  } = useGameState();

  const playerPosRef    = useRef(new THREE.Vector3(0, 0, 0));
  const playerHitboxRef = useRef({ y: 0, height: 1.8 });

  // UI state
  const [showTutorial, setShowTutorial]       = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [muted, setMuted]                     = useState(false);
  const [playerName, setPlayerName]           = useState('');
  const [walletAddr, setWalletAddr]           = useState('');
  const [submitted, setSubmitted]             = useState(false);
  const [milestoneBanner, setMilestoneBanner]  = useState<string | null>(null);

  // Reown wallet
  const { open: openWallet }                   = useAppKit();
  const { address: connectedAddress, isConnected } = useAppKitAccount();

  // Auto-populate wallet field when a wallet connects/disconnects
  useEffect(() => {
    setWalletAddr(connectedAddress ?? '');
  }, [connectedAddress]);

  const isNewHighScore = gameState === 'GAMEOVER' && Math.floor(score) > 0 && Math.floor(score) >= highScore;

  // Milestone banner + popup
  useEffect(() => {
    if (!milestoneScore) return;
    const label = MILESTONE_LABELS[milestoneScore] ?? `🎯 ${milestoneScore}!`;
    setMilestoneBanner(label);
    scorePopupEvents.emit({ text: label, color: '#38bdf8', big: true });
    const t = setTimeout(() => {
      setMilestoneBanner(null);
      clearMilestone();
    }, 2200);
    return () => clearTimeout(t);
  }, [milestoneScore, clearMilestone]);

  // Daily challenge completion popup
  const prevCompleted = useRef(dailyChallenge.completed);
  useEffect(() => {
    if (dailyChallenge.completed && !prevCompleted.current && gameState === 'PLAYING') {
      scorePopupEvents.emit({ text: '✅ DAILY DONE!', color: '#4ade80', big: true });
    }
    prevCompleted.current = dailyChallenge.completed;
  }, [dailyChallenge.completed, gameState]);

  // Keyboard shortcut to start
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'Enter') && (gameState === 'MENU' || gameState === 'GAMEOVER')) {
        if (gameState === 'MENU' && shouldShowTutorial()) {
          setShowTutorial(true);
        } else {
          startGame();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gameState, startGame]);

  useEffect(() => {
    if (gameState === 'PLAYING') setSubmitted(false);
  }, [gameState]);

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
    updateChallenge('score', Math.floor(score));
    updateChallenge('combo', useGameState.getState().maxCombo);
  };

  const toggleMute = () => setMuted(soundEngine.toggle());

  // Previous run scores (exclude current run at index 0 if just finished)
  const prevRuns = gameState === 'GAMEOVER' ? runHistory.slice(1, 4) : runHistory.slice(0, 3);

  return (
    <div className="w-full h-screen bg-black relative touch-none select-none">
      <Canvas shadows>
        {/* Pulled back + wider FOV so full body is always visible across all lanes */}
        <PerspectiveCamera makeDefault position={[0, 5.5, 11]} fov={62} />
        <ambientLight intensity={activePowerup === 'slowmo' ? 1.2 : 0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={activePowerup === 'slowmo' ? 0.2 : 1} />

        {gameState === 'PLAYING' && (
          <Suspense fallback={null}>
            <CameraController playerPosRef={playerPosRef} />
            <TrackManager />
            <Player positionRef={playerPosRef} hitboxRef={playerHitboxRef} />
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

              {/* Mute button */}
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
                {/* Multiplier badge — always visible when > 1 */}
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
                    style={{ width: `${Math.min((powerupTimeLeft / POWERUP_DURATIONS[activePowerup]) * 100, 100)}%` }}
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

            {/* Score popups (floating text) */}
            <ScorePopups />
          </>
        )}

        {/* ── MENU ── */}
        {gameState === 'MENU' && (
          <div className="absolute inset-0 flex flex-col items-center justify-start pt-10 pb-6 overflow-y-auto bg-slate-900/88 pointer-events-auto backdrop-blur-sm gap-4">
            <button className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl" onClick={toggleMute}>
              {muted ? '🔇' : '🔊'}
            </button>

            <img src={MASCOT.PLAYING} alt="JOY" className="w-28 h-28 object-contain drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
            <div className="text-center -mt-2">
              <h1 className="text-5xl font-black text-white leading-tight">MARS</h1>
              <h1 className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent italic">SURFERS</h1>
            </div>

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
                  label="Penguin" emoji="🐧" desc="Space explorer"
                  selected={character === 'penguin'} onSelect={() => setCharacter('penguin')}
                />
                <CharacterCard
                  label="Bear" emoji="🐻" desc="Tough adventurer"
                  selected={character === 'bear'} onSelect={() => setCharacter('bear')}
                />
              </div>
            </div>

            <ChallengeBadge />

            <button
              onClick={handleStart}
              className="px-12 py-4 bg-cyan-500 hover:bg-cyan-400 hover:scale-105 active:scale-95 text-white font-black rounded-full transition-all text-2xl shadow-[0_0_25px_rgba(6,182,212,0.7)] border border-cyan-300"
            >
              RUN
            </button>

            <button
              onClick={() => setShowLeaderboard(true)}
              className="text-slate-300 hover:text-white text-sm underline transition-colors"
            >
              🏆 View Leaderboard
            </button>

            <div className="text-center text-slate-500 text-xs space-y-0.5">
              <p>← → Lane &nbsp;|&nbsp; ↑ Jump &nbsp;|&nbsp; ↑↑ Double Jump &nbsp;|&nbsp; ↓ Roll</p>
              <p>🛡 Shield · ⚡ Invincible · 🧲 Magnet · ⏱ Slow-Mo · ⭐ Star=5 coins</p>
            </div>
          </div>
        )}

        {/* ── GAME OVER ── */}
        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/92 pointer-events-auto backdrop-blur-md px-4 gap-3 overflow-y-auto py-6">

            <img
              src={isNewHighScore ? MASCOT.REWARD : MASCOT.BETTER_LUCK}
              alt="JOY"
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
                    <span key={i} className="text-slate-300 font-mono text-sm bg-slate-800 px-2 py-0.5 rounded-lg">
                      {s}
                    </span>
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
                {/* Wallet — connect via Reown or skip */}
                {isConnected && connectedAddress ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-green-500/50 rounded-lg">
                    <span className="text-green-400 text-xs shrink-0">●</span>
                    <span className="text-white font-mono text-xs truncate flex-1">
                      {connectedAddress.slice(0, 10)}…{connectedAddress.slice(-6)}
                    </span>
                    <button
                      onClick={() => openWallet({ view: 'Account' })}
                      className="text-slate-400 hover:text-white text-xs shrink-0 transition-colors"
                    >
                      change
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => openWallet()}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition-colors"
                  >
                    🔗 Connect Wallet
                  </button>
                )}
                <button
                  onClick={handleSubmit}
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

      {showTutorial    && <Tutorial    onDismiss={handleTutorialDismiss} />}
      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
    </div>
  );
};

export default GameScene;
