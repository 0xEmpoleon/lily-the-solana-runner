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

// ── Ground + tire tracks ──────────────────────────────────────────────────────
const DesertGround: React.FC<{ chunkZ: number }> = ({ chunkZ }) => (
  <>
    <mesh rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, chunkZ + CHUNK_LENGTH / 2]} receiveShadow>
      <planeGeometry args={[TRACK_W, CHUNK_LENGTH]} />
      <meshStandardMaterial color="#c2955d" roughness={0.95} />
    </mesh>
    {[-1, 1].map(side => (
      <mesh key={side} rotation={[-Math.PI / 2, 0, 0]}
        position={[side * (TRACK_W / 2 + 1.5), -0.05, chunkZ + CHUNK_LENGTH / 2]} receiveShadow>
        <planeGeometry args={[3, CHUNK_LENGTH]} />
        <meshStandardMaterial color="#d4a96a" roughness={1} />
      </mesh>
    ))}
    {[-1.0, 1.0].map((x, i) => (
      <mesh key={`tr-${i}`} position={[x, 0.01, chunkZ + CHUNK_LENGTH / 2]} receiveShadow>
        <boxGeometry args={[0.15, 0.02, CHUNK_LENGTH]} />
        <meshStandardMaterial color="#a07840" roughness={0.95} />
      </mesh>
    ))}
  </>
);

