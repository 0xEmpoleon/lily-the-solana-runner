import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { CITY_MODELS } from '../../../assets';

// ── Preload all obstacle GLTFs ─────────────────────────────────────────────
useGLTF.preload(CITY_MODELS.BENCH);
useGLTF.preload(CITY_MODELS.FIREHYDRANT);
useGLTF.preload(CITY_MODELS.TRAFFICLIGHT);
useGLTF.preload(CITY_MODELS.WATERTOWER);
useGLTF.preload(CITY_MODELS.DUMPSTER);
useGLTF.preload(CITY_MODELS.BOX_A);
useGLTF.preload(CITY_MODELS.BOX_B);
useGLTF.preload(CITY_MODELS.CAR_TAXI);
useGLTF.preload(CITY_MODELS.CAR_SEDAN);

const LANE_WIDTH = 2.5;

// ── Easy jump obstacles ───────────────────────────────────────────────────────

export const FireHydrant: React.FC<{ lane: number; z: number }> = ({ lane, z }) => {
  const { scene } = useGLTF(CITY_MODELS.FIREHYDRANT);
  const clone = useMemo(() => scene.clone(), [scene]);
  return (
    <primitive
      object={clone}
      position={[lane * LANE_WIDTH, 0, z]}
      scale={[7.0, 7.0, 7.0]}
    />
  );
};

export const BenchObstacle: React.FC<{ lane: number; z: number }> = ({ lane, z }) => {
  const { scene } = useGLTF(CITY_MODELS.BENCH);
  const clone = useMemo(() => scene.clone(), [scene]);
  return (
    <primitive
      object={clone}
      position={[lane * LANE_WIDTH, 0, z]}
      scale={[6.5, 6.5, 6.5]}
    />
  );
};

// ── Medium jump obstacles ─────────────────────────────────────────────────────

export const DumpsterBarrier: React.FC<{ lane: number; z: number }> = ({ lane, z }) => {
  const { scene } = useGLTF(CITY_MODELS.DUMPSTER);
  const clone = useMemo(() => scene.clone(), [scene]);
  return (
    <primitive
      object={clone}
      position={[lane * LANE_WIDTH, 0, z]}
      scale={[5.5, 5.5, 5.5]}
    />
  );
};

export const BoxStack: React.FC<{ lane: number; z: number }> = ({ lane, z }) => {
  const { scene: sA } = useGLTF(CITY_MODELS.BOX_A);
  const { scene: sB } = useGLTF(CITY_MODELS.BOX_B);
  const cloneA = useMemo(() => sA.clone(), [sA]);
  const cloneB = useMemo(() => sB.clone(), [sB]);
  return (
    <group position={[lane * LANE_WIDTH, 0, z]}>
      <primitive object={cloneA} scale={[5.0, 5.0, 5.0]} position={[0, 0, 0]} />
      <primitive object={cloneB} scale={[4.0, 4.0, 4.0]} position={[0, 5.0, 0]} />
    </group>
  );
};

// ── Car obstacles ─────────────────────────────────────────────────────────────

export const ParkedCar: React.FC<{ lane: number; z: number; variant?: 'taxi' | 'sedan' }> = ({
  lane, z, variant = 'taxi',
}) => {
  const path = variant === 'taxi' ? CITY_MODELS.CAR_TAXI : CITY_MODELS.CAR_SEDAN;
  const { scene } = useGLTF(path);
  const clone = useMemo(() => scene.clone(), [scene]);
  return (
    <primitive
      object={clone}
      position={[lane * LANE_WIDTH, 0, z]}
      scale={[5.0, 5.0, 5.0]}
      rotation={[0, Math.PI, 0]}
    />
  );
};

// MovingCar — oncoming traffic, front faces the player (native +Z orientation).
// Jumpable with good timing — clearance handled in ObstacleManager.
export const MovingCar: React.FC<{ lane: number; z: number }> = ({ lane, z }) => {
  const { scene } = useGLTF(CITY_MODELS.CAR_TAXI);
  const clone = useMemo(() => scene.clone(), [scene]);
  return (
    <primitive
      object={clone}
      position={[lane * LANE_WIDTH, 0, z]}
      scale={[5.0, 5.0, 5.0]}
      rotation={[0, 0, 0]}
    />
  );
};

// ── Duck obstacle ─────────────────────────────────────────────────────────────

// TrafficGate — two traffic lights flanking the lane with a connecting arch bar overhead.
// Player must roll/slide under (pHit.height < 1.5).
export const TrafficGate: React.FC<{ lane: number; z: number }> = ({ lane, z }) => {
  const { scene } = useGLTF(CITY_MODELS.TRAFFICLIGHT);
  const cloneL = useMemo(() => scene.clone(), [scene]);
  const cloneR = useMemo(() => scene.clone(), [scene]);
  return (
    <group position={[lane * LANE_WIDTH, 0, z]}>
      <primitive object={cloneL} position={[-1.0, 0, 0]} scale={[2.2, 2.2, 2.2]} />
      <primitive object={cloneR} position={[ 1.0, 0, 0]} scale={[2.2, 2.2, 2.2]} />
      {/* Arch bar connecting the two posts */}
      <mesh position={[0, 3.2, 0]} castShadow>
        <boxGeometry args={[2.4, 0.18, 0.18]} />
        <meshStandardMaterial color="#eab308" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Warning lights */}
      {[-0.7, 0, 0.7].map((x) => (
        <mesh key={x} position={[x, 3.45, 0]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2.5} />
        </mesh>
      ))}
    </group>
  );
};

// ── Lane-switch-only obstacle ─────────────────────────────────────────────────

// WaterTowerBlock — tall blocker, no jump clearance. Player must switch to another lane.
export const WaterTowerBlock: React.FC<{ lane: number; z: number }> = ({ lane, z }) => {
  const { scene } = useGLTF(CITY_MODELS.WATERTOWER);
  const clone = useMemo(() => scene.clone(), [scene]);
  return (
    <primitive
      object={clone}
      position={[lane * LANE_WIDTH, 0, z]}
      scale={[4.5, 4.5, 4.5]}
    />
  );
};
