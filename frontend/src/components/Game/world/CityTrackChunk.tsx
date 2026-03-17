import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { CITY_MODELS } from '../../../assets';

// ── Preload all city assets once at module init ───────────────────────────────
Object.values(CITY_MODELS).forEach(path => useGLTF.preload(path));

const CHUNK_LENGTH = 100;
const LANE_WIDTH   = 2.5;
const TRACK_W      = LANE_WIDTH * 3 + 2;  // 9.5

// KayKit road tile is 2×2 units — scale to fill TRACK_W × CHUNK_LENGTH
const ROAD_SCALE_X = TRACK_W / 2;
const ROAD_SCALE_Z = CHUNK_LENGTH / 2;

const BUILDING_KEYS = [
  CITY_MODELS.BUILDING_A,
  CITY_MODELS.BUILDING_B,
  CITY_MODELS.BUILDING_C,
  CITY_MODELS.BUILDING_D,
  CITY_MODELS.BUILDING_E,
  CITY_MODELS.BUILDING_F,
] as const;

// Seeded deterministic RNG per chunk
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0;
    return (s >>> 0) / 0xffffffff;
  };
}

// ── Individual model components ───────────────────────────────────────────────

const RoadSurface: React.FC<{ chunkZ: number }> = ({ chunkZ }) => {
  const { scene } = useGLTF(CITY_MODELS.ROAD);
  const clone = useMemo(() => scene.clone(), [scene]);
  return (
    <primitive
      object={clone}
      position={[0, 0, chunkZ + CHUNK_LENGTH / 2]}
      scale={[ROAD_SCALE_X, 1, ROAD_SCALE_Z]}
    />
  );
};

const CityBuilding: React.FC<{
  path: string; position: [number, number, number];
  scaleBase?: number; scaleH?: number; flipX?: boolean;
}> = ({ path, position, scaleBase = 1, scaleH = 1, flipX = false }) => {
  const { scene } = useGLTF(path);
  const clone = useMemo(() => scene.clone(), [scene]);
  return (
    <primitive
      object={clone}
      position={position}
      scale={[flipX ? -scaleBase : scaleBase, scaleH, scaleBase]}
    />
  );
};

const CityProp: React.FC<{
  path: string; position: [number, number, number]; scale?: number; rotationY?: number;
}> = ({ path, position, scale = 1, rotationY = 0 }) => {
  const { scene } = useGLTF(path);
  const clone = useMemo(() => scene.clone(), [scene]);
  return (
    <primitive
      object={clone}
      position={position}
      scale={[scale, scale, scale]}
      rotation={[0, rotationY, 0]}
    />
  );
};

// ── Sidewalk strip (procedural — keeps seams crisp) ───────────────────────────
const Sidewalks: React.FC<{ chunkZ: number }> = ({ chunkZ }) => (
  <>
    {[-1, 1].map(side => (
      <mesh key={side}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[side * (TRACK_W / 2 + 0.75), 0.02, chunkZ + CHUNK_LENGTH / 2]}
        receiveShadow
      >
        <planeGeometry args={[1.5, CHUNK_LENGTH]} />
        <meshStandardMaterial color="#4a5568" roughness={0.95} />
      </mesh>
    ))}
  </>
);

// ── Dashed lane dividers between lanes ────────────────────────────────────────
const LaneDividers: React.FC<{ chunkZ: number }> = ({ chunkZ }) => (
  <>
    {[-1.25, 1.25].map((x, i) => (
      <group key={i}>
        {Array.from({ length: 20 }).map((_, di) => (
          <mesh key={di} position={[x, 0.01, chunkZ + di * 5 + 2.5]} receiveShadow>
            <boxGeometry args={[0.08, 0.01, 0.8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} />
          </mesh>
        ))}
      </group>
    ))}
  </>
);

// ── Manhole covers at center every 20 units ───────────────────────────────────
const Manholes: React.FC<{ chunkZ: number }> = ({ chunkZ }) => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <mesh key={i} position={[0, 0.025, chunkZ + i * 20 + 10]} receiveShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.05, 16]} />
        <meshStandardMaterial color="#555" roughness={0.8} metalness={0.4} />
      </mesh>
    ))}
  </>
);

