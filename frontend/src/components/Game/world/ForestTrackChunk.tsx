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

const DaeModel: React.FC<{
  path: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}> = ({ path, position, rotation = [0, 0, 0], scale = 1 }) => {
  const collada = useLoader(ColladaLoader, path);
  const clone   = useMemo(() => collada.scene.clone(true), [collada]);
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

const ForestGround: React.FC<{ chunkZ: number }> = ({ chunkZ }) => (
  <>
    {/* Mossy ground */}
    <mesh rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, chunkZ + CHUNK_LENGTH / 2]} receiveShadow>
      <planeGeometry args={[TRACK_W, CHUNK_LENGTH]} />
      <meshStandardMaterial color="#2d5a1b" roughness={0.98} />
    </mesh>
    {/* Forest floor flanks */}
    {[-1, 1].map(side => (
      <mesh key={side}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[side * (TRACK_W / 2 + 2.0), -0.05, chunkZ + CHUNK_LENGTH / 2]}
        receiveShadow>
        <planeGeometry args={[4, CHUNK_LENGTH]} />
        <meshStandardMaterial color="#1e4012" roughness={1} />
      </mesh>
    ))}
    {/* Moss edge strips right at track boundary */}
    {[-1, 1].map(side => (
      <mesh key={`moss-${side}`}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[side * (TRACK_W / 2), 0.01, chunkZ + CHUNK_LENGTH / 2]}
        receiveShadow>
        <planeGeometry args={[0.8, CHUNK_LENGTH]} />
        <meshStandardMaterial color="#1a3a0d" roughness={1} />
      </mesh>
    ))}
  </>
);

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
          <mesh key={ti}
            position={[0, -0.02, -CHUNK_LENGTH / 2 + ti * 5 + 2.5]} receiveShadow>
            <boxGeometry args={[1.2, 0.06, 0.3]} />
            <meshStandardMaterial color="#3d2b1a" roughness={0.95} />
          </mesh>
        ))}
      </group>
    ))}
  </>
);

// ── Fallen logs perpendicular to track ────────────────────────────────────────
interface LogData { x: number; z: number; side: number; r: number }

const FallenLogs: React.FC<{ chunkId: number; chunkZ: number }> = ({ chunkId, chunkZ }) => {
  const logs = useMemo<LogData[]>(() => {
    const rng = seededRng(chunkId * 5003 + 17);
    const ls: LogData[] = [];
    for (let z = 8; z < CHUNK_LENGTH - 8; z += 22 + rng() * 16) {
      [-1, 1].forEach(side => {
        if (rng() < 0.75) {
          ls.push({ x: side * (TRACK_W / 2 + 1.5), z: z + rng() * 8, side, r: rng() * 0.4 });
        }
      });
    }
    return ls;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunkId]);

  return (
    <>
      {logs.map((l, i) => (
        <mesh key={i}
          position={[l.x, 0.25, chunkZ + l.z]}
          rotation={[0, l.r, Math.PI / 2]}
          castShadow receiveShadow>
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
        const xOff = TRACK_W / 2 + 0.5 + rng() * 2.5;
        ms.push({ x: side * xOff, z });
      });
    }
    return ms;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunkId]);

  return (
    <>
      {mushrooms.map((m, i) => (
        <group key={i} position={[m.x, 0, chunkZ + m.z]}>
          {/* Stalk */}
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.4, 6]} />
            <meshStandardMaterial color="#c8a060" roughness={0.9} />
          </mesh>
          {/* Cap with warm glow */}
          <mesh position={[0, 0.46, 0]}>
            <cylinderGeometry args={[0.35, 0.06, 0.10, 10]} />
            <meshStandardMaterial color="#d4500a" emissive="#aa3000" emissiveIntensity={0.5} roughness={0.5} />
          </mesh>
          {/* Glow spots */}
          <mesh position={[0, 0.52, 0]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshStandardMaterial color="#ffaa00" emissive="#ff6600" emissiveIntensity={1.2} />
          </mesh>
        </group>
      ))}
    </>
  );
};

// ── Procedural tall trees: trunk + double cone canopy ─────────────────────────
type TreeData = { x: number; z: number; trunkH: number; trunkR: number; canopyR: number; col: string };

