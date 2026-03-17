import React, { useRef, useState, useCallback, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameState } from '../store/useGameState';
import { TRACK_THEMES, type ThemeName } from '../../../assets';
import { CityTrackChunk }   from './CityTrackChunk';
import { DesertTrackChunk } from './DesertTrackChunk';
import { ForestTrackChunk } from './ForestTrackChunk';

const CHUNK_LENGTH   = 100;
const VISIBLE_CHUNKS = 4;
const LANE_WIDTH     = 2.5;

// Score thresholds — single source of truth
function getTheme(score: number): ThemeName {
  if (score >= 8000) return 'space';
  if (score >= 6000) return 'forest';
  if (score >= 4000) return 'desert';
  if (score >= 2000) return 'city';
  return 'mars';
}

// ── Procedural TrackChunk (mars + space) ──────────────────────────────────────
interface ChunkProps {
  theme:    ThemeName;
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

      {/* Rails */}
      {[-LANE_WIDTH, 0, LANE_WIDTH].map((x, i) => (
        <group key={i} position={[x, 0.05, 0]}>
          {[-0.5, 0.5].map((rx) => (
            <mesh key={rx} position={[rx, 0, 0]} receiveShadow>
              <boxGeometry args={[0.1, 0.1, CHUNK_LENGTH]} />
              <meshStandardMaterial color={t.rail} metalness={0.6} roughness={0.3} />
            </mesh>
          ))}
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
      {/* Mars-specific: rock spire clusters + mid-ground rocks + crater rings */}
      {theme === 'mars' && (
        <>
          {/* Outer tall spires at ±9.5 */}
          {([-9.5, 9.5] as number[]).map((offsetX, oi) =>
            Array.from({ length: 5 }).map((_, si) => {
              const zOff = -CHUNK_LENGTH / 2 + si * 20 + oi * 5;
              const h1 = 1.6 + (si % 3) * 0.6;
              const h2 = 1.0 + (si % 2) * 0.5;
              return (
                <group key={`spire-${oi}-${si}`} position={[offsetX, 0, zOff]}>
                  <mesh position={[0, h1 / 2, 0]} castShadow>
                    <boxGeometry args={[0.9, h1, 0.9]} />
                    <meshStandardMaterial color="#7a3a1a" roughness={0.7} />
                  </mesh>
                  <mesh position={[0.5, h2 / 2, 0.4]} castShadow>
                    <boxGeometry args={[0.5, h2, 0.5]} />
                    <meshStandardMaterial color="#8a4520" roughness={0.7} />
                  </mesh>
                  <mesh position={[0, h1 + h2 / 2, 0]} castShadow>
                    <boxGeometry args={[0.6, h2, 0.6]} />
                    <meshStandardMaterial color="#6a2a0a" roughness={0.7} />
                  </mesh>
                </group>
              );
            })
          )}
          {/* Mid-ground smaller rocks at ±7.0 */}
          {([-7.0, 7.0] as number[]).map((offsetX, oi) =>
            Array.from({ length: 4 }).map((_, si) => {
              const zOff = -CHUNK_LENGTH / 2 + si * 25 + oi * 8 + 10;
              return (
                <group key={`rock-mid-${oi}-${si}`} position={[offsetX, 0, zOff]}>
                  <mesh position={[0, 0.4, 0]} castShadow>
                    <boxGeometry args={[0.7, 0.8, 0.7]} />
                    <meshStandardMaterial color="#6b3010" roughness={0.85} />
                  </mesh>
                  <mesh position={[0.4, 0.25, 0.3]} castShadow>
                    <boxGeometry args={[0.4, 0.5, 0.4]} />
                    <meshStandardMaterial color="#7a3a1a" roughness={0.85} />
                  </mesh>
                </group>
              );
            })
          )}
          {/* Crater rings at ±8.0 */}
          {([-8.0, 8.0] as number[]).map((offsetX, oi) =>
            Array.from({ length: 5 }).map((_, si) => {
              const zOff = -CHUNK_LENGTH / 2 + si * 20 + 5 + oi * 4;
              const r = 1.6 + (si % 3) * 0.4;
              return (
                <mesh key={`crater-${oi}-${si}`}
                  position={[offsetX, 0.01, zOff]}
                  rotation={[-Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[r, 0.15, 8, 16]} />
                  <meshStandardMaterial color="#5a2010" roughness={0.8} />
                </mesh>
              );
            })
          )}
          {/* Distant cliff silhouettes at ±22-28 — multiple slab layers */}
          {([-24, 24] as number[]).map((offsetX, oi) =>
            Array.from({ length: 4 }).map((_, si) => {
              const h    = 3.5 + (si * 4 + oi * 3) % 10;
              const w    = 9  + (si * 5 + oi * 2) % 8;
              const zOff = -CHUNK_LENGTH / 2 + si * 26 + oi * 11;
              return (
                <group key={`cliff-${oi}-${si}`} position={[offsetX, 0, zOff]}>
                  <mesh position={[0, h / 2, 0]}>
                    <boxGeometry args={[w, h, 5]} />
                    <meshStandardMaterial color="#4a1806" roughness={1} />
                  </mesh>
                  {/* Top ledge */}
                  <mesh position={[0, h + 0.2, 0]}>
                    <boxGeometry args={[w + 1, 0.4, 5.5]} />
                    <meshStandardMaterial color="#5a2008" roughness={1} />
                  </mesh>
                </group>
              );
            })
          )}
          {/* Lava vent emissive cones just outside track edge */}
          {Array.from({ length: 7 }).map((_, i) => {
            const side = i % 2 === 0 ? 1 : -1;
            const xOff = side * (TRACK_W / 2 + 0.9 + (i % 3) * 0.9);
            const zOff = -CHUNK_LENGTH / 2 + i * 14 + 7;
            return (
              <group key={`vent-${i}`} position={[xOff, 0, zOff]}>
                <mesh position={[0, 0.12, 0]}>
                  <cylinderGeometry args={[0.1, 0.22, 0.24, 8]} />
                  <meshStandardMaterial color="#cc3300" emissive="#ff2200" emissiveIntensity={2.5} />
                </mesh>
                <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[0.38, 8]} />
                  <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={1.2} />
                </mesh>
              </group>
            );
          })}
        </>
      )}

      {/* Space-specific: track grid lines + crystal pillars + floating debris */}
      {theme === 'space' && (
        <>
          {/* Grid lines spanning full track width */}
          {Array.from({ length: 20 }).map((_, i) => (
            <mesh key={`grid-${i}`} position={[0, 0.01, -CHUNK_LENGTH / 2 + i * 5 + 2.5]}>
              <boxGeometry args={[trackWidth, 0.02, 0.05]} />
              <meshStandardMaterial color="#0f3460" roughness={0.5} emissive="#0f3460" emissiveIntensity={0.4} />
            </mesh>
          ))}
          {/* Glowing crystal pillars at ±9.5 */}
          {([-9.5, 9.5] as number[]).map((offsetX, oi) =>
            Array.from({ length: 5 }).map((_, si) => {
              const h = 1.5 + (si % 4) * 0.8;
              const zOff = -CHUNK_LENGTH / 2 + si * 20 + oi * 7;
              return (
                <group key={`crystal-${oi}-${si}`} position={[offsetX, 0, zOff]}>
                  <mesh position={[0, h / 2, 0]} castShadow>
                    <boxGeometry args={[0.3, h, 0.3]} />
                    <meshStandardMaterial color="#533483" emissive="#533483" emissiveIntensity={0.6} roughness={0.2} metalness={0.8} />
                  </mesh>
                  <mesh position={[0.5, h * 0.4, 0.3]} castShadow>
                    <boxGeometry args={[0.2, h * 0.6, 0.2]} />
                    <meshStandardMaterial color="#e94560" emissive="#e94560" emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
                  </mesh>
                </group>
              );
            })
          )}
          {/* Floating debris at ±11.0 with varied heights */}
          {([-11.0, 11.0] as number[]).map((offsetX, oi) =>
            Array.from({ length: 6 }).map((_, si) => {
              const yH = 0.4 + ((si * 11 + oi * 7) % 30) / 10;
              const zOff = -CHUNK_LENGTH / 2 + si * 16 + oi * 5;
              return (
                <mesh key={`debris-${oi}-${si}`} position={[offsetX, yH, zOff]} castShadow>
                  <boxGeometry args={[0.5, 0.35, 0.6]} />
                  <meshStandardMaterial color="#16213e" emissive="#0f3460" emissiveIntensity={0.3} roughness={0.4} metalness={0.6} />
                </mesh>
              );
            })
          )}
          {/* Space station arm structures at ±14 */}
          {([-14, 14] as number[]).map((offsetX, oi) =>
            Array.from({ length: 3 }).map((_, si) => {
              const yH = 1.5 + (si * 5 + oi * 3) % 4;
              const zOff = -CHUNK_LENGTH / 2 + si * 34 + oi * 12;
              return (
                <group key={`station-${oi}-${si}`} position={[offsetX, yH, zOff]}>
                  {/* Horizontal truss arm */}
                  <mesh>
                    <boxGeometry args={[3.5, 0.28, 0.28]} />
                    <meshStandardMaterial color="#1a1a3e" emissive="#0f3460" emissiveIntensity={0.3} metalness={0.9} roughness={0.2} />
                  </mesh>
                  {/* Central hub */}
                  <mesh>
                    <boxGeometry args={[0.55, 0.55, 0.55]} />
                    <meshStandardMaterial color="#533483" emissive="#533483" emissiveIntensity={0.5} metalness={0.8} roughness={0.2} />
                  </mesh>
                  {/* Solar panels */}
                  <mesh position={[1.9, 0.55, 0]}>
                    <boxGeometry args={[1.1, 0.05, 0.75]} />
                    <meshStandardMaterial color="#1a5070" emissive="#0f3060" emissiveIntensity={0.4} />
                  </mesh>
                  <mesh position={[-1.9, 0.55, 0]}>
                    <boxGeometry args={[1.1, 0.05, 0.75]} />
                    <meshStandardMaterial color="#1a5070" emissive="#0f3060" emissiveIntensity={0.4} />
                  </mesh>
                </group>
              );
            })
          )}
          {/* Distant planet with ring at ±28 */}
          {([-28, 28] as number[]).map((offsetX, oi) => (
            <group key={`planet-${oi}`} position={[offsetX, 6, 0]}>
              <mesh>
                <sphereGeometry args={[4, 12, 12]} />
                <meshStandardMaterial color="#0d0530" emissive="#090322" emissiveIntensity={0.35} roughness={0.85} />
              </mesh>
              {/* Planetary ring */}
              <mesh rotation={[Math.PI / 7, 0, 0]}>
                <torusGeometry args={[5.8, 0.35, 6, 28]} />
                <meshStandardMaterial color="#1a1044" emissive="#0f0830" emissiveIntensity={0.25} roughness={0.6} metalness={0.3} />
              </mesh>
            </group>
          ))}
        </>
      )}
    </group>
  );
};

// ── Manager ───────────────────────────────────────────────────────────────────
export const TrackManager: React.FC = () => {
  const { speed, speedScale, gameState, addScore, score, increaseSpeed } = useGameState();

  const [chunks, setChunks] = useState(() =>
    Array.from({ length: VISIBLE_CHUNKS }, (_, i) => ({
      id: i, theme: getTheme(0) as ThemeName,
    }))
  );

  // Z-positions in a plain ref — mutated directly, no React state
  const chunkZsRef   = useRef<number[]>(
    Array.from({ length: VISIBLE_CHUNKS }, (_, i) => -i * CHUNK_LENGTH)
  );
  const groupRefs    = useRef<Array<THREE.Group | null>>(Array(VISIBLE_CHUNKS).fill(null));
  const nextChunkId  = useRef(VISIBLE_CHUNKS);
  const distTraveled = useRef(0);

  const makeGroupRef = useCallback(
    (index: number): React.RefCallback<THREE.Group> =>
      (el) => { groupRefs.current[index] = el; },
    []
  );

  useFrame((_state, delta) => {
    if (gameState !== 'PLAYING') return;
    const effectiveSpeed = speed * speedScale;

    // Phase-based acceleration — each zone has a tuned rate
    const accelRate =
      score < 2000 ? 0.25 :   // Mars: gentle intro
      score < 4000 ? 0.50 :   // City: picking up
      score < 6000 ? 0.75 :   // Desert: notably faster
      score < 8000 ? 0.60 :   // Forest: sustained (already fast)
                     0.35;    // Space: tapering toward cap (120)
    increaseSpeed(delta * accelRate);

    // Move chunks by writing directly to Three.js objects — zero React overhead
    for (let i = 0; i < chunkZsRef.current.length; i++) {
      chunkZsRef.current[i] += effectiveSpeed * delta;
      if (groupRefs.current[i]) {
        groupRefs.current[i]!.position.z = chunkZsRef.current[i];
      }
    }

    // Recycle any chunk that has scrolled past camera
    const currentTheme = getTheme(score);
    let recycled = false;
    for (let i = 0; i < chunkZsRef.current.length; i++) {
      if (chunkZsRef.current[i] > CHUNK_LENGTH) {
        const minZ = Math.min(...chunkZsRef.current);
        chunkZsRef.current[i] = minZ - CHUNK_LENGTH;
        if (groupRefs.current[i]) groupRefs.current[i]!.position.z = chunkZsRef.current[i];
        const newId = nextChunkId.current++;
        setChunks(prev => prev.map((c, idx) =>
          idx === i ? { id: newId, theme: currentTheme } : c
        ));
        recycled = true;
        break;
      }
    }
    if (!recycled) {
      setChunks(prev => {
        const needsUpdate = prev.some(c => c.theme !== currentTheme);
        return needsUpdate ? prev.map(c => ({ ...c, theme: currentTheme })) : prev;
      });
    }

    // Score: 1 point per 10 units
    distTraveled.current += effectiveSpeed * delta;
    if (distTraveled.current > 10) {
      addScore(1);
      distTraveled.current = 0;
    }
  });

  return (
    <>
      {chunks.map((chunk, index) => {
        const ref = makeGroupRef(index);
        if (chunk.theme === 'city') {
          return (
            <Suspense key={chunk.id} fallback={null}>
              <CityTrackChunk chunkId={chunk.id} groupRef={ref} />
            </Suspense>
          );
        }
        if (chunk.theme === 'desert') {
          return (
            <Suspense key={chunk.id} fallback={null}>
              <DesertTrackChunk chunkId={chunk.id} groupRef={ref} />
            </Suspense>
          );
        }
        if (chunk.theme === 'forest') {
          return (
            <Suspense key={chunk.id} fallback={null}>
              <ForestTrackChunk chunkId={chunk.id} groupRef={ref} />
            </Suspense>
          );
        }
        // mars + space: procedural
        return <TrackChunk key={chunk.id} theme={chunk.theme} groupRef={ref} />;
      })}
    </>
  );
};
