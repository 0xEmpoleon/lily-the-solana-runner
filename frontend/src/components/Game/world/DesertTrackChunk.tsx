import React, { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';
import * as THREE from 'three';
import { DAE_MODELS } from '../../../assets';

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

// ── DAE model component — clones scene for multiple instances ─────────────────
const DaeModel: React.FC<{
  path: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}> = ({ path, position, rotation = [0, 0, 0], scale = 1 }) => {
  const collada = useLoader(ColladaLoader, path);
  const clone   = useMemo(() => collada!.scene.clone(true), [collada]);

  const s = Array.isArray(scale) ? scale : [scale, scale, scale];
  return (
    <primitive
      object={clone}
      position={position}
      rotation={rotation}
      scale={s as [number, number, number]}
    />
  );
};

// ── Ground plane + sidewalk (procedural — tiles it cleanly) ───────────────────
const DesertGround: React.FC<{ chunkZ: number }> = ({ chunkZ }) => (
  <>
    {/* Sandy ground */}
    <mesh rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, chunkZ + CHUNK_LENGTH / 2]} receiveShadow>
      <planeGeometry args={[TRACK_W, CHUNK_LENGTH]} />
      <meshStandardMaterial color="#c2955d" roughness={0.95} />
    </mesh>
    {/* Side sand banks */}
    {[-1, 1].map(side => (
      <mesh key={side}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[side * (TRACK_W / 2 + 1.5), -0.05, chunkZ + CHUNK_LENGTH / 2]} receiveShadow>
        <planeGeometry args={[3, CHUNK_LENGTH]} />
        <meshStandardMaterial color="#d4a96a" roughness={1} />
      </mesh>
    ))}
    {/* Tire track grooves on road surface */}
    {[-1.0, 1.0].map((x, i) => (
      <mesh key={`track-${i}`} position={[x, 0.01, chunkZ + CHUNK_LENGTH / 2]} receiveShadow>
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
          <mesh key={ti}
            position={[0, -0.02, -CHUNK_LENGTH / 2 + ti * 5 + 2.5]} receiveShadow>
            <boxGeometry args={[1.2, 0.06, 0.3]} />
            <meshStandardMaterial color="#7a5c0a" roughness={0.9} />
          </mesh>
        ))}
      </group>
    ))}
  </>
);

// ── Sand dune mounds on the sides ────────────────────────────────────────────
interface DuneData { x: number; z: number; rTop: number; rBot: number; h: number }