const ForestTrees: React.FC<{ chunkId: number; chunkZ: number }> = ({ chunkId, chunkZ }) => {
  const trees = useMemo<TreeData[]>(() => {
    const rng = seededRng(chunkId * 8923 + 43);
    const GREENS = ['#0f3808', '#1a5010', '#144a0c', '#0d4208', '#163c0a'];
    const ts: TreeData[] = [];
    [-1, 1].forEach(side => {
      for (let z = 2; z < CHUNK_LENGTH - 2; z += 8 + rng() * 10) {
        const xOff    = TRACK_W / 2 + 1.2 + rng() * 7.5;
        const trunkH  = 4 + rng() * 8;
        const trunkR  = 0.18 + rng() * 0.18;
        const canopyR = 1.0 + rng() * 2.0;
        const col     = GREENS[Math.floor(rng() * GREENS.length)];
        ts.push({ x: side * xOff, z, trunkH, trunkR, canopyR, col });
      }
    });
    return ts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunkId]);

  return (
    <>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, chunkZ + t.z]}>
          {/* Trunk */}
          <mesh position={[0, t.trunkH / 2, 0]} castShadow>
            <cylinderGeometry args={[t.trunkR * 0.8, t.trunkR * 1.3, t.trunkH, 6]} />
            <meshStandardMaterial color="#2a1208" roughness={0.98} />
          </mesh>
          {/* Lower canopy */}
          <mesh position={[0, t.trunkH + t.canopyR * 0.7, 0]} castShadow>
            <coneGeometry args={[t.canopyR * 1.3, t.canopyR * 2.2, 7]} />
            <meshStandardMaterial color={t.col} roughness={0.9} />
          </mesh>
          {/* Upper canopy — slightly smaller, lighter shade */}
          <mesh position={[0, t.trunkH + t.canopyR * 1.95, 0]} castShadow>
            <coneGeometry args={[t.canopyR * 0.85, t.canopyR * 1.6, 7]} />
            <meshStandardMaterial color={t.col} roughness={0.9} />
          </mesh>
        </group>
      ))}
    </>
  );
};

interface ForestTrackChunkProps {
  chunkId:  number;
  groupRef: React.RefCallback<THREE.Group>;
}

export const ForestTrackChunk: React.FC<ForestTrackChunkProps> = ({ chunkId, groupRef }) => {
  // Dense undergrowth + trees — denser (4+5r spacing)
  const decorations = useMemo(() => {
    const rng = seededRng(chunkId * 6173 + 77);
    const decs: Array<{
      path: string; x: number; z: number;
      rotation: [number, number, number]; scale: number;
    }> = [];

    const DECO_PATHS = [
      DAE_MODELS.FOREST_PLANT_A,
      DAE_MODELS.FOREST_PLANT_A,  // double weight — more trees
      DAE_MODELS.FOREST_PLANT_B,
      DAE_MODELS.FOREST_ROCKS_A,
      DAE_MODELS.FOREST_ROCKS_B,
    ];

    for (let z = 4; z < CHUNK_LENGTH - 4; z += 4 + rng() * 5) {
      [-1, 1].forEach(side => {
        if (rng() < 0.78) {
          const path  = DECO_PATHS[Math.floor(rng() * DECO_PATHS.length)];
          const scale = 0.7 + rng() * 1.2;
          const rotY  = rng() * Math.PI * 2;
          const xOff  = TRACK_W / 2 + 0.8 + rng() * 4.0;
          decs.push({ path, x: side * xOff, z, rotation: [0, rotY, 0], scale });
        }
      });
    }

    // Inner layer of tiny plants right at track edge
    const innerRng = seededRng(chunkId * 4217 + 91);
    for (let z = 3; z < CHUNK_LENGTH - 3; z += 6 + innerRng() * 6) {
      [-1, 1].forEach(side => {
        if (innerRng() < 0.55) {
          const path  = DECO_PATHS[Math.floor(innerRng() * DECO_PATHS.length)];
          const scale = 0.3 + innerRng() * 0.5;
          const xOff  = TRACK_W / 2 + 0.3 + innerRng() * 0.9;
          decs.push({ path, x: side * xOff, z, rotation: [0, innerRng() * Math.PI * 2, 0], scale });
        }
      });
    }

    return decs;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunkId]);

  // Tall trees — denser features (12+10r)
  const features = useMemo(() => {
    const rng = seededRng(chunkId * 8111 + 7);
    const fs: Array<{ path: string; x: number; z: number; scale: number; rotY: number }> = [];
    for (let z = 10; z < CHUNK_LENGTH - 10; z += 12 + rng() * 10) {
      [-1, 1].forEach(side => {
        if (rng() < 0.65) {
          const path  = rng() < 0.6 ? DAE_MODELS.FOREST_TILE_HIGH : DAE_MODELS.FOREST_DETAIL;
          const xOff  = TRACK_W / 2 + 2.0 + rng() * 3.0;
          const scale = 1.2 + rng() * 1.0;
          const rotY  = rng() * Math.PI * 2;
          fs.push({ path, x: side * xOff, z, scale, rotY });
        }
      });
    }
    return fs;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunkId]);

  return (
    <group ref={groupRef}>
      <ForestGround chunkZ={-CHUNK_LENGTH / 2} />
      <ForestRails  chunkZ={-CHUNK_LENGTH / 2} />
      <ForestTrees  chunkId={chunkId} chunkZ={-CHUNK_LENGTH / 2} />
      <FallenLogs   chunkId={chunkId} chunkZ={-CHUNK_LENGTH / 2} />
      <Mushrooms    chunkId={chunkId} chunkZ={-CHUNK_LENGTH / 2} />

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
          rotation={[0, f.rotY, 0]}
          scale={f.scale}
        />
      ))}
    </group>
  );
};
