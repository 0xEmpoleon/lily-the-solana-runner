import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import SpacePenguin3D from './entities/SpacePenguin3D';
import BearCharacter from './entities/BearCharacter';
import { useGameState } from './store/useGameState';
import { soundEngine } from '../../utils/sound';
import { haptics } from '../../utils/haptics';

interface PlayerProps {
  onHitObstacle: (type: 'HIGH' | 'LOW' | 'FULL') => void;
  onCoinCollect: (id: string) => void;
  positionRef: React.MutableRefObject<THREE.Vector3>;
  hitboxRef: React.MutableRefObject<{ y: number; height: number }>;
}

const LANE_WIDTH    = 2.5;
const GRAVITY       = -45;
const JUMP_FORCE    = 15;
const JUMP2_FORCE   = 11;   // double-jump is slightly weaker
const ROLL_DURATION = 0.8;

const Player: React.FC<PlayerProps> = ({ positionRef, hitboxRef }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { gameState, activePowerup, character } = useGameState();

  const [lane, setLane]               = useState(0);
  const [playerState, setPlayerState] = useState<'RUN' | 'JUMP' | 'ROLL' | 'STUMBLE'>('RUN');

  const velocityY   = useRef(0);
  const rollTimer   = useRef(0);
  const wasAirborne = useRef(false);
  const jumpsLeft   = useRef(2);   // 2 = can jump twice (ground jump + double jump)

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const handleJump = () => {
      if (jumpsLeft.current <= 0) return;
      const isDoubleJump = groupRef.current ? groupRef.current.position.y > 0.01 : false;
      velocityY.current = isDoubleJump ? JUMP2_FORCE : JUMP_FORCE;
      jumpsLeft.current--;
      setPlayerState('JUMP');
      if (isDoubleJump) {
        soundEngine.doubleJump();
        haptics.medium();
      } else {
        soundEngine.jump();
        haptics.jump();
      }
      wasAirborne.current = true;
    };

    const handleRoll = () => {
      if (playerState !== 'ROLL') {
        setPlayerState('ROLL');
        rollTimer.current = ROLL_DURATION;
        if (groupRef.current && groupRef.current.position.y > 0) {
          velocityY.current = -JUMP_FORCE;
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')                setLane(l => Math.max(-1, l - 1));
      if (e.key === 'ArrowRight')               setLane(l => Math.min(1,  l + 1));
      if (e.key === 'ArrowUp' || e.key === ' ') handleJump();
      if (e.key === 'ArrowDown')                handleRoll();
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > 30) dx > 0 ? setLane(l => Math.min(1, l + 1)) : setLane(l => Math.max(-1, l - 1));
      } else {
        if (Math.abs(dy) > 30) dy < 0 ? handleJump() : handleRoll();
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

    // Lateral movement
    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x, lane * LANE_WIDTH, delta * 12
    );

    // Vertical physics
    groupRef.current.position.y += velocityY.current * delta;
    velocityY.current += GRAVITY * delta;

    // Floor
    if (groupRef.current.position.y <= 0) {
      groupRef.current.position.y = 0;
      if (wasAirborne.current) {
        haptics.land();
        soundEngine.land();
        wasAirborne.current = false;
      }
      velocityY.current = 0;
      jumpsLeft.current = 2;  // reset double-jump on landing
      if (playerState === 'JUMP') setPlayerState('RUN');
    } else {
      wasAirborne.current = true;
    }

    // Roll timer
    if (playerState === 'ROLL') {
      rollTimer.current -= delta;
      if (rollTimer.current <= 0 && groupRef.current.position.y <= 0) setPlayerState('RUN');
    }

    // Export position/hitbox
    positionRef.current.copy(groupRef.current.position);
    hitboxRef.current = {
      y: groupRef.current.position.y,
      height: playerState === 'ROLL' ? 0.8 : 1.8,
    };
  });

  const isInvincible = activePowerup === 'invincible';
  const hasShield    = activePowerup === 'shield';
  const isSlowMo     = activePowerup === 'slowmo';

  return (
    <group ref={groupRef}>
      {/* Shield glow ring */}
      {hasShield && (
        <mesh>
          <torusGeometry args={[1.0, 0.08, 8, 32]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={3} transparent opacity={0.7} />
        </mesh>
      )}
      {/* Invincible aura */}
      {isInvincible && (
        <mesh>
          <sphereGeometry args={[1.2, 12, 12]} />
          <meshStandardMaterial color="#facc15" emissive="#f59e0b" emissiveIntensity={1.5} transparent opacity={0.15} />
        </mesh>
      )}
      {/* Slow-mo trail rings */}
      {isSlowMo && (
        <>
          <mesh rotation={[0, 0, 0]}>
            <torusGeometry args={[0.9, 0.04, 8, 32]} />
            <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={3} transparent opacity={0.6} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.9, 0.04, 8, 32]} />
            <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={2} transparent opacity={0.4} />
          </mesh>
        </>
      )}
      {character === 'bear' ? (
        <BearCharacter playerState={playerState} />
      ) : (
        <SpacePenguin3D playerState={playerState} />
      )}
    </group>
  );
};

export default Player;
