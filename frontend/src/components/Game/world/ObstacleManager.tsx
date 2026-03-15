import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameState } from '../store/useGameState';
import { Train, LowBarrier, HighBarrier, SpikeRoller } from './Obstacles';
import { soundEngine } from '../../../utils/sound';
import { haptics } from '../../../utils/haptics';
import { particleEvents } from '../../../utils/particleEvents';

type ObstacleType = 'TRAIN_STATIC' | 'TRAIN_MOVING' | 'LOW_BARRIER' | 'HIGH_BARRIER' | 'SPIKE_ROLLER';

type ObstacleData = {
  id: number;
  type: ObstacleType;
  lane: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  isHit: boolean;
};

interface ObstacleManagerProps {
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  playerHitboxRef: React.MutableRefObject<{ y: number; height: number }>;
  onStumble: () => void;
  onCrash: () => void;
}

export const ObstacleManager: React.FC<ObstacleManagerProps> = ({
  playerPosRef, playerHitboxRef, onStumble, onCrash,
}) => {
  const { speed, gameState, score, activePowerup, breakCombo } = useGameState();
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const nextZ   = useRef(-100);
  const nextId  = useRef(0);

  // Gap shrinks as score grows
  const getGap = () => {
    const base = Math.max(14, 40 - Math.floor(score / 200));
    return base + Math.random() * base * 0.5;
  };

  useFrame((_s, delta) => {
    if (gameState !== 'PLAYING') return;

    if (nextZ.current > -300) {
      const lane = Math.floor(Math.random() * 3) - 1;
      const r    = Math.random();
      let type: ObstacleType;
      let width = 2.2, height = 4, depth = 15;

      if      (r < 0.35) { type = 'LOW_BARRIER';   height = 1;   depth = 0.5; }
      else if (r < 0.55) { type = 'HIGH_BARRIER';  height = 3;   depth = 0.2; }
      else if (r < 0.68) { type = 'SPIKE_ROLLER';  height = 1.2; depth = 2.2; }
      else if (r < 0.82) { type = 'TRAIN_MOVING'; }
      else                { type = 'TRAIN_STATIC'; }

      setObstacles(p => [...p, { id: nextId.current++, type, lane, z: nextZ.current, width, height, depth, isHit: false }]);
      nextZ.current -= getGap();
    }

    setObstacles(prev => {
      const pPos   = playerPosRef.current;
      const pHit   = playerHitboxRef.current;
      let hasCrashed = false;

      const nextList = prev.map(obs => {
        const moveSpeed = obs.type === 'TRAIN_MOVING' ? speed * 1.5 : speed;
        const newZ = obs.z + moveSpeed * delta;

        if (!obs.isHit && newZ > -obs.depth / 2 && newZ < obs.depth / 2 + 1) {
          const obsX = obs.lane * 2.5;
          const pX   = pPos.x;

          if (Math.abs(obsX - pX) < 1.0) {
            const isInvincible = activePowerup === 'invincible';
            const hasShield    = activePowerup === 'shield';

            let cleared = false;
            if (obs.type === 'LOW_BARRIER' && pPos.y > 1.2)   cleared = true;
            if (obs.type === 'SPIKE_ROLLER' && pPos.y > 1.0)  cleared = true;
            if (obs.type === 'HIGH_BARRIER' && pHit.height < 1.0) cleared = true;

            if (!cleared) {
              if (isInvincible) {
                // pass through
              } else if (obs.type === 'HIGH_BARRIER' && pPos.y > 0 && pHit.height > 1.0) {
                // Jumping into high bar
                if (hasShield) {
                  soundEngine.shieldBlock();
                  haptics.shield();
                  particleEvents.emit({ x: pX, y: pPos.y, z: 0, color: '#38bdf8', count: 14 });
                  useGameState.getState().activatePowerup(null, 0);
                  breakCombo();
                } else {
                  soundEngine.crash();
                  haptics.crash();
                  hasCrashed = true;
                }
              } else {
                if (hasShield) {
                  soundEngine.shieldBlock();
                  haptics.shield();
                  particleEvents.emit({ x: pX, y: pPos.y, z: 0, color: '#38bdf8', count: 14 });
                  useGameState.getState().activatePowerup(null, 0);
                  breakCombo();
                } else if (Math.abs(obsX - pX) > 0.6) {
                  onStumble();
                  breakCombo();
                } else {
                  soundEngine.crash();
                  haptics.crash();
                  particleEvents.emit({ x: pX, y: 1, z: 0, color: '#ff4444', count: 20 });
                  hasCrashed = true;
                }
              }
            }
          }
        }
        return { ...obs, z: newZ };
      });

      if (hasCrashed) onCrash();
      return nextList.filter(o => o.z < 20);
    });
  });

  return (
    <group>
      {obstacles.map(obs => {
        if (obs.type === 'TRAIN_STATIC')  return <Train        key={obs.id} lane={obs.lane} z={obs.z} isMoving={false} speedMultiplier={1}   />;
        if (obs.type === 'TRAIN_MOVING')  return <Train        key={obs.id} lane={obs.lane} z={obs.z} isMoving={true}  speedMultiplier={1.5} />;
        if (obs.type === 'LOW_BARRIER')   return <LowBarrier   key={obs.id} lane={obs.lane} z={obs.z} />;
        if (obs.type === 'HIGH_BARRIER')  return <HighBarrier  key={obs.id} lane={obs.lane} z={obs.z} />;
        if (obs.type === 'SPIKE_ROLLER')  return <SpikeRoller  key={obs.id} lane={obs.lane} z={obs.z} />;
        return null;
      })}
    </group>
  );
};
