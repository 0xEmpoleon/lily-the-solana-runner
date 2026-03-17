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
import { useGameState } from './store/useGameState';
import { Tutorial, shouldShowTutorial } from './Tutorial';
import { Leaderboard, submitScore } from './Leaderboard';
import { soundEngine } from '../../utils/sound';
import { scorePopupEvents } from '../../utils/scorePopupEvents';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { GameHUD } from './ui/GameHUD';
import { GameMenu } from './ui/GameMenu';
import { GameOver } from './ui/GameOver';

const MILESTONE_LABELS: Record<number, string> = {
  100:  '🔥 GETTING HOT!',
  500:  '⚡ SPEED RUNNER!',
  1000: '🌟 UNSTOPPABLE!',
  2500: '🚀 COSMIC!',
  5000: '💎 LEGENDARY!',
};

// ── Camera controller ────────────────────────────────────────────────────────
const _camTarget = new THREE.Vector3();
const _lookAt    = new THREE.Vector3();

const CameraController: React.FC<{ playerPosRef: React.MutableRefObject<THREE.Vector3> }> = ({ playerPosRef }) => {
  const { camera } = useThree();
  useFrame(() => {
    _camTarget.set(playerPosRef.current.x * 0.3, 5.5, 11);
    camera.position.lerp(_camTarget, 0.08);
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

  const [showTutorial, setShowTutorial]       = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [muted, setMuted]                     = useState(false);
  const [playerName, setPlayerName]           = useState('');
  const [walletAddr, setWalletAddr]           = useState('');
  const [submitted, setSubmitted]             = useState(false);
  const [milestoneBanner, setMilestoneBanner] = useState<string | null>(null);

  const { open: openWallet }                          = useAppKit();
  const { address: connectedAddress, isConnected }    = useAppKitAccount();

  useEffect(() => { setWalletAddr(connectedAddress ?? ''); }, [connectedAddress]);

  const isNewHighScore = gameState === 'GAMEOVER' && Math.floor(score) > 0 && Math.floor(score) >= highScore;

  // Milestone banner
  useEffect(() => {
    if (!milestoneScore) return;
    const label = MILESTONE_LABELS[milestoneScore] ?? `🎯 ${milestoneScore}!`;
    setMilestoneBanner(label);
    scorePopupEvents.emit({ text: label, color: '#38bdf8', big: true });
    const t = setTimeout(() => { setMilestoneBanner(null); clearMilestone(); }, 2200);
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
        if (gameState === 'MENU' && shouldShowTutorial()) setShowTutorial(true);
        else startGame();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gameState, startGame]);

  useEffect(() => { if (gameState === 'PLAYING') setSubmitted(false); }, [gameState]);

  const handleStart = () => {
    if (gameState === 'MENU' && shouldShowTutorial()) { setShowTutorial(true); return; }
    startGame();
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setSubmitted(true);
    await submitScore({ name: playerName || 'Anonymous', score: Math.floor(score), coins, wallet: walletAddr });
    updateChallenge('score', Math.floor(score));
    updateChallenge('combo', useGameState.getState().maxCombo);
  };

  const toggleMute = () => setMuted(soundEngine.toggle());

  const prevRuns = gameState === 'GAMEOVER' ? runHistory.slice(1, 4) : runHistory.slice(0, 3);

  return (
    <div className="w-full h-screen bg-black relative touch-none select-none">
      <Canvas shadows>
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

      {/* ── UI Overlays ── */}
      <div className="absolute inset-0 flex flex-col pointer-events-none">

        {gameState === 'PLAYING' && (
          <GameHUD
            score={score} highScore={highScore} coins={coins}
            multiplier={multiplier} combo={combo}
            activePowerup={activePowerup} powerupTimeLeft={powerupTimeLeft}
            dailyChallenge={dailyChallenge} milestoneBanner={milestoneBanner}
            muted={muted} onToggleMute={toggleMute}
          />
        )}

        {gameState === 'MENU' && (
          <GameMenu
            highScore={highScore} character={character} setCharacter={setCharacter}
            dailyChallenge={dailyChallenge}
            muted={muted} onToggleMute={toggleMute}
            onStart={handleStart}
            onShowLeaderboard={() => setShowLeaderboard(true)}
          />
        )}

        {gameState === 'GAMEOVER' && (
          <GameOver
            score={score} coins={coins} highScore={highScore}
            prevRuns={prevRuns} isNewHighScore={isNewHighScore}
            playerName={playerName} setPlayerName={setPlayerName}
            submitted={submitted} onSubmit={handleSubmit}
            onPlayAgain={startGame}
            onShowLeaderboard={() => setShowLeaderboard(true)}
            isConnected={isConnected} connectedAddress={connectedAddress}
            onOpenWallet={openWallet}
          />
        )}
      </div>

      {showTutorial    && <Tutorial    onDismiss={() => { setShowTutorial(false); startGame(); }} />}
      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}
    </div>
  );
};

export default GameScene;
