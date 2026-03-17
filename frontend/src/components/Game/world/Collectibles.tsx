import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameState } from '../store/useGameState';
import { soundEngine } from '../../../utils/sound';
import { haptics } from '../../../utils/haptics';
import { particleEvents } from '../../../utils/particleEvents';
import { scorePopupEvents } from '../../../utils/scorePopupEvents';
import { COLLECTIBLE_COLORS } from '../../../assets';

interface CoinItem {
  id: number;
  lane: number;
  y: number;
  z: number;    // spawn z — live position is in coinZsRef
  isStar: boolean;
}

interface CollectibleManagerProps {
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
}

// Shared geometries + materials — created once at module scope (one allocation)
const coinGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
const coinMat = new THREE.MeshStandardMaterial({ color: COLLECTIBLE_COLORS.coin, metalness: 0.8, roughness: 0.2 });
const starMat = new THREE.MeshStandardMaterial({
  color: COLLECTIBLE_COLORS.star, emissive: COLLECTIBLE_COLORS.starEmissive, emissiveIntensity: 0.8,
  metalness: 0.5, roughness: 0.2,
});

function makeStarGeo(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const outerR = 0.5, innerR = 0.22, pts = 5;
  for (let i = 0; i < pts * 2; i++) {
    const angle = (i * Math.PI) / pts - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    if (i === 0) shape.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
    else shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false });
}
const starGeo = makeStarGeo();

// ── Individual mesh components — positions driven by a shared Map ref ──────
const CoinMesh = ({ c, coinZsRef }: { c: CoinItem; coinZsRef: React.MutableRefObject<Map<number, number>> }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_s, delta) => {
    if (!meshRef.current) return;
    const z = coinZsRef.current.get(c.id);
    if (z !== undefined) meshRef.current.position.z = z;
    meshRef.current.rotation.z += delta * 3;
  });
  return (
    <mesh ref={meshRef} position={[c.lane * 2.5, c.y, c.z]}
      rotation={[Math.PI / 2, 0, 0]} geometry={coinGeo} material={coinMat} castShadow />
  );
};

const StarMesh = ({ c, coinZsRef }: { c: CoinItem; coinZsRef: React.MutableRefObject<Map<number, number>> }) => {
  const groupRef = useRef<THREE.Group>(null);
  const baseY    = useRef(c.y);
  useFrame((s) => {
    if (!groupRef.current) return;
    const z = coinZsRef.current.get(c.id);
    if (z !== undefined) groupRef.current.position.z = z;
    groupRef.current.rotation.y = s.clock.elapsedTime * 2;
    groupRef.current.position.y = baseY.current + Math.sin(s.clock.elapsedTime * 3) * 0.15;
  });
  return (
    <group ref={groupRef} position={[c.lane * 2.5, c.y, c.z]}>
      <mesh geometry={starGeo} material={starMat} castShadow position={[-0.5, -0.5, 0]} />
      <pointLight color={COLLECTIBLE_COLORS.star} intensity={5} distance={3} decay={2} />
    </group>
  );
};