const SandDunes: React.FC<{ chunkId: number; chunkZ: number }> = ({ chunkId, chunkZ }) => {
  const dunes = useMemo<DuneData[]>(() => {
    const rng = seededRng(chunkId * 2311 + 29);
    const ds: DuneData[] = [];
    for (let z = 8; z < CHUNK_LENGTH - 8; z += 22 + rng() * 18) {
      [-1, 1].forEach(side => {
        const xOff = TRACK_W / 2 + 3.0 + rng() * 4.0;
        ds.push({
          x: side * xOff, z,
          rTop: 1.2 + rng() * 1.3,
          rBot: 2.0 + rng() * 1.5,
          h:    0.5 + rng() * 0.6,
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

// ── Flat-top mesa/butte formations in the distance ────────────────────────────
type MesaData = { x: number; z: number; h: number; w: number; d: number };

const DesertMesas: React.FC<{ chunkId: number; chunkZ: number }> = ({ chunkId, chunkZ }) => {
  const mesas = useMemo<MesaData[]>(() => {
    const rng = seededRng(chunkId * 3137 + 71);
    const ms: MesaData[] = [];
    [-1, 1].forEach(side => {
      for (let z = 10; z < CHUNK_LENGTH - 10; z += 28 + rng() * 28) {
        const xOff = side * (TRACK_W / 2 + 12 + rng() * 10);
        const h = 2.5 + rng() * 5.5;
        const w = 4.5 + rng() * 6;
        const d = 2.5 + rng() * 4;
        ms.push({ x: xOff, z, h, w, d });
      }
    });
    return ms;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunkId]);

  return (
    <>
      {mesas.map((m, i) => (
        <group key={i} position={[m.x, 0, chunkZ + m.z]}>
          {/* Mesa body — vertical sandstone walls */}
          <mesh position={[0, m.h / 2, 0]} castShadow>
            <boxGeometry args={[m.w, m.h, m.d]} />
            <meshStandardMaterial color="#a85830" roughness={0.95} />
          </mesh>
          {/* Flat top cap, slightly wider with lighter colour */}
          <mesh position={[0, m.h + 0.18, 0]}>
            <boxGeometry args={[m.w + 0.5, 0.35, m.d + 0.5]} />
            <meshStandardMaterial color="#c86838" roughness={0.88} />
          </mesh>
          {/* Rock debris at base */}
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

// ── Main ──────────────────────────────────────────────────────────────────────
interface DesertTrackChunkProps {
  chunkId:  number;
  groupRef: React.RefCallback<THREE.Group>;
}

export const DesertTrackChunk: React.FC<DesertTrackChunkProps> = ({ chunkId, groupRef }) => {
  // Decorations — denser (5+7r spacing, 85% spawn)
  const decorations = useMemo(() => {
    const rng = seededRng(chunkId * 4391 + 53);
    const decs: Array<{
      path: string; x: number; z: number;
      rotation: [number, number, number]; scale: number;
    }> = [];

    const DECO_PATHS = [
      DAE_MODELS.DESERT_PLANT_A,
      DAE_MODELS.DESERT_PLANT_B,
      DAE_MODELS.DESERT_ROCKS_A,
      DAE_MODELS.DESERT_ROCKS_B,
      DAE_MODELS.DESERT_ROCKS_B,  // extra weight for rocks
    ];

    for (let z = 5; z < CHUNK_LENGTH - 5; z += 5 + rng() * 7) {
      [-1, 1].forEach(side => {
        if (rng() < 0.85) {
          const path  = DECO_PATHS[Math.floor(rng() * DECO_PATHS.length)];
          const scale = 0.8 + rng() * 1.0;
          const rotY  = rng() * Math.PI * 2;
          const xOff  = TRACK_W / 2 + 1.0 + rng() * 3.5;
          decs.push({ path, x: side * xOff, z, rotation: [0, rotY, 0], scale });
        }
      });
    }
    return decs;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunkId]);

  // High rock formations — denser feature spacing (18+12r)
  const features = useMemo(() => {
    const rng = seededRng(chunkId * 7919 + 11);
    const fs: Array<{ path: string; x: number; z: number; scale: number }> = [];
    for (let z = 15; z < CHUNK_LENGTH - 15; z += 18 + rng() * 12) {
      [-1, 1].forEach(side => {
        if (rng() < 0.65) {
          const path  = rng() < 0.5 ? DAE_MODELS.DESERT_TILE_HIGH : DAE_MODELS.DESERT_DETAIL;
          const xOff  = TRACK_W / 2 + 2.5 + rng() * 2;
          const scale = 1.0 + rng() * 0.8;
          fs.push({ path, x: side * xOff, z, scale });
        }
      });
    }
    return fs;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunkId]);

  return (
    <group ref={groupRef}>
      <DesertGround chunkZ={-CHUNK_LENGTH / 2} />
      <DesertRails  chunkZ={-CHUNK_LENGTH / 2} />
      <SandDunes    chunkId={chunkId} chunkZ={-CHUNK_LENGTH / 2} />
      <DesertMesas  chunkId={chunkId} chunkZ={-CHUNK_LENGTH / 2} />

      {decorations.map((d, i) => (
        <DaeModel
          key={`d${i}`}
          path={d.path}
          position={[d.x, 0, d.z - CHUNK_LENGTH / 2]}
          rotation={d.rotation}
          scale={d.scale}
        />
      ))}

      {features.map((f, i) => (
        <DaeModel
          key={`f${i}`}
          path={f.path}
          position={[f.x, 0, f.z - CHUNK_LENGTH / 2]}
          scale={f.scale}
        />
      ))}
    </group>
  );
};
