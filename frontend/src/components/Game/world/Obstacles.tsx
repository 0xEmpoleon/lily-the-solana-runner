import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TRAIN_COLORS, BARRIER_COLORS, SPIKE_ROLLER_COLORS } from '../../../assets';

const LANE_WIDTH = 2.5;

// Shared spike geometry + material — created once, reused by every SpikeRoller instance
const spikeConeGeo = new THREE.ConeGeometry(0.1, 0.5, 6);
const spikeConeMat = new THREE.MeshStandardMaterial({
  color: SPIKE_ROLLER_COLORS.spike,
  emissive: SPIKE_ROLLER_COLORS.spikeEmissive,
  emissiveIntensity: 0.4,
  metalness: 0.7,
  roughness: 0.2,
});

interface TrainProps {
  lane: number;
  z: number;
}

export const Train: React.FC<TrainProps> = ({ lane, z }) => (
  <group position={[lane * LANE_WIDTH, 2, z]}>
    {/* Body */}
    <mesh castShadow receiveShadow>
      <boxGeometry args={[2.2, 4, 15]} />
      <meshStandardMaterial color={TRAIN_COLORS.body} roughness={0.5} metalness={0.3} />
    </mesh>
    {/* Front window */}
    <mesh position={[0, 0.5, 7.51]}>
      <planeGeometry args={[1.8, 1.2]} />
      <meshStandardMaterial color={TRAIN_COLORS.window} emissive={TRAIN_COLORS.windowEmissive} emissiveIntensity={0.5} />
    </mesh>
    {/* Side stripe */}
    <mesh position={[1.11, 0, 0]}>
      <planeGeometry args={[15, 0.4]} />
      <meshStandardMaterial color={TRAIN_COLORS.stripe} emissive={TRAIN_COLORS.stripeEmissive} emissiveIntensity={0.3} />
    </mesh>
    {/* Wheels */}
    {[-5, 0, 5].map((wz) =>
      [-1, 1].map((wx) => (
        <mesh key={`${wx}-${wz}`} position={[wx, -1.8, wz]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.4, 12]} />
          <meshStandardMaterial color={TRAIN_COLORS.wheel} metalness={0.8} roughness={0.2} />
        </mesh>
      ))
    )}
  </group>
);

export const LowBarrier: React.FC<{ lane: number; z: number }> = ({ lane, z }) => (
  <group position={[lane * LANE_WIDTH, 0, z]}>
    {/* Main barrier body */}
    <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
      <boxGeometry args={[2.4, 1, 0.5]} />
      <meshStandardMaterial color={BARRIER_COLORS.body} roughness={0.4} metalness={0.1} />
    </mesh>
    {/* Base plate */}
    <mesh position={[0, 0.05, 0]} receiveShadow>
      <boxGeometry args={[2.6, 0.1, 0.8]} />
      <meshStandardMaterial color={BARRIER_COLORS.base} metalness={0.7} roughness={0.3} />
    </mesh>
  </group>
);

export const HighBarrier: React.FC<{ lane: number; z: number }> = ({ lane, z }) => (
  <group position={[lane * LANE_WIDTH, 0, z]}>
    {/* Posts */}
    {[-1.1, 1.1].map((x) => (
      <mesh key={x} position={[x, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 3, 8]} />
        <meshStandardMaterial color={BARRIER_COLORS.post} metalness={0.8} roughness={0.2} />
      </mesh>
    ))}
    {/* Top bar */}
    <mesh position={[0, 2.5, 0]} castShadow>
      <boxGeometry args={[2.4, 0.8, 0.2]} />
      <meshStandardMaterial color={BARRIER_COLORS.body} roughness={0.4} metalness={0.1} />
    </mesh>
    {/* Warning lights */}
    {[-0.8, 0.8].map((x) => (
      <mesh key={x} position={[x, 2.8, 0.15]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color={BARRIER_COLORS.light} emissive={BARRIER_COLORS.light} emissiveIntensity={2} />
      </mesh>
    ))}
  </group>
);

const SPIKE_COUNT = 12;

// SpikeRoller – a rolling cylinder covered in spikes, must jump over.
// All 12 spikes rendered as a single InstancedMesh (1 draw call).
export const SpikeRoller: React.FC<{ lane: number; z: number }> = ({ lane, z }) => {
  const groupRef        = useRef<THREE.Group>(null);
  const instancedRef    = useRef<THREE.InstancedMesh>(null);

  // Pre-compute the per-spike transform matrices once
  const spikeMatrices = useMemo(() => {
    const dummy = new THREE.Object3D();
    return Array.from({ length: SPIKE_COUNT }, (_, i) => {
      const angle = (i / SPIKE_COUNT) * Math.PI * 2;
      dummy.position.set(Math.cos(angle) * 0.5, Math.sin(angle) * 0.5, 0);
      dummy.rotation.set(0, 0, angle);
      dummy.updateMatrix();
      return dummy.matrix.clone();
    });
  }, []);

  useEffect(() => {
    if (!instancedRef.current) return;
    spikeMatrices.forEach((m, i) => instancedRef.current!.setMatrixAt(i, m));
    instancedRef.current.instanceMatrix.needsUpdate = true;
  }, [spikeMatrices]);

  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.x = state.clock.elapsedTime * 4;
  });

  return (
    <group position={[lane * LANE_WIDTH, 0.5, z]}>
      <group ref={groupRef}>
        {/* Roller body */}
        <mesh castShadow>
          <cylinderGeometry args={[0.5, 0.5, 2.2, 16]} />
          <meshStandardMaterial color={SPIKE_ROLLER_COLORS.roller} metalness={0.9} roughness={0.1} />
        </mesh>
        {/* All 12 spikes in one draw call */}
        <instancedMesh ref={instancedRef} args={[spikeConeGeo, spikeConeMat, SPIKE_COUNT]} castShadow />
      </group>
      {/* End caps */}
      {[-1.1, 1.1].map((x) => (
        <mesh key={x} position={[0, 0, x]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 0.1, 16]} />
          <meshStandardMaterial color={SPIKE_ROLLER_COLORS.endCap} metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
};
