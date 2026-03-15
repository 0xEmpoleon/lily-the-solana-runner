import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameState } from '../store/useGameState';

const CHUNK_LENGTH  = 100;
const VISIBLE_CHUNKS = 4;
const LANE_WIDTH     = 2.5;

// ── Theme definitions ─────────────────────────────────────────────────────
type ThemeName = 'mars' | 'desert' | 'forest';

const THEMES: Record<ThemeName, {
  ground: string; wall: string; rail: string;
  skyColor: string; fogColor: string;
  decoration: Array<{ color: string; shape: 'box' | 'cone'; scale: [number, number, number]; offsetX: number }>;
}> = {
  mars: {
    ground: '#8B4513', wall: '#A0522D', rail: '#555',
    skyColor: '#1a0a00', fogColor: '#3d1500',
    decoration: [
      { color: '#cc3300', shape: 'cone', scale: [0.3, 1.2, 0.3], offsetX:  9.5 },
      { color: '#cc3300', shape: 'cone', scale: [0.2, 0.8, 0.2], offsetX: -9.5 },
    ],
  },
  desert: {
    ground: '#C2955D', wall: '#D4A96A', rail: '#8B6914',
    skyColor: '#1a1000', fogColor: '#6b3a10',
    decoration: [
      { color: '#4a8c3f', shape: 'cone', scale: [0.35, 2.0, 0.35], offsetX:  9.5 },
      { color: '#4a8c3f', shape: 'cone', scale: [0.25, 1.4, 0.25], offsetX: -9.5 },
      { color: '#c2955d', shape: 'box',  scale: [0.6, 0.6, 0.6],   offsetX:  10.5 },
    ],
  },
  forest: {
    ground: '#2d5a1b', wall: '#3d2b1a', rail: '#4a3728',
    skyColor: '#001200', fogColor: '#0a2200',
    decoration: [
      { color: '#2d6e1b', shape: 'cone', scale: [0.6, 3.0, 0.6], offsetX:  9.5 },
      { color: '#1f5c12', shape: 'cone', scale: [0.45, 2.2, 0.45], offsetX: -9.5 },
      { color: '#3d2b1a', shape: 'box',  scale: [0.4, 2.5, 0.4],   offsetX:  10.5 },
      { color: '#3d2b1a', shape: 'box',  scale: [0.4, 2.5, 0.4],   offsetX: -10.5 },
    ],
  },
};

function getTheme(score: number): ThemeName {
  if (score >= 1000) return 'forest';
  if (score >= 400)  return 'desert';
  return 'mars';
}

// ── Track chunk ───────────────────────────────────────────────────────────
interface ChunkProps {
  positionZ: number;
  theme: ThemeName;
}

const TrackChunk: React.FC<ChunkProps> = ({ positionZ, theme }) => {
  const t = THEMES[theme];
  const trackWidth = LANE_WIDTH * 3 + 2;

  return (
    <group position={[0, 0, positionZ]}>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[trackWidth, CHUNK_LENGTH]} />
        <meshStandardMaterial color={t.ground} roughness={0.9} />
      </mesh>

      {/* Side walls */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (LANE_WIDTH * 1.5 + 1.5), 2, 0]}
          receiveShadow castShadow
        >
          <boxGeometry args={[1, 4, CHUNK_LENGTH]} />
          <meshStandardMaterial color={t.wall} />
        </mesh>
      ))}

      {/* Rails */}
      {[-LANE_WIDTH, 0, LANE_WIDTH].map((x, i) => (
        <group key={i} position={[x, 0.05, 0]}>
          {[-0.5, 0.5].map((rx) => (
            <mesh key={rx} position={[rx, 0, 0]} receiveShadow>
              <boxGeometry args={[0.1, 0.1, CHUNK_LENGTH]} />
              <meshStandardMaterial color={t.rail} metalness={0.6} roughness={0.3} />
            </mesh>
          ))}
          {/* Rail ties */}
          {Array.from({ length: 20 }).map((_, ti) => (
            <mesh key={ti} position={[0, -0.02, -CHUNK_LENGTH / 2 + ti * 5 + 2.5]} receiveShadow>
              <boxGeometry args={[1.2, 0.06, 0.3]} />
              <meshStandardMaterial color={t.wall} roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Decorations at sides, spaced along chunk */}
      {t.decoration.map((dec, di) =>
        Array.from({ length: 5 }).map((_, si) => {
          const zOff = -CHUNK_LENGTH / 2 + si * 20 + (di * 7);
          return (
            <mesh
              key={`${di}-${si}`}
              position={[dec.offsetX, dec.scale[1] / 2, zOff]}
              castShadow
            >
              {dec.shape === 'cone'
                ? <coneGeometry args={[dec.scale[0], dec.scale[1], 8]} />
                : <boxGeometry args={dec.scale} />}
              <meshStandardMaterial color={dec.color} roughness={0.7} />
            </mesh>
          );
        })
      )}
    </group>
  );
};

// ── Manager ───────────────────────────────────────────────────────────────
export const TrackManager: React.FC = () => {
  const { speed, gameState, addScore, score } = useGameState();
  const [chunks, setChunks] = useState<{ id: number; z: number }[]>(
    Array.from({ length: VISIBLE_CHUNKS }).map((_, i) => ({ id: i, z: -i * CHUNK_LENGTH }))
  );
  const nextChunkId      = useRef(VISIBLE_CHUNKS);
  const distanceTraveled = useRef(0);
  // Only recompute theme when score crosses a threshold (every 50 pts)
  const themeRef = useRef<ThemeName>('mars');
  themeRef.current = getTheme(score);
  const theme = themeRef.current;

  useFrame((_state, delta) => {
    if (gameState !== 'PLAYING') return;

    setChunks(current => {
      let needsNew = false;
      const moved = current.map(c => {
        const z = c.z + speed * delta;
        if (z > CHUNK_LENGTH) needsNew = true;
        return { ...c, z };
      });
      if (!needsNew) return moved;
      const filtered = moved.filter(c => c.z <= CHUNK_LENGTH);
      const minZ = Math.min(...filtered.map(c => c.z));
      filtered.push({ id: nextChunkId.current++, z: minZ - CHUNK_LENGTH });
      return filtered;
    });

    distanceTraveled.current += speed * delta;
    if (distanceTraveled.current > 10) {
      addScore(1);
      distanceTraveled.current = 0;
    }
  });

  return (
    <>
      {chunks.map(chunk => (
        <TrackChunk key={chunk.id} positionZ={chunk.z} theme={theme} />
      ))}
    </>
  );
};
