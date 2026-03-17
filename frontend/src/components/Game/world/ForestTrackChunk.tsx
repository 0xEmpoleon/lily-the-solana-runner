import React, { useMemo } from 'react';
import * as THREE from 'three';

const CHUNK_LENGTH = 100;
const LANE_WIDTH   = 2.5;
const TRACK_W      = LANE_WIDTH * 3 + 2;

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0;
    return (s >>> 0) / 0xffffffff;
  };
}

// ── Ground ────────────────────────────────────────────────────────────────────
const ForestGround: React.FC<{ chunkZ: number }> = ({ chunkZ }) => (
  <>
    <mesh rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, chunkZ + CHUNK_LENGTH / 2]} receiveShadow>
      <planeGeometry args={[TRACK_W, CHUNK_LENGTH]} />
      <meshStandardMaterial color="#2d5a1b" roughness={0.98} />
    </mesh>
    {[-1, 1].map(side => (
      <mesh key={side} rotation={[-Math.PI / 2, 0, 0]}
        position={[side * (TRACK_W / 2 + 2.0), -0.05, chunkZ + CHUNK_LENGTH / 2]} receiveShadow>
        <planeGeometry args={[4, CHUNK_LENGTH]} />
        <meshStandardMaterial color="#1e4012" roughness={1} />
      </mesh>
    ))}
    {[-1, 1].map(side => (
      <mesh key={`moss-${side}`} rotation={[-Math.PI / 2, 0, 0]}
        position={[side * (TRACK_W / 2), 0.01, chunkZ + CHUNK_LENGTH / 2]} receiveShadow>
        <planeGeometry args={[0.8, CHUNK_LENGTH]} />
        <meshStandardMaterial color="#1a3a0d" roughness={1} />
      </mesh>
    ))}
  </>
);

// ── Rails ─────────────────────────────────────────────────────────────────────
const ForestRails: React.FC<{ chunkZ: number }> = ({ chunkZ }) => (
  <>
    {[-LANE_WIDTH, 0, LANE_WIDTH].map((x, i) => (
      <group key={i} position={[x, 0.05, chunkZ + CHUNK_LENGTH / 2]}>
        {[-0.5, 0.5].map(rx => (
          <mesh key={rx} position={[rx, 0, 0]} receiveShadow>
            <boxGeometry args={[0.1, 0.1, CHUNK_LENGTH]} />
            <meshStandardMaterial color="#4a3728" metalness={0.3} roughness={0.7} />
          </mesh>
        ))}
        {Array.from({ length: 20 }).map((_, ti) => (
          <mesh key={ti} position={[0, -0.02, -CHUNK_LENGTH / 2 + ti * 5 + 2.5]} receiveShadow>
            <boxGeometry args={[1.2, 0.06, 0.3]} />
            <meshStandardMaterial color="#3d2b1a" roughness={0.95} />
          </mesh>
        ))}
      </group>
    ))}
  </>
);

// ── Tall trees ────────────────────────────────────────────────────────────────
type TreeData = { x: number; z: number; trunkH: number; trunkR: number; canopyR: number; col: string };
const GREENS = ['#0f3808', '#1a5010', '#144a0c', '#0d4208', '#163c0a'];

const ForestTrees: React.FC<{ chunkId: number; chunkZ: number }> = ({ chunkId, chunkZ }) => {
  const trees = useMemo<TreeData[]>(() => {
    const rng = seededRng(chunkId * 8923 + 43);
    const ts: TreeData[] = [];
    [-1, 1].forEach(side => {
      for (let z = 2; z < CHUNK_LENGTH - 2; z += 8 + rng() * 10) {
        ts.push({
          x: side * (TRACK_W / 2 + 1.2 + rng() * 7.5),
          z,
          trunkH:  4 + rng() * 8,
          trunkR:  0.18 + rng() * 0.18,
          canopyR: 1.0 + rng() * 2.0,
          col:     GREENS[Math.floor(rng() * GREENS.length)],
        });
      }
    });
    return ts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunkId]);

  return (
    <>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, chunkZ + t.z]}>
          <mesh position={[0, t.trunkH / 2, 0]} castShadow>
            <cylinderGeometry args={[t.trunkR * 0.8, t.trunkR * 1.3, t.trunkH, 6]} />
            <meshStandardMaterial color="#2a1208" roughness={0.98} />
          </mesh>
          <mesh position={[0, t.trunkH + t.canopyR * 0.7, 0]} castShadow>
            <coneGeometry args={[t.canopyR * 1.3, t.canopyR * 2.2, 7]} />
            <meshStandardMaterial color={t.col} roughness={0.9} />
          </mesh>
          <mesh position={[0, t.trunkH + t.canopyR * 1.95, 0]} castShadow>
            <coneGeometry args={[t.canopyR * 0.85, t.canopyR * 1.6, 7]} />
            <meshStandardMaterial color={t.col} roughness={0.9} />
          </mesh>
        </group>
      ))}
    </>
  );
};

