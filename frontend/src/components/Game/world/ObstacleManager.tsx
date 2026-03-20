import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameState } from '../store/useGameState';
import {
  FireHydrant, BenchObstacle, DumpsterBarrier, BoxStack,
  ParkedCar, MovingCar, TrafficGate, WaterTowerBlock,
} from './Obstacles';
import { soundEngine } from '../../../utils/sound';
import { haptics } from '../../../utils/haptics';
import { particleEvents } from '../../../utils/particleEvents';
import { scorePopupEvents } from '../../../utils/scorePopupEvents';

type ObstacleType =
  | 'FIRE_HYDRANT' | 'BENCH'        | 'DUMPSTER'     | 'BOX_STACK'
  | 'PARKED_CAR'   | 'MOVING_CAR'   | 'TRAFFIC_GATE' | 'WATERTOWER';

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
  const { speed, speedScale, gameState, score, activePowerup, breakCombo, addScore, addNearMiss } = useGameState();
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const nextZ   = useRef(-100);
  const nextId  = useRef(0);

  // ── Phase-based gap — generous early, tight late ────────────────────────
  const getGap = (): number => {
    if (score < 2000) return 38 + Math.random() * 38 * 0.25;  // ~38–47  Mars
    if (score < 4000) return 27 + Math.random() * 27 * 0.30;  // ~27–35  City
    if (score < 6000) return 18 + Math.random() * 18 * 0.30;  // ~18–23  Desert
    if (score < 8000) return 12 + Math.random() * 12 * 0.25;  // ~12–15  Forest
    return              8  + Math.random() *  8 * 0.20;        //  ~8–10  Space
  };

  // ── Phase-based obstacle type — harder types unlock per zone ────────────
  const getObstacleType = (): { type: ObstacleType; width: number; height: number; depth: number } => {
    const r = Math.random();

    // Phase 1 — Mars (0–1999): only easy jumpable obstacles
    if (score < 2000) {
      if (r < 0.50) return { type: 'FIRE_HYDRANT', width: 1.4, height: 0.8, depth: 0.8 };
      if (r < 0.85) return { type: 'BENCH',        width: 1.8, height: 0.9, depth: 1.2 };
                    return { type: 'DUMPSTER',      width: 2.0, height: 1.2, depth: 1.5 };
    }

    // Phase 2 — City (2000–3999): all types introduced at low probability
    if (score < 4000) {
      if (r < 0.10) return { type: 'FIRE_HYDRANT', width: 1.4, height: 0.8, depth: 0.8 };
      if (r < 0.25) return { type: 'BENCH',        width: 1.8, height: 0.9, depth: 1.2 };
      if (r < 0.50) return { type: 'DUMPSTER',     width: 2.0, height: 1.2, depth: 1.5 };
      if (r < 0.70) return { type: 'PARKED_CAR',   width: 2.2, height: 1.4, depth: 3.0 };
      if (r < 0.85) return { type: 'MOVING_CAR',   width: 2.2, height: 1.4, depth: 3.0 };
      if (r < 0.93) return { type: 'TRAFFIC_GATE', width: 2.2, height: 2.5, depth: 0.5 };
                    return { type: 'WATERTOWER',    width: 2.0, height: 3.0, depth: 2.0 };
    }

    // Phase 3 — Desert (4000–5999): no easy types, hard types prominent
    if (score < 6000) {
      if (r < 0.20) return { type: 'DUMPSTER',     width: 2.0, height: 1.2, depth: 1.5 };
      if (r < 0.40) return { type: 'PARKED_CAR',   width: 2.2, height: 1.4, depth: 3.0 };
      if (r < 0.65) return { type: 'MOVING_CAR',   width: 2.2, height: 1.4, depth: 3.0 };
      if (r < 0.85) return { type: 'TRAFFIC_GATE', width: 2.2, height: 2.5, depth: 0.5 };
                    return { type: 'WATERTOWER',    width: 2.0, height: 3.0, depth: 2.0 };
    }

    // Phase 4 — Forest (6000–7999): heavy on lane-switch obstacles
    if (score < 8000) {
      if (r < 0.15) return { type: 'DUMPSTER',     width: 2.0, height: 1.2, depth: 1.5 };
      if (r < 0.30) return { type: 'PARKED_CAR',   width: 2.2, height: 1.4, depth: 3.0 };
      if (r < 0.55) return { type: 'MOVING_CAR',   width: 2.2, height: 1.4, depth: 3.0 };
      if (r < 0.80) return { type: 'TRAFFIC_GATE', width: 2.2, height: 2.5, depth: 0.5 };
                    return { type: 'WATERTOWER',    width: 2.0, height: 3.0, depth: 2.0 };
    }

    // Phase 5 — Space (8000+): relentless, no easy types
    if (r < 0.15) return { type: 'DUMPSTER',     width: 2.0, height: 1.2, depth: 1.5 };
    if (r < 0.40) return { type: 'MOVING_CAR',   width: 2.2, height: 1.4, depth: 3.0 };
    if (r < 0.70) return { type: 'TRAFFIC_GATE', width: 2.2, height: 2.5, depth: 0.5 };
                  return { type: 'WATERTOWER',    width: 2.0, height: 3.0, depth: 2.0 };
  };

  useFrame((_s, delta) => {
    if (gameState !== 'PLAYING') return;
    const effectiveSpeed = speed * speedScale;

    // ── Advance spawn cursor with world movement ────────────────────────
    nextZ.current += effectiveSpeed * delta;

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
        const moveSpeed = obs.type === 'MOVING_CAR' ? effectiveSpeed * 1.5 : effectiveSpeed;
        const newZ = obs.z + moveSpeed * delta;

        // Near-miss detection: obstacle just passed player (crosses z=0 from behind)
        if (!obs.isHit && !obs.nearMissChecked && obs.z < 0 && newZ >= 0.5) {
          const obsX = obs.lane * 2.5;
          const dist = Math.abs(obsX - pPos.x);
          if (dist >= 1.1 && dist < 2.4) {
            addScore(5);
            addNearMiss();
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
            if (obs.type === 'FIRE_HYDRANT' && pPos.y > 1.8)       cleared = true;
            if (obs.type === 'BENCH'        && pPos.y > 1.8)        cleared = true;
            if (obs.type === 'DUMPSTER'     && pPos.y > 2.2)        cleared = true;
            if (obs.type === 'BOX_STACK'    && pPos.y > 3.2)        cleared = true;
            if (obs.type === 'PARKED_CAR'   && pPos.y > 1.8)        cleared = true;
            if (obs.type === 'MOVING_CAR'   && pPos.y > 2.0)        cleared = true;
            if (obs.type === 'TRAFFIC_GATE' && pHit.height < 1.5)   cleared = true;
            // WATERTOWER: no clearance — must be in a different lane

            if (!cleared) {
              if (isInvincible) {
                // phase through
              } else if (obs.type === 'TRAFFIC_GATE' && pPos.y > 0 && pHit.height > 1.5) {
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
        if (obs.type === 'FIRE_HYDRANT')  return <FireHydrant     key={obs.id} lane={obs.lane} z={obs.z} />;
        if (obs.type === 'BENCH')         return <BenchObstacle   key={obs.id} lane={obs.lane} z={obs.z} />;
        if (obs.type === 'DUMPSTER')      return <DumpsterBarrier key={obs.id} lane={obs.lane} z={obs.z} />;
        if (obs.type === 'BOX_STACK')     return <BoxStack        key={obs.id} lane={obs.lane} z={obs.z} />;
        if (obs.type === 'PARKED_CAR')    return <ParkedCar       key={obs.id} lane={obs.lane} z={obs.z} variant={obs.id % 2 === 0 ? 'taxi' : 'sedan'} />;
        if (obs.type === 'MOVING_CAR')    return <MovingCar       key={obs.id} lane={obs.lane} z={obs.z} />;
        if (obs.type === 'TRAFFIC_GATE')  return <TrafficGate     key={obs.id} lane={obs.lane} z={obs.z} />;
        if (obs.type === 'WATERTOWER')    return <WaterTowerBlock key={obs.id} lane={obs.lane} z={obs.z} />;
        return null;
      })}
    </group>
  );
};