// ── Lane rails ────────────────────────────────────────────────────────────────
const LaneRails: React.FC<{ chunkZ: number }> = ({ chunkZ }) => (
  <>
    {[-LANE_WIDTH, 0, LANE_WIDTH].map((x, i) => (
      <group key={i} position={[x, 0.05, chunkZ + CHUNK_LENGTH / 2]}>
        {[-0.5, 0.5].map(rx => (
          <mesh key={rx} position={[rx, 0, 0]} receiveShadow>
            <boxGeometry args={[0.1, 0.1, CHUNK_LENGTH]} />
            <meshStandardMaterial color="#b2bec3" metalness={0.7} roughness={0.2} />
          </mesh>
        ))}
        {Array.from({ length: 20 }).map((_, ti) => (
          <mesh key={ti} position={[0, -0.02, -CHUNK_LENGTH / 2 + ti * 5 + 2.5]} receiveShadow>
            <boxGeometry args={[1.2, 0.06, 0.3]} />
            <meshStandardMaterial color="#636e72" roughness={0.9} />
          </mesh>
        ))}
      </group>
    ))}
  </>
);

// ── Background night-city skyline (distant lit towers) ────────────────────────
type SkyBldg = { x: number; z: number; h: number; w: number; d: number; litRows: number[] };

const BackgroundSkyline: React.FC<{ chunkId: number; chunkZ: number }> = ({ chunkId, chunkZ }) => {
  const buildings = useMemo<SkyBldg[]>(() => {
    const rng = seededRng(chunkId * 11117 + 23);
    const bs: SkyBldg[] = [];
    [-1, 1].forEach(side => {
      for (let z = 0; z < CHUNK_LENGTH; z += 10 + rng() * 9) {
        const xOff  = side * (TRACK_W / 2 + 9 + rng() * 9);
        const h     = 5 + rng() * 12;
        const w     = 2.5 + rng() * 3.5;
        const d     = 1.5 + rng() * 2.5;
        const floors = Math.floor(h / 1.4);
        const litRows = Array.from({ length: floors }, (_, wi) => wi).filter(() => rng() < 0.58);
        bs.push({ x: xOff, z, h, w, d, litRows });
      }
    });
    return bs;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunkId]);

  return (
    <>
      {buildings.map((b, i) => (
        <group key={i} position={[b.x, 0, chunkZ + b.z]}>
          {/* Building body */}
          <mesh position={[0, b.h / 2, 0]}>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color="#080820" roughness={0.9} />
          </mesh>
          {/* Lit window strips on front face */}
          {b.litRows.map(row => (
            <mesh key={row} position={[0, 0.85 + row * 1.4, b.d / 2 + 0.03]}>
              <boxGeometry args={[b.w * 0.65, 0.28, 0.04]} />
              <meshStandardMaterial color="#ffe090" emissive="#ffe090" emissiveIntensity={1.6} />
            </mesh>
          ))}
          {/* Rooftop antenna / water tower accent */}
          {b.h > 10 && (
            <mesh position={[0, b.h + 0.4, 0]}>
              <boxGeometry args={[0.12, 0.8, 0.12]} />
              <meshStandardMaterial color="#cc4400" emissive="#ff2200" emissiveIntensity={1.2} />
            </mesh>
          )}
        </group>
      ))}
    </>
  );
};

// ── Main CityTrackChunk ───────────────────────────────────────────────────────
interface CityTrackChunkProps {
  chunkId:  number;
  groupRef: React.RefCallback<THREE.Group>;
}

