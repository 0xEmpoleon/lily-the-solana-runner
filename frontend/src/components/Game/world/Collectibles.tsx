import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameState } from '../store/useGameState';
import { soundEngine } from '../../../utils/sound';
import { haptics } from '../../../utils/haptics';
import { particleEvents } from '../../../utils/particleEvents';
import { scorePopupEvents } from '../../../utils/scorePopupEvents';

interface CoinItem {
  id: number;
  lane: number;
  y: number;
  z: number;
  collected: boolean;
  isStar: boolean;
}

interface CollectibleManagerProps {
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
}

// Shared geometries
const coinGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
const coinMat = new THREE.MeshStandardMaterial({ color: '#FFD700', metalness: 0.8, roughness: 0.2 });
const starMat = new THREE.MeshStandardMaterial({
  color: '#fde047', emissive: '#f59e0b', emissiveIntensity: 0.8,
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

const CoinMesh = ({ c }: { c: CoinItem }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => { if (ref.current) ref.current.rotation.z = s.clock.elapsedTime * 3; });
  return (
    <mesh ref={ref} position={[c.lane * 2.5, c.y, c.z]}
      rotation={[Math.PI / 2, 0, 0]} geometry={coinGeo} material={coinMat} castShadow />
  );
};

const StarMesh = ({ c }: { c: CoinItem }) => {
  const ref = useRef<THREE.Group>(null);
  const baseY = useRef(c.y);
  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.y = s.clock.elapsedTime * 2;
      ref.current.position.y = baseY.current + Math.sin(s.clock.elapsedTime * 3) * 0.15;
    }
  });
  return (
    <group ref={ref} position={[c.lane * 2.5, c.y, c.z]}>
      <mesh geometry={starGeo} material={starMat} castShadow position={[-0.5, -0.5, 0]} />
      <pointLight color="#fde047" intensity={5} distance={3} decay={2} />
    </group>
  );
};