// ── Fallen logs ───────────────────────────────────────────────────────────────
interface LogData { x: number; z: number; r: number }

const FallenLogs: React.FC<{ chunkId: number; chunkZ: number }> = ({ chunkId, chunkZ }) => {
  const logs = useMemo<LogData[]>(() => {
    const rng = seededRng(chunkId * 5003 + 17);
    const ls: LogData[] = [];
    for (let z = 8; z < CHUNK_LENGTH - 8; z += 22 + rng() * 16) {
      [-1, 1].forEach(side => {
        if (rng() < 0.75) {
          ls.push({ x: side * (TRACK_W / 2 + 1.5), z: z + rng() * 8, r: rng() * 0.4 });
        }
      });
    }
    return ls;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunkId]);

  return (
    <>
      {logs.map((l, i) => (
        <mesh key={i} position={[l.x, 0.25, chunkZ + l.z]}
          rotation={[0, l.r, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.25, 0.25, 3.5, 8]} />
          <meshStandardMaterial color="#4a2a10" roughness={0.95} />
        </mesh>
      ))}
    </>
  );
};

// ── Mushroom clusters ─────────────────────────────────────────────────────────
interface MushroomData { x: number; z: number }

const Mushrooms: React.FC<{ chunkId: number; chunkZ: number }> = ({ chunkId, chunkZ }) => {
  const mushrooms = useMemo<MushroomData[]>(() => {
    const rng = seededRng(chunkId * 7331 + 53);
    const ms: MushroomData[] = [];
    for (let z = 8; z < CHUNK_LENGTH - 8; z += 15 + rng() * 10) {
      [-1, 1].forEach(side => {
        ms.push({ x: side * (TRACK_W / 2 + 0.5 + rng() * 2.5), z });
      });
    }
    return ms;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunkId]);

  return (
    <>
      {mushrooms.map((m, i) => (
        <group key={i} position={[m.x, 0, chunkZ + m.z]}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.4, 6]} />
            <meshStandardMaterial color="#c8a060" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.46, 0]}>
            <cylinderGeometry args={[0.35, 0.06, 0.10, 10]} />
            <meshStandardMaterial color="#d4500a" emissive="#aa3000" emissiveIntensity={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.52, 0]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshStandardMaterial color="#ffaa00" emissive="#ff6600" emissiveIntensity={1.2} />
          </mesh>
        </group>
      ))}
    </>
  );
};

// ── Procedural shrub bushes ───────────────────────────────────────────────────
type ShrubData = { x: number; z: number; r: number; col: string };
const SHRUB_COLS = ['#1a4a0a', '#225010', '#163808', '#1c4410'];

const Shrubs: React.FC<{ chunkId: number; chunkZ: number }> = ({ chunkId, chunkZ }) => {
  const shrubs = useMemo<ShrubData[]>(() => {
    const rng = seededRng(chunkId * 6173 + 77);
    const ss: ShrubData[] = [];
    for (let z = 4; z < CHUNK_LENGTH - 4; z += 5 + rng() * 6) {
      [-1, 1].forEach(side => {
        if (rng() < 0.75) {
          ss.push({
            x:   side * (TRACK_W / 2 + 0.5 + rng() * 4.5),
            z:   z + rng() * 3,
            r:   0.25 + rng() * 0.45,
            col: SHRUB_COLS[Math.floor(rng() * SHRUB_COLS.length)],
          });
        }
      });
    }
    return ss;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunkId]);

  return (
    <>
      {shrubs.map((s, i) => (
        <group key={i} position={[s.x, s.r * 0.7, chunkZ + s.z]}>
          <mesh castShadow>
            <sphereGeometry args={[s.r, 6, 5]} />
            <meshStandardMaterial color={s.col} roughness={0.95} />
          </mesh>
          <mesh position={[s.r * 0.55, -s.r * 0.1, 0]} castShadow>
            <sphereGeometry args={[s.r * 0.7, 5, 4]} />
            <meshStandardMaterial color={s.col} roughness={0.95} />
          </mesh>
        </group>
      ))}
    </>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
interface ForestTrackChunkProps {
  chunkId:  number;
  groupRef: React.RefCallback<THREE.Group>;
}

export const ForestTrackChunk: React.FC<ForestTrackChunkProps> = ({ chunkId, groupRef }) => (
  <group ref={groupRef}>
    <ForestGround chunkZ={-CHUNK_LENGTH / 2} />
    <ForestRails  chunkZ={-CHUNK_LENGTH / 2} />
    <ForestTrees  chunkId={chunkId} chunkZ={-CHUNK_LENGTH / 2} />
    <FallenLogs   chunkId={chunkId} chunkZ={-CHUNK_LENGTH / 2} />
    <Mushrooms    chunkId={chunkId} chunkZ={-CHUNK_LENGTH / 2} />
    <Shrubs       chunkId={chunkId} chunkZ={-CHUNK_LENGTH / 2} />
  </group>
);