export const CityTrackChunk: React.FC<CityTrackChunkProps> = ({ chunkId, groupRef }) => {
  // Buildings — tall + varied height for better skyline
  const buildings = useMemo(() => {
    const r  = seededRng(chunkId * 3571 + 17);
    const bs: Array<{ path: string; x: number; z: number; scaleBase: number; scaleH: number; flip: boolean }> = [];
    let zCursor = 4;
    while (zCursor < CHUNK_LENGTH - 6) {
      const idx      = Math.floor(r() * BUILDING_KEYS.length);
      const idx2     = Math.floor(r() * BUILDING_KEYS.length);
      const scaleBase  = 0.9 + r() * 0.5;
      const scaleH     = 1.8 + r() * 2.5;
      const scaleBase2 = 0.9 + r() * 0.5;
      const scaleH2    = 1.8 + r() * 2.5;
      const gap        = 2 + r() * 5;
      bs.push({ path: BUILDING_KEYS[idx],  x: -(TRACK_W / 2 + 3.5), z: zCursor, scaleBase,  scaleH,  flip: false });
      bs.push({ path: BUILDING_KEYS[idx2], x:  (TRACK_W / 2 + 3.5), z: zCursor, scaleBase: scaleBase2, scaleH: scaleH2, flip: true });
      zCursor += 4 + gap;
    }
    return bs;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunkId]);

  // Street props — denser + ambient sidewalk parked cars
  const props = useMemo(() => {
    const r = seededRng(chunkId * 6571 + 99);
    const ps: Array<{ path: string; x: number; z: number; scale: number; rotationY?: number }> = [];

    // Street-edge props — denser (6+4r instead of 9+6r)
    for (let z = 6; z < CHUNK_LENGTH - 4; z += 6 + r() * 4) {
      const side  = r() > 0.5 ? 1 : -1;
      const roll  = r();
      let path: string;
      let scale   = 1;
      if (roll < 0.35)      { path = CITY_MODELS.STREETLIGHT;  scale = 1.0; }
      else if (roll < 0.55) { path = CITY_MODELS.TRAFFICLIGHT; scale = 1.0; }
      else if (roll < 0.70) { path = CITY_MODELS.BENCH;        scale = 1.0; }
      else if (roll < 0.82) { path = CITY_MODELS.BUSH;         scale = 1.2; }
      else if (roll < 0.91) { path = CITY_MODELS.FIREHYDRANT;  scale = 1.0; }
      else                   { path = CITY_MODELS.WATERTOWER;  scale = 0.8; }
      ps.push({ path, x: side * (TRACK_W / 2 + 0.7), z, scale });
    }

    // Ambient parked cars on sidewalk — visual only, every ~30 units per side
    const carRng = seededRng(chunkId * 9973 + 41);
    for (let z = 15; z < CHUNK_LENGTH - 10; z += 28 + carRng() * 14) {
      [-1, 1].forEach(side => {
        if (carRng() < 0.65) {
          ps.push({
            path: CITY_MODELS.CAR_SEDAN,
            x: side * (TRACK_W / 2 + 1.5),
            z: z + carRng() * 6,
            scale: 1.4,
            rotationY: side > 0 ? 0 : Math.PI,
          });
        }
      });
    }

    return ps;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunkId]);

  return (
    <group ref={groupRef}>
      {/* Ground road surface */}
      <RoadSurface chunkZ={-CHUNK_LENGTH / 2} />

      {/* Sidewalks */}
      <Sidewalks chunkZ={-CHUNK_LENGTH / 2} />

      {/* Dashed lane dividers */}
      <LaneDividers chunkZ={-CHUNK_LENGTH / 2} />

      {/* Manhole covers */}
      <Manholes chunkZ={-CHUNK_LENGTH / 2} />

      {/* Lane rails */}
      <LaneRails chunkZ={-CHUNK_LENGTH / 2} />

      {/* Background skyline — distant lit towers */}
      <BackgroundSkyline chunkId={chunkId} chunkZ={-CHUNK_LENGTH / 2} />

      {/* Near-side buildings (KayKit GLTF) */}
      {buildings.map((b, i) => (
        <CityBuilding
          key={i}
          path={b.path}
          position={[b.x, 0, b.z - CHUNK_LENGTH / 2]}
          scaleBase={b.scaleBase}
          scaleH={b.scaleH}
          flipX={b.flip}
        />
      ))}

      {/* Street props + ambient sidewalk cars */}
      {props.map((p, i) => (
        <CityProp
          key={i}
          path={p.path}
          position={[p.x, 0, p.z - CHUNK_LENGTH / 2]}
          scale={p.scale}
          rotationY={p.rotationY ?? 0}
        />
      ))}
    </group>
  );
};
