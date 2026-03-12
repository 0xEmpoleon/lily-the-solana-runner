import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import SpacePenguin3D from './entities/SpacePenguin3D';
import { useGameState } from './store/useGameState';

interface PlayerProps {
  onHitObstacle: (type: 'HIGH' | 'LOW' | 'FULL') => void;
  onCoinCollect: (id: string) => void;
  positionRef: React.MutableRefObject<THREE.Vector3>;
  hitboxRef: React.MutableRefObject<{ y: number, height: number }>;
}

const Player: React.FC<PlayerProps> = ({ positionRef, hitboxRef }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { gameState } = useGameState();

  // State
  const [lane, setLane] = useState(0); // -1: Left, 0: Center, 1: Right
  const [playerState, setPlayerState] = useState<'RUN' | 'JUMP' | 'ROLL' | 'STUMBLE'>('RUN');
  
  // Physics logic
  const velocityY = useRef(0);
  const LANE_WIDTH = 2.5;
  const GRAVITY = -45;
  const JUMP_FORCE = 15;
  const ROLL_DURATION = 0.8;
  const rollTimer = useRef(0);

  // Swipe detection limits
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const handleJump = () => {
      if (groupRef.current && groupRef.current.position.y <= 0.01) {
        velocityY.current = JUMP_FORCE;
        setPlayerState('JUMP');
      }
    };

    const handleRoll = () => {
       if (playerState !== 'ROLL') {
          setPlayerState('ROLL');
          rollTimer.current = ROLL_DURATION;
          // Fast fall if mid-air
          if (groupRef.current && groupRef.current.position.y > 0) {
             velocityY.current = -JUMP_FORCE; 
          }
       }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setLane(l => Math.max(-1, l - 1));
      if (e.key === 'ArrowRight') setLane(l => Math.min(1, l + 1));
      if (e.key === 'ArrowUp' || e.key === ' ') handleJump();
      if (e.key === 'ArrowDown') handleRoll();
    };

    // Swipe Listeners
    const handleTouchStart = (e: TouchEvent) => {
       touchStartX.current = e.touches[0].clientX;
       touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
       const endX = e.changedTouches[0].clientX;
       const endY = e.changedTouches[0].clientY;
       const diffX = endX - touchStartX.current;
       const diffY = endY - touchStartY.current;

       if (Math.abs(diffX) > Math.abs(diffY)) {
           // Horizontal Swipe
           if (Math.abs(diffX) > 30) {
               if (diffX > 0) setLane(l => Math.min(1, l + 1)); // Right
               else setLane(l => Math.max(-1, l - 1)); // Left
           }
       } else {
           // Vertical Swipe
           if (Math.abs(diffY) > 30) {
               if (diffY < 0) handleJump(); // Up
               else handleRoll(); // Down
           }
       }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameState, playerState]);

  useFrame((_state, delta) => {
    if (!groupRef.current || gameState !== 'PLAYING') return;

    // Lateral Movement (Lane switching Tweening)
    const targetX = lane * LANE_WIDTH;
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      targetX,
      delta * 12
    );

    // Vertical Movement (Gravity & Jumping)
    groupRef.current.position.y += velocityY.current * delta;
    velocityY.current += GRAVITY * delta;

    // Floor collision
    if (groupRef.current.position.y <= 0) {
       groupRef.current.position.y = 0;
       velocityY.current = 0;
       
       if (playerState === 'JUMP') {
          setPlayerState('RUN');
       }
    }

    // Roll Timer 
    if (playerState === 'ROLL') {
       rollTimer.current -= delta;
       if (rollTimer.current <= 0 && groupRef.current.position.y <= 0) {
           setPlayerState('RUN');
       }
    }

    // Export current tracking state for Collision Manager
    positionRef.current.copy(groupRef.current.position);
    hitboxRef.current = {
       y: groupRef.current.position.y,
       height: playerState === 'ROLL' ? 0.8 : 1.8 // Shrimp hitbox down significantly during roll
    };

  });

  return (
    <group ref={groupRef}>
      <SpacePenguin3D playerState={playerState} />
    </group>
  );
};

export default Player;