// ── Manager ────────────────────────────────────────────────────────────────
export const CollectibleManager: React.FC<CollectibleManagerProps> = ({ playerPosRef }) => {
  const { speed, speedScale, gameState, addCoin, activePowerup, incrementCombo, updateChallenge } = useGameState();
  const [coins, setCoins] = useState<CoinItem[]>([]);

  // Live z-positions — mutated every frame, never trigger React re-renders
  const coinZsRef = useRef<Map<number, number>>(new Map());

  const spawnCursorRef = useRef(-50);
  const nextId         = useRef(0);
  const lastComboSound = useRef(0);

  // Keep coinZsRef in sync with the coin list (add new / remove stale entries)
  useEffect(() => {
    for (const id of coinZsRef.current.keys()) {
      if (!coins.find(c => c.id === id)) coinZsRef.current.delete(id);
    }
    for (const c of coins) {
      if (!coinZsRef.current.has(c.id)) coinZsRef.current.set(c.id, c.z);
    }
  }, [coins]);

  useFrame((_s, delta) => {
    if (gameState !== 'PLAYING') return;

    const effectiveSpeed = speed * speedScale;

    // Advance spawn cursor
    spawnCursorRef.current += effectiveSpeed * delta;

    if (spawnCursorRef.current > -200) {
      const lane = Math.floor(Math.random() * 3) - 1;
      const r    = Math.random();
      const newItems: CoinItem[] = [];
      const spawn = (item: Omit<CoinItem, 'id'>) => {
        const id = nextId.current++;
        coinZsRef.current.set(id, item.z);
        newItems.push({ id, ...item });
      };

      if (r < 0.06) {
        spawn({ lane, y: 1.0, z: spawnCursorRef.current, isStar: true });
        spawnCursorRef.current -= 20;
      } else if (r < 0.28) {
        for (let i = 0; i < 7; i++)
          spawn({ lane, y: 1 + Math.sin((i / 6) * Math.PI) * 2, z: spawnCursorRef.current - i * 2.2, isStar: false });
        spawnCursorRef.current -= 25;
      } else if (r < 0.44) {
        for (let i = 0; i < 7; i++)
          spawn({ lane, y: 1 + Math.sin((i / 6) * Math.PI) * 3.5, z: spawnCursorRef.current - i * 3, isStar: false });
        spawnCursorRef.current -= 28;
      } else if (r < 0.63) {
        for (let i = 0; i < 10; i++)
          spawn({ lane, y: 0.5, z: spawnCursorRef.current - i * 2, isStar: false });
        spawnCursorRef.current -= 35;
      } else if (r < 0.78) {
        const zigzag = [-1, 0, 1, 0, -1, 0, 1, 0] as const;
        for (let i = 0; i < 8; i++)
          spawn({ lane: zigzag[i], y: 0.5, z: spawnCursorRef.current - i * 3, isStar: false });
        spawnCursorRef.current -= 32;
      } else if (r < 0.90) {
        for (let row = 0; row < 3; row++)
          for (const l of [-1, 0, 1] as const)
            spawn({ lane: l, y: 0.5, z: spawnCursorRef.current - row * 6, isStar: false });
        spawnCursorRef.current -= 28;
      } else {
        spawnCursorRef.current -= 15;
      }

      if (newItems.length > 0) setCoins(prev => [...prev, ...newItems]);
    }

    // Move all coins and detect collections — no setState for position
    const pPos       = playerPosRef.current;
    const hasMagnet  = activePowerup === 'magnet';
    const zRange     = hasMagnet ? 4.0 : 0.5;
    const xRange     = hasMagnet ? 2.8 : 1.0;
    const yRange     = hasMagnet ? 3.0 : 1.5;
    const toRemove: number[] = [];
    let pickedCoins = 0, pickedStars = 0;
    const positions: Array<{ x: number; y: number; z: number; star: boolean }> = [];

    for (const [id, z] of coinZsRef.current) {
      const newZ = z + effectiveSpeed * delta;
      coinZsRef.current.set(id, newZ);

      const c = coins.find(ci => ci.id === id);
      if (!c) continue;

      // Collection check
      if (newZ > -zRange && newZ < zRange) {
        const cX = c.lane * 2.5;
        if (Math.abs(cX - pPos.x) < xRange && Math.abs(c.y - pPos.y) < yRange) {
          positions.push({ x: cX, y: c.y, z: newZ, star: c.isStar });
          if (c.isStar) pickedStars++; else pickedCoins++;
          toRemove.push(id);
          continue;
        }
      }
      // Cull behind player
      if (newZ > 20) toRemove.push(id);
    }

    // Award + effects
    const pickedMultiplier = useGameState.getState().multiplier;
    for (let i = 0; i < pickedCoins; i++) { addCoin(); incrementCombo(); updateChallenge('coins', 1); }
    for (let i = 0; i < pickedStars; i++) { for (let j = 0; j < 5; j++) addCoin(); incrementCombo(); updateChallenge('coins', 5); }

    if (pickedCoins + pickedStars > 0) {
      if (pickedStars > 0) {
        soundEngine.star();
        scorePopupEvents.emit({ text: `⭐ +${50 * pickedMultiplier}`, color: COLLECTIBLE_COLORS.star });
      } else {
        soundEngine.coin();
        scorePopupEvents.emit({
          text: `+${10 * pickedCoins * pickedMultiplier}`,
          color: COLLECTIBLE_COLORS.coin,
        });
      }
      haptics.coin();
      positions.forEach(p => particleEvents.emit({
        x: p.x, y: p.y, z: p.z,
        color: p.star ? COLLECTIBLE_COLORS.star : COLLECTIBLE_COLORS.coin,
        count: p.star ? 12 : 5,
      }));

      const now = performance.now();
      const currentCombo = useGameState.getState().combo;
      if (currentCombo >= 4 && now - lastComboSound.current > 250) {
        const level = currentCombo >= 20 ? 5 : currentCombo >= 10 ? 4 : currentCombo >= 5 ? 3 : 2;
        soundEngine.combo(level);
        lastComboSound.current = now;
      }
    }

    if (toRemove.length > 0) {
      toRemove.forEach(id => coinZsRef.current.delete(id));
      setCoins(prev => prev.filter(c => !toRemove.includes(c.id)));
    }
  });

  return (
    <group>
      {coins.map(c => c.isStar
        ? <StarMesh key={c.id} c={c} coinZsRef={coinZsRef} />
        : <CoinMesh key={c.id} c={c} coinZsRef={coinZsRef} />
      )}
    </group>
  );
};
