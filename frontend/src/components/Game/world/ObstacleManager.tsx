import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameState } from '../store/useGameState';
import { Train, LowBarrier, HighBarrier, SpikeRoller } from './Obstacles';
import { soundEngine } from '../../../utils/sound';
import { haptics } from '../../../utils/haptics';
import { particleEvents } from '../../../utils/particleEvents';
import { scorePopupEvents } from '../../../utils/scorePopupEvents';

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
  nearMissChecked: boolean;
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
  const { speed, speedScale, gameState, score, activePowerup, breakCombo, addScore } = useGameState();
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const nextZ   = useRef(-100);
  const nextId  = useRef(0);

  // Gap shrinks continuously with score — no hard floor until very high scores
  const getGap = () => {
    const t = Math.min(score / 3000, 1);
    const base = Math.max(10, 40 - t * 30);           // 40 → 10 over 3000 score
    return base + Math.random() * base * 0.35;
  };

  // Obstacle type probabilities shift toward harder types as score increases
  const getObstacleType = (): { type: ObstacleType; width: number; height: number; depth: number } => {
    const h = Math.min(score / 2000, 1); // 0 → 1 over 2000 score
    const r = Math.random();
    const p1 = 0.35 - h * 0.13;               // LOW_BARRIER:   35% → 22%
    const p2 = p1 + 0.18;                      // HIGH_BARRIER:  18% constant
    const p3 = p2 + 0.12 + h * 0.06;          // SPIKE_ROLLER:  12% → 18%
    const p4 = p3 + 0.15 + h * 0.12;          // TRAIN_MOVING:  15% → 27%
    if (r < p1)  return { type: 'LOW_BARRIER',  width: 2.2, height: 1,   depth: 0.5  };
    if (r < p2)  return { type: 'HIGH_BARRIER', width: 2.2, height: 3,   depth: 0.2  };
    if (r < p3)  return { type: 'SPIKE_ROLLER', width: 2.2, height: 1.2, depth: 2.2  };
    if (r < p4)  return { type: 'TRAIN_MOVING', width: 2.2, height: 4,   depth: 15   };
                 return { type: 'TRAIN_STATIC', width: 2.2, height: 4,   depth: 15   };
  };

  useFrame((_s, delta) => {
    if (gameState !== 'PLAYING') return;
    const effectiveSpeed = speed * speedScale;

    // ── Spawn ──────────────────────────────────────────────────────────
    if (nextZ.current > -300) {
      const lane = Math.floor(Math.random() * 3) - 1;
      const { type, width, height, depth } = getObstacleType();
      setObstacles(p => [...p, {
        id: nextId.current++, type, lane, z: nextZ.current,
        width, height, depth, isHit: false, nearMissChecked: false,
      }]);
      nextZ.current -= getGap();
    }

    // ── Move + collision ───────────────────────────────────────────────
    setObstacles(prev => {
      const pPos   = playerPosRef.current;
      const pHit   = playerHitboxRef.current;
      let hasCrashed = false;

      const nextList = prev.map(obs => {
        const moveSpeed = obs.type === 'TRAIN_MOVING' ? effectiveSpeed * 1.5 : effectiveSpeed;
        const newZ = obs.z + moveSpeed * delta;

        // Near-miss detection: obstacle just passed player (crosses z=0 from behind)
        if (!obs.isHit && !obs.nearMissChecked && obs.z < 0 && newZ >= 0.5) {
          const obsX = obs.lane * 2.5;
          const dist = Math.abs(obsX - pPos.x);
          if (dist >= 1.1 && dist < 2.4) {
            addScore(5);
            scorePopupEvents.emit({ text: 'NEAR MISS! +5', color: '#e2e8f0' });
            return { ...obs, z: newZ, nearMissChecked: true };
          }
          return { ...obs, z: newZ, nearMissChecked: true };
        }

        // Collision zone
        if (!obs.isHit && newZ > -obs.depth / 2 && newZ < obs.depth / 2 + 1) {
          const obsX = obs.lane * 2.5;
          const pX   = pPos.x;

          if (Math.abs(obsX - pX) < 1.0) {
            const isInvincible = activePowerup === 'invincible';
            const hasShield    = activePowerup === 'shield';

            let cleared = false;
            if (obs.type === 'LOW_BARRIER' && pPos.y > 1.2)         cleared = true;
            if (obs.type === 'SPIKE_ROLLER' && pPos.y > 1.0)        cleared = true;
            if (obs.type === 'HIGH_BARRIER' && pHit.height < 1.0)   cleared = true;

            if (!cleared) {
              if (isInvincible) {
                // phase through
              } else if (obs.type === 'HIGH_BARRIER' && pPos.y > 0 && pHit.height > 1.0) {
                if (hasShield) {
                  soundEngine.shieldBlock();
                  haptics.shield();
                  particleEvents.emit({ x: pX, y: pPos.y, z: 0, color: '#38bdf8', count: 14 });
                  scorePopupEvents.emit({ text: '🛡 BLOCKED!', color: '#38bdf8' });
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
                  scorePopupEvents.emit({ text: '🛡 BLOCKED!', color: '#38bdf8' });
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
        if (obs.type === 'TRAIN_STATIC') return <Train       key={obs.id} lane={obs.lane} z={obs.z} isMoving={false} speedMultiplier={1}   />;
        if (obs.type === 'TRAIN_MOVING') return <Train       key={obs.id} lane={obs.lane} z={obs.z} isMoving={true}  speedMultiplier={1.5} />;
        if (obs.type === 'LOW_BARRIER')  return <LowBarrier  key={obs.id} lane={obs.lane} z={obs.z} />;
        if (obs.type === 'HIGH_BARRIER') return <HighBarrier key={obs.id} lane={obs.lane} z={obs.z} />;
        if (obs.type === 'SPIKE_ROLLER') return <SpikeRoller key={obs.id} lane={obs.lane} z={obs.z} />;
        return null;
      })}
    </group>
  );
};
