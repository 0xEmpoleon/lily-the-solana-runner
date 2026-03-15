import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameState } from '../store/useGameState';
import type { PowerupType } from '../store/useGameState';
import { soundEngine } from '../../../utils/sound';
import { scorePopupEvents } from '../../../utils/scorePopupEvents';

interface PowerupItem {
  id: number;
  type: NonNullable<PowerupType>;
  lane: number;
  z: number;
  collected: boolean;
}

interface PowerupManagerProps {
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
}

const POWERUP_CONFIG: Record<NonNullable<PowerupType>, { color: string; emissive: string; duration: number; label: string }> = {
  shield:    { color: '#38bdf8', emissive: '#0ea5e9', duration: 8,  label: '🛡 SHIELD' },
  magnet:    { color: '#c084fc', emissive: '#a855f7', duration: 10, label: '🧲 MAGNET' },
  invincible: { color: '#facc15', emissive: '#f59e0b', duration: 6, label: '⚡ INVINCIBLE' },
  slowmo:    { color: '#4ade80', emissive: '#22c55e', duration: 5,  label: '⏱ SLOW-MO' },
};

const POWERUP_TYPES: NonNullable<PowerupType>[] = ['shield', 'magnet', 'invincible', 'slowmo'];

const PowerupOrb = ({ item }: { item: PowerupItem; onCollect: () => void }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef  = useRef<THREE.Mesh>(null);
  const cfg = POWERUP_CONFIG[item.type];

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.y = 1.8 + Math.sin(t * 2) * 0.2;
    groupRef.current.rotation.y = t * 1.5;
    if (ringRef.current) ringRef.current.rotation.x = t * 2;
  });

  return (
    <group ref={groupRef} position={[item.lane * 2.5, 1.8, item.z]}>
      <mesh castShadow>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial
          color={cfg.color} emissive={cfg.emissive} emissiveIntensity={1.2}
          metalness={0.3} roughness={0.2} transparent opacity={0.9}
        />
      </mesh>
      <mesh ref={ringRef}>
        <torusGeometry args={[0.6, 0.05, 8, 32]} />
        <meshStandardMaterial color={cfg.color} emissive={cfg.emissive} emissiveIntensity={2} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.03, 8, 32]} />
        <meshStandardMaterial color={cfg.color} emissive={cfg.emissive} emissiveIntensity={1.5} transparent opacity={0.6} />
      </mesh>
      <pointLight color={cfg.color} intensity={3} distance={4} decay={2} />
    </group>
  );
};

export const PowerupManager: React.FC<PowerupManagerProps> = ({ playerPosRef }) => {
  const { speed, speedScale, gameState, activatePowerup, tickPowerup } = useGameState();
  const [powerups, setPowerups] = useState<PowerupItem[]>([]);
  const nextZ  = useRef(-200);
  const nextId = useRef(0);

  useFrame((_state, delta) => {
    if (gameState !== 'PLAYING') return;
    const effectiveSpeed = speed * speedScale;

    tickPowerup(delta);

    // ── Advance spawn cursor with world movement ────────────────────────
    nextZ.current += effectiveSpeed * delta;

    if (nextZ.current > -400) {
      const lane = Math.floor(Math.random() * 3) - 1;
      const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
      setPowerups(prev => [...prev, { id: nextId.current++, type, lane, z: nextZ.current, collected: false }]);
      nextZ.current -= 300 + Math.random() * 200;
    }

    setPowerups(prev => {
      const pPos = playerPosRef.current;
      let pickedType: NonNullable<PowerupType> | null = null;

      const next = prev.map(p => {
        if (p.collected) return { ...p, z: p.z + effectiveSpeed * delta };
        const newZ = p.z + effectiveSpeed * delta;

        if (newZ > -1.0 && newZ < 1.0) {
          const pX   = pPos.x;
          const obsX = p.lane * 2.5;
          if (Math.abs(obsX - pX) < 1.2 && Math.abs(pPos.y - 1.8) < 1.5) {
            pickedType = p.type;
            return { ...p, z: newZ, collected: true };
          }
        }
        return { ...p, z: newZ };
      });

      if (pickedType) {
        const cfg = POWERUP_CONFIG[pickedType as NonNullable<PowerupType>];
        activatePowerup(pickedType, cfg.duration);
        soundEngine.powerup();
        scorePopupEvents.emit({ text: cfg.label, color: cfg.color, big: true });
      }

      return next.filter(p => p.z < 20 && !p.collected);
    });
  });

  return (
    <group>
      {powerups.filter(p => !p.collected).map(p => (
        <PowerupOrb key={p.id} item={p} onCollect={() => {}} />
      ))}
    </group>
  );
};