// ── Rails ─────────────────────────────────────────────────────────────────────
const DesertRails: React.FC<{ chunkZ: number }> = ({ chunkZ }) => (
  <>
    {[-LANE_WIDTH, 0, LANE_WIDTH].map((x, i) => (
      <group key={i} position={[x, 0.05, chunkZ + CHUNK_LENGTH / 2]}>
        {[-0.5, 0.5].map(rx => (
          <mesh key={rx} position={[rx, 0, 0]} receiveShadow>
            <boxGeometry args={[0.1, 0.1, CHUNK_LENGTH]} />
            <meshStandardMaterial color="#8b6914" metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
        {Array.from({ length: 20 }).map((_, ti) => (
          <mesh key={ti} position={[0, -0.02, -CHUNK_LENGTH / 2 + ti * 5 + 2.5]} receiveShadow>
            <boxGeometry args={[1.2, 0.06, 0.3]} />
            <meshStandardMaterial color="#7a5c0a" roughness={0.9} />
          </mesh>
        ))}
      </group>
    ))}
  </>
);

// ── Sand dunes ────────────────────────────────────────────────────────────────
interface DuneData { x: number; z: number; rTop: number; rBot: number; h: number }

const SandDunes: React.FC<{ chunkId: number; chunkZ: number }> = ({ chunkId, chunkZ }) => {
  const dunes = useMemo<DuneData[]>(() => {
    const rng = seededRng(chunkId * 2311 + 29);
    const ds: DuneData[] = [];
    for (let z = 8; z < CHUNK_LENGTH - 8; z += 22 + rng() * 18) {
      [-1, 1].forEach(side => {
        ds.push({
          x: side * (TRACK_W / 2 + 3.0 + rng() * 4.0), z,
          rTop: 1.2 + rng() * 1.3, rBot: 2.0 + rng() * 1.5, h: 0.5 + rng() * 0.6,
        });
      });
    }
    return ds;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunkId]);

  return (
    <>
      {dunes.map((d, i) => (
        <mesh key={i} position={[d.x, 0, chunkZ + d.z]} receiveShadow>
          <cylinderGeometry args={[d.rTop, d.rBot, d.h, 12]} />
          <meshStandardMaterial color="#d4a96a" roughness={0.98} />
        </mesh>
      ))}
    </>
  );
};

// ── Flat-top mesa/butte formations ────────────────────────────────────────────
type MesaData = { x: number; z: number; h: number; w: number; d: number };

const DesertMesas: React.FC<{ chunkId: number; chunkZ: number }> = ({ chunkId, chunkZ }) => {
  const mesas = useMemo<MesaData[]>(() => {
    const rng = seededRng(chunkId * 3137 + 71);
    const ms: MesaData[] = [];
    [-1, 1].forEach(side => {
      for (let z = 10; z < CHUNK_LENGTH - 10; z += 28 + rng() * 28) {
        ms.push({
          x: side * (TRACK_W / 2 + 12 + rng() * 10), z,
          h: 2.5 + rng() * 5.5, w: 4.5 + rng() * 6, d: 2.5 + rng() * 4,
        });
      }
    });
    return ms;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunkId]);

  return (
    <>
      {mesas.map((m, i) => (
        <group key={i} position={[m.x, 0, chunkZ + m.z]}>
          <mesh position={[0, m.h / 2, 0]} castShadow>
            <boxGeometry args={[m.w, m.h, m.d]} />
            <meshStandardMaterial color="#a85830" roughness={0.95} />
          </mesh>
          <mesh position={[0, m.h + 0.18, 0]}>
            <boxGeometry args={[m.w + 0.5, 0.35, m.d + 0.5]} />
            <meshStandardMaterial color="#c86838" roughness={0.88} />
          </mesh>
          <mesh position={[m.w * 0.4, 0.22, m.d * 0.25]} castShadow>
            <boxGeometry args={[0.9, 0.45, 0.7]} />
            <meshStandardMaterial color="#954820" roughness={0.97} />
          </mesh>
          <mesh position={[-m.w * 0.3, 0.15, -m.d * 0.3]} castShadow>
            <boxGeometry args={[0.6, 0.3, 0.5]} />
            <meshStandardMaterial color="#9a5020" roughness={0.97} />
          </mesh>
        </group>
      ))}
    </>
  );
};

// ── Procedural cacti ──────────────────────────────────────────────────────────
type CactusData = { x: number; z: number; h: number; armSide: number };

const Cacti: React.FC<{ chunkId: number; chunkZ: number }> = ({ chunkId, chunkZ }) => {
  const cacti = useMemo<CactusData[]>(() => {
    const rng = seededRng(chunkId * 5711 + 31);
    const cs: CactusData[] = [];
    for (let z = 5; z < CHUNK_LENGTH - 5; z += 6 + rng() * 8) {
      [-1, 1].forEach(side => {
        if (rng() < 0.70) {
          cs.push({
            x: side * (TRACK_W / 2 + 1.2 + rng() * 4.0),
            z: z + rng() * 4,
            h: 1.2 + rng() * 2.0,
            armSide: rng() < 0.5 ? 1 : -1,
          });
        }
      });
    }
    return cs;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunkId]);

  return (
    <>
      {cacti.map((c, i) => (
        <group key={i} position={[c.x, 0, chunkZ + c.z]}>
          {/* Main stalk */}
          <mesh position={[0, c.h / 2, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.16, c.h, 6]} />
            <meshStandardMaterial color="#4a7a2a" roughness={0.85} />
          </mesh>
          {/* Arm */}
          <mesh position={[c.armSide * 0.18, c.h * 0.55, 0]}
            rotation={[0, 0, c.armSide * (Math.PI / 2.4)]} castShadow>
            <cylinderGeometry args={[0.09, 0.11, c.h * 0.45, 6]} />
            <meshStandardMaterial color="#4a7a2a" roughness={0.85} />
          </mesh>
          {/* Arm tip — vertical segment */}
          <mesh position={[c.armSide * 0.32, c.h * 0.72, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.10, c.h * 0.3, 6]} />
            <meshStandardMaterial color="#3d6a20" roughness={0.85} />
          </mesh>
        </group>
      ))}
    </>
  );
};

// ── Small rock clusters ───────────────────────────────────────────────────────
type RockData = { x: number; z: number; s: number; ry: number };

const DesertRocks: React.FC<{ chunkId: number; chunkZ: number }> = ({ chunkId, chunkZ }) => {
  const rocks = useMemo<RockData[]>(() => {
    const rng = seededRng(chunkId * 9341 + 59);
    const rs: RockData[] = [];
    for (let z = 8; z < CHUNK_LENGTH - 8; z += 10 + rng() * 12) {
      [-1, 1].forEach(side => {
        if (rng() < 0.60) {
          rs.push({
            x: side * (TRACK_W / 2 + 1.5 + rng() * 3),
            z: z + rng() * 6,
            s: 0.3 + rng() * 0.5,
            ry: rng() * Math.PI,
          });
        }
      });
    }
    return rs;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunkId]);

  return (
    <>
      {rocks.map((r, i) => (
        <group key={i} position={[r.x, r.s * 0.35, chunkZ + r.z]} rotation={[0, r.ry, 0]}>
          <mesh castShadow>
            <boxGeometry args={[r.s * 1.4, r.s * 0.7, r.s]} />
            <meshStandardMaterial color="#8a6035" roughness={0.97} />
          </mesh>
          <mesh position={[r.s * 0.4, r.s * 0.25, r.s * 0.2]} castShadow>
            <boxGeometry args={[r.s * 0.7, r.s * 0.5, r.s * 0.6]} />
            <meshStandardMaterial color="#7a5028" roughness={0.97} />
          </mesh>
        </group>
      ))}
    </>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────
interface DesertTrackChunkProps {
  chunkId:  number;
  groupRef: React.RefCallback<THREE.Group>;
}

export const DesertTrackChunk: React.FC<DesertTrackChunkProps> = ({ chunkId, groupRef }) => (
  <group ref={groupRef}>
    <DesertGround chunkZ={-CHUNK_LENGTH / 2} />
    <DesertRails  chunkZ={-CHUNK_LENGTH / 2} />
    <SandDunes    chunkId={chunkId} chunkZ={-CHUNK_LENGTH / 2} />
    <DesertMesas  chunkId={chunkId} chunkZ={-CHUNK_LENGTH / 2} />
    <Cacti        chunkId={chunkId} chunkZ={-CHUNK_LENGTH / 2} />
    <DesertRocks  chunkId={chunkId} chunkZ={-CHUNK_LENGTH / 2} />
  </group>
);
