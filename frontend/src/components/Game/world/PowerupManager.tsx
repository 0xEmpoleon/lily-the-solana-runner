import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameState } from '../store/useGameState';
import type { PowerupType } from '../store/useGameState';
import { soundEngine } from '../../../utils/sound';
import { scorePopupEvents } from '../../../utils/scorePopupEvents';
import { POWERUP_PALETTE } from '../../../assets';

interface PowerupItem {
  id: number;
  type: NonNullable<PowerupType>;
  lane: number;
  z: number;   // spawn z — actual live position is in powerupZsRef
}

interface PowerupManagerProps {
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
}

const POWERUP_CONFIG: Record<NonNullable<PowerupType>, { color: string; emissive: string; duration: number; label: string }> = {
  shield:     { ...POWERUP_PALETTE.shield,     label: '🛡 SHIELD' },
  magnet:     { ...POWERUP_PALETTE.magnet,     label: '🧲 MAGNET' },
  invincible: { ...POWERUP_PALETTE.invincible, label: '⚡ INVINCIBLE' },
  slowmo:     { ...POWERUP_PALETTE.slowmo,     label: '⏱ SLOW-MO' },
};

const POWERUP_TYPES: NonNullable<PowerupType>[] = ['shield', 'magnet', 'invincible', 'slowmo'];

// ── PowerupOrb ─────────────────────────────────────────────────────────────
const PowerupOrb = ({ item, zRef }: { item: PowerupItem; zRef: React.MutableRefObject<number> }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef  = useRef<THREE.Mesh>(null);
  const cfg      = POWERUP_CONFIG[item.type];

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // Update z position directly from shared ref (no React state)
    groupRef.current.position.z = zRef.current;
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

// ── Manager ────────────────────────────────────────────────────────────────
export const PowerupManager: React.FC<PowerupManagerProps> = ({ playerPosRef }) => {
  const { speed, speedScale, gameState, activatePowerup, tickPowerup } = useGameState();
  const [powerups, setPowerups] = useState<PowerupItem[]>([]);

  // Live z-positions stored in a Map — updated every frame via direct mutations,
  // never via React setState.
  const powerupZsRef = useRef<Map<number, number>>(new Map());

  const spawnCursorRef = useRef(-200);
  const nextId         = useRef(0);

  // Sync zRef map when powerup list changes (add initial entries / remove stale ones)
  useEffect(() => {
    // Remove entries for powerups no longer in the list
    for (const id of powerupZsRef.current.keys()) {
      if (!powerups.find(p => p.id === id)) powerupZsRef.current.delete(id);
    }
    // Add entries for newly spawned powerups
    for (const p of powerups) {
      if (!powerupZsRef.current.has(p.id)) powerupZsRef.current.set(p.id, p.z);
    }
  }, [powerups]);

  useFrame((_state, delta) => {
    if (gameState !== 'PLAYING') return;
    const effectiveSpeed = speed * speedScale;

    tickPowerup(delta);

    // Advance spawn cursor
    spawnCursorRef.current += effectiveSpeed * delta;
    if (spawnCursorRef.current > -400) {
      const lane = Math.floor(Math.random() * 3) - 1;
      const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
      const id   = nextId.current++;
      const z    = spawnCursorRef.current;
      powerupZsRef.current.set(id, z);
      setPowerups(prev => [...prev, { id, type, lane, z }]);
      spawnCursorRef.current -= 300 + Math.random() * 200;
    }

    // Move all powerups and detect collections — no setState for position
    const pPos      = playerPosRef.current;
    const toRemove: number[] = [];
    let   pickedType: NonNullable<PowerupType> | null = null;

    for (const [id, z] of powerupZsRef.current) {
      const newZ = z + effectiveSpeed * delta;
      powerupZsRef.current.set(id, newZ);

      const p = powerups.find(pw => pw.id === id);
      if (!p) continue;

      // Collection check
      if (newZ > -1.0 && newZ < 1.0) {
        if (Math.abs(p.lane * 2.5 - pPos.x) < 1.2 && Math.abs(pPos.y - 1.8) < 1.5) {
          pickedType = p.type;
          toRemove.push(id);
          continue;
        }
      }
      // Cull behind player
      if (newZ > 20) toRemove.push(id);
    }

    if (pickedType) {
      const cfg = POWERUP_CONFIG[pickedType];
      activatePowerup(pickedType, cfg.duration);
      soundEngine.powerup();
      scorePopupEvents.emit({ text: cfg.label, color: cfg.color, big: true });
    }

    if (toRemove.length > 0) {
      toRemove.forEach(id => powerupZsRef.current.delete(id));
      setPowerups(prev => prev.filter(p => !toRemove.includes(p.id)));
    }
  });

  return (
    <group>
      {powerups.map(p => {
        const zRef = { current: powerupZsRef.current.get(p.id) ?? p.z };
        return <PowerupOrb key={p.id} item={p} zRef={zRef} />;
      })}
    </group>
  );
};