export const CollectibleManager: React.FC<CollectibleManagerProps> = ({ playerPosRef }) => {
  const { speed, speedScale, gameState, addCoin, activePowerup, incrementCombo, updateChallenge } = useGameState();
  const [coins, setCoins] = useState<CoinItem[]>([]);
  const nextZ   = useRef(-50);
  const nextId  = useRef(0);
  const lastComboSound = useRef(0);

  useFrame((_s, delta) => {
    if (gameState !== 'PLAYING') return;

    const effectiveSpeed = speed * speedScale;

    // ── Advance spawn cursor with world movement ────────────────────────
    nextZ.current += effectiveSpeed * delta;

    // ── Spawn patterns ─────────────────────────────────────────────────
    if (nextZ.current > -200) {
      const lane = Math.floor(Math.random() * 3) - 1;
      const r = Math.random();

      const newItems: CoinItem[] = [];

      if (r < 0.06) {
        // ★ Star
        newItems.push({ id: nextId.current++, lane, y: 1.0, z: nextZ.current, collected: false, isStar: true });
        nextZ.current -= 20;

      } else if (r < 0.28) {
        // Jump arc (normal height)
        for (let i = 0; i < 7; i++) {
          newItems.push({
            id: nextId.current++, lane,
            y: 1 + Math.sin((i / 6) * Math.PI) * 2,
            z: nextZ.current - i * 2.2, collected: false, isStar: false,
          });
        }
        nextZ.current -= 25;

      } else if (r < 0.44) {
        // High arc — requires double jump (peaks at y≈4.5)
        for (let i = 0; i < 7; i++) {
          newItems.push({
            id: nextId.current++, lane,
            y: 1 + Math.sin((i / 6) * Math.PI) * 3.5,
            z: nextZ.current - i * 3, collected: false, isStar: false,
          });
        }
        nextZ.current -= 28;

      } else if (r < 0.63) {
        // Ground line
        for (let i = 0; i < 10; i++) {
          newItems.push({
            id: nextId.current++, lane, y: 0.5,
            z: nextZ.current - i * 2, collected: false, isStar: false,
          });
        }
        nextZ.current -= 35;

      } else if (r < 0.78) {
        // Zigzag across lanes
        const zigzag = [-1, 0, 1, 0, -1, 0, 1, 0] as const;
        for (let i = 0; i < 8; i++) {
          newItems.push({
            id: nextId.current++, lane: zigzag[i], y: 0.5,
            z: nextZ.current - i * 3, collected: false, isStar: false,
          });
        }
        nextZ.current -= 32;

      } else if (r < 0.90) {
        // 3-lane spread (3 rows, all 3 lanes)
        for (let row = 0; row < 3; row++) {
          for (const l of [-1, 0, 1] as const) {
            newItems.push({
              id: nextId.current++, lane: l, y: 0.5,
              z: nextZ.current - row * 6, collected: false, isStar: false,
            });
          }
        }
        nextZ.current -= 28;

      } else {
        // Gap (no coins)
        nextZ.current -= 15;
      }

      if (newItems.length > 0) setCoins(p => [...p, ...newItems]);
    }

    // ── Move + collect ─────────────────────────────────────────────────
    setCoins(prev => {
      const pPos = playerPosRef.current;
      const hasMagnet = activePowerup === 'magnet';
      let pickedCoins = 0;
      let pickedStars = 0;
      let pickedMultiplier = 1;
      const positions: Array<{ x: number; y: number; z: number; star: boolean }> = [];

      const zRange = hasMagnet ? 4.0 : 0.5;
      const xRange = hasMagnet ? 2.8 : 1.0;
      const yRange = hasMagnet ? 3.0 : 1.5;

      const next = prev.map(c => {
        if (c.collected) return { ...c, z: c.z + effectiveSpeed * delta };
        const newZ = c.z + effectiveSpeed * delta;
        if (newZ > -zRange && newZ < zRange) {
          const cX = c.lane * 2.5;
          if (Math.abs(cX - pPos.x) < xRange && Math.abs(c.y - pPos.y) < yRange) {
            positions.push({ x: cX, y: c.y, z: newZ, star: c.isStar });
            if (c.isStar) pickedStars++; else pickedCoins++;
            return { ...c, z: newZ, collected: true };
          }
        }
        return { ...c, z: newZ };
      });

      // Capture multiplier from state for popup text
      pickedMultiplier = useGameState.getState().multiplier;

      // Award + effects
      for (let i = 0; i < pickedCoins; i++) {
        addCoin();
        incrementCombo();
        updateChallenge('coins', 1);
      }
      for (let i = 0; i < pickedStars; i++) {
        for (let j = 0; j < 5; j++) addCoin();
        incrementCombo();
        updateChallenge('coins', 5);
      }

      const totalPicked = pickedCoins + pickedStars;
      if (totalPicked > 0) {
        if (pickedStars > 0) {
          soundEngine.star();
          scorePopupEvents.emit({ text: `⭐ +${50 * pickedMultiplier}`, color: '#fde047' });
        } else {
          soundEngine.coin();
          if (pickedCoins > 1) {
            scorePopupEvents.emit({ text: `+${10 * pickedCoins * pickedMultiplier}`, color: '#FFD700' });
          } else {
            scorePopupEvents.emit({ text: `+${10 * pickedMultiplier}`, color: '#FFD700' });
          }
        }
        haptics.coin();

        positions.forEach(p => {
          particleEvents.emit({
            x: p.x, y: p.y, z: p.z,
            color: p.star ? '#fde047' : '#FFD700',
            count: p.star ? 12 : 5,
          });
        });

        // Combo sound throttled
        const now = performance.now();
        const currentCombo = useGameState.getState().combo;
        if (currentCombo >= 4 && now - lastComboSound.current > 250) {
          const level = currentCombo >= 20 ? 5 : currentCombo >= 10 ? 4 : currentCombo >= 5 ? 3 : 2;
          soundEngine.combo(level);
          lastComboSound.current = now;
        }
      }

      return next.filter(c => c.z < 20 && !c.collected);
    });
  });

  return (
    <group>
      {coins.map(c => c.isStar
        ? <StarMesh key={c.id} c={c} />
        : <CoinMesh key={c.id} c={c} />
      )}
    </group>
  );
};
