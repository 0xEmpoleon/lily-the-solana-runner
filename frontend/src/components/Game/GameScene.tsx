import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';
import Player from './Player';
import { ObstacleManager } from './world/ObstacleManager';
import { TrackManager } from './world/TrackManager';
import { CollectibleManager } from './world/Collectibles';
import { useGameState } from './store/useGameState';

const GameScene: React.FC = () => {
  const { gameState, score, coins, startGame, endGame } = useGameState();
  
  // Refs for precise collision sharing between siblings
  const playerPosRef = useRef(new THREE.Vector3(0,0,0));
  const playerHitboxRef = useRef({ y: 0, height: 1.8 });

  const handleGameOver = () => {
    endGame();
  };

  const handleStumble = () => {
    // In a full clone, this summons the cop. For now, it might just slow speed briefly.
    console.log("Stumble!"); // Placeholder for stumble logic
  };

  // Keyboard support for menus
  useEffect(() => {
     const handleMenuKey = (e: KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
           if (gameState === 'MENU' || gameState === 'GAMEOVER') startGame();
        }
     };
     window.addEventListener('keydown', handleMenuKey);
     return () => window.removeEventListener('keydown', handleMenuKey);
  }, [gameState, startGame]);

  return (
    <div className="w-full h-screen bg-black relative touch-none select-none">
      <Canvas shadows>
        {/* Advanced Camera: slightly behind and above, looking down */}
        <PerspectiveCamera makeDefault position={[0, 4, 8]} fov={50} rotation={[-0.2, 0, 0]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} />
        
        {/* Environment */}
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        
        {gameState === 'PLAYING' && (
          <>
            <TrackManager />
            <Player positionRef={playerPosRef} hitboxRef={playerHitboxRef} onHitObstacle={() => {}} onCoinCollect={() => {}} />
            <ObstacleManager playerPosRef={playerPosRef} playerHitboxRef={playerHitboxRef} onCrash={handleGameOver} onStumble={handleStumble} />
            <CollectibleManager playerPosRef={playerPosRef} />
          </>
        )}

        <Suspense fallback={null}>
          <Environment preset="night" />
        </Suspense>
      </Canvas>

      {/* 1:1 UI Overlays */}
      <div className="absolute inset-0 flex flex-col pointer-events-none">
        
        {/* In-Game HUD */}
        {gameState === 'PLAYING' && (
           <div className="w-full h-20 p-4 px-8 flex justify-between items-start pointer-events-none">
              <div className="flex flex-col">
                 <span className="text-white font-black text-2xl drop-shadow-md">SCORE</span>
                 <span className="text-cyan-400 font-mono text-3xl font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                    {Math.floor(score)}
                 </span>
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-white font-black text-2xl drop-shadow-md">COINS</span>
                 <span className="text-yellow-400 font-mono text-3xl font-bold drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">
                    {coins}
                 </span>
              </div>
           </div>
        )}

        {/* Start Menu */}
        {gameState === 'MENU' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 pointer-events-auto backdrop-blur-sm">
            <h1 className="text-6xl font-black mb-2 text-white">MARS</h1>
            <h1 className="text-5xl font-black mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent italic">
              SURFERS
            </h1>
            <p className="text-slate-300 mb-8 animate-pulse text-lg">Tap or Swipe to Play</p>
            <button 
              onClick={startGame}
              className="px-12 py-4 bg-cyan-500 hover:bg-cyan-400 hover:scale-105 active:scale-95 text-white font-bold rounded-full transition-all text-2xl shadow-[0_0_20px_rgba(6,182,212,0.6)] border border-cyan-300"
            >
              RUN
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/90 pointer-events-auto backdrop-blur-md px-4">
            <h1 className="text-6xl font-black mb-6 text-white tracking-widest text-center">BUSTED</h1>
            
            <div className="bg-slate-800/80 p-6 rounded-2xl border border-red-500/50 mb-6 flex flex-col items-center w-full max-w-[320px]">
               <span className="text-slate-400 text-sm font-bold tracking-widest mb-1">FINAL SCORE</span>
               <span className="text-red-400 font-mono text-5xl font-black drop-shadow-[0_0_10px_rgba(248,113,113,0.5)] mb-4">
                  {Math.floor(score)}
               </span>
               <div className="w-full h-px bg-slate-700 mb-4" />
               <span className="text-yellow-400 font-mono text-2xl font-bold">💰 {coins} COINS</span>
            </div>

            <div className="w-full max-w-[320px] mb-8 bg-slate-800/80 p-4 rounded-xl border border-cyan-500/50 flex flex-col gap-2">
               <label className="text-cyan-400 text-xs font-bold tracking-wider">CLAIM REWARD (WALLET ADDRESS)</label>
               <div className="flex gap-2">
                 <input 
                   type="text" 
                   placeholder="0x..." 
                   className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-400"
                 />
                 <button 
                   className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                   onClick={(e) => {
                     e.currentTarget.innerText = "SAVED!";
                     e.currentTarget.classList.add('bg-green-500');
                   }}
                 >
                   SUBMIT
                 </button>
               </div>
            </div>

            <button 
              onClick={startGame}
              className="w-full max-w-[320px] py-4 bg-white hover:bg-slate-200 hover:scale-105 active:scale-95 text-red-900 font-black rounded-full transition-all text-xl shadow-[0_0_15px_rgba(255,255,255,0.4)] border-2 border-white"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameScene;
