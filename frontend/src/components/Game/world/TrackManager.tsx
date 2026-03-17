import React, { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameState } from '../store/useGameState';
import { TRACK_THEMES, type ThemeName } from '../../../assets';

const CHUNK_LENGTH   = 100;
const VISIBLE_CHUNKS = 4;
const LANE_WIDTH     = 2.5;

function getTheme(score: number): ThemeName {
  if (score >= 2500) return 'space';
  if (score >= 1000) return 'forest';
  if (score >= 400)  return 'desert';
  return 'mars';
}

// ── Track chunk ───────────────────────────────────────────────────────────────
interface ChunkProps {
  theme: ThemeName;
  groupRef: React.RefCallback<THREE.Group>;
}

const TrackChunk: React.FC<ChunkProps> = ({ theme, groupRef }) => {
  const t          = TRACK_THEMES[theme];
  const trackWidth = LANE_WIDTH * 3 + 2;

  return (
    <group ref={groupRef}>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[trackWidth, CHUNK_LENGTH]} />
        <meshStandardMaterial color={t.ground} roughness={0.9} />
      </mesh>

      {/* Side walls */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (LANE_WIDTH * 1.5 + 1.5), 2, 0]} receiveShadow castShadow>
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

      {/* Decorations */}
      {t.decoration.map((dec, di) =>
        Array.from({ length: 5 }).map((_, si) => {
          const zOff = -CHUNK_LENGTH / 2 + si * 20 + (di * 7);
          return (
            <mesh key={`${di}-${si}`} position={[dec.offsetX, dec.scale[1] / 2, zOff]} castShadow>
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

// ── Manager ───────────────────────────────────────────────────────────────────
export const TrackManager: React.FC = () => {
  const { speed, speedScale, gameState, addScore, score, increaseSpeed } = useGameState();

  // Chunk list — only changes when a chunk is recycled (~once every 2–5 s)
  const [chunks, setChunks] = useState(() =>
    Array.from({ length: VISIBLE_CHUNKS }, (_, i) => ({ id: i, theme: getTheme(0) as ThemeName }))
  );

  // z-positions stored in a plain array — mutated directly, never in React state
  const chunkZsRef    = useRef<number[]>(
    Array.from({ length: VISIBLE_CHUNKS }, (_, i) => -i * CHUNK_LENGTH)
  );
  // THREE.Group refs per slot — registered by each chunk via ref callback
  const groupRefs     = useRef<Array<THREE.Group | null>>(Array(VISIBLE_CHUNKS).fill(null));
  const nextChunkId   = useRef(VISIBLE_CHUNKS);
  const distTraveled  = useRef(0);

  // Stable ref callback factory so TrackChunk doesn't re-render on every parent render
  const makeGroupRef = useCallback((index: number): React.RefCallback<THREE.Group> =>
    (el) => { groupRefs.current[index] = el; }
  , []);

  useFrame((_state, delta) => {
    if (gameState !== 'PLAYING') return;
    const effectiveSpeed = speed * speedScale;

    // Speed ramp: 0.25 → 1.25 units/s²
    increaseSpeed(delta * (0.25 + Math.min(score / 1500, 1) * 1.0));

    // Move chunks by directly writing to Three.js objects — zero React overhead
    for (let i = 0; i < chunkZsRef.current.length; i++) {
      chunkZsRef.current[i] += effectiveSpeed * delta;
      if (groupRefs.current[i]) {
        groupRefs.current[i]!.position.z = chunkZsRef.current[i];
      }
    }

    // Recycle any chunk that has scrolled past the camera
    const currentTheme = getTheme(score);
    let recycled = false;
    for (let i = 0; i < chunkZsRef.current.length; i++) {
      if (chunkZsRef.current[i] > CHUNK_LENGTH) {
        const minZ = Math.min(...chunkZsRef.current);
        chunkZsRef.current[i] = minZ - CHUNK_LENGTH;
        if (groupRefs.current[i]) groupRefs.current[i]!.position.z = chunkZsRef.current[i];
        const newId = nextChunkId.current++;
        setChunks(prev => prev.map((c, idx) => idx === i ? { id: newId, theme: currentTheme } : c));
        recycled = true;
        break; // one recycle per frame is enough
      }
    }
    // Also update theme on non-recycled frames when score crosses a boundary
    if (!recycled) {
      setChunks(prev => {
        const needsUpdate = prev.some(c => c.theme !== currentTheme);
        return needsUpdate ? prev.map(c => ({ ...c, theme: currentTheme })) : prev;
      });
    }

    // Score: 1 point per 10 units traveled
    distTraveled.current += effectiveSpeed * delta;
    if (distTraveled.current > 10) {
      addScore(1);
      distTraveled.current = 0;
    }
  });

  return (
    <>
      {chunks.map((chunk, index) => (
        <TrackChunk key={chunk.id} theme={chunk.theme} groupRef={makeGroupRef(index)} />
      ))}
    </>
  );
};
