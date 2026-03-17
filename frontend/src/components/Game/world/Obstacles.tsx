import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const LANE_WIDTH = 2.5;

interface TrainProps {
  lane: number;
  z: number;
}

export const Train: React.FC<TrainProps> = ({ lane, z }) => (
  <group position={[lane * LANE_WIDTH, 2, z]}>
    {/* Body */}
    <mesh castShadow receiveShadow>
      <boxGeometry args={[2.2, 4, 15]} />
      <meshStandardMaterial color="#ff4000" roughness={0.5} metalness={0.3} />
    </mesh>
    {/* Front window */}
    <mesh position={[0, 0.5, 7.51]}>
      <planeGeometry args={[1.8, 1.2]} />
      <meshStandardMaterial color="#88ccff" emissive="#224466" emissiveIntensity={0.5} />
    </mesh>
    {/* Side stripe */}
    <mesh position={[1.11, 0, 0]}>
      <planeGeometry args={[15, 0.4]} />
      <meshStandardMaterial color="#ff8800" emissive="#ff4400" emissiveIntensity={0.3} />
    </mesh>
    {/* Wheels */}
    {[-5, 0, 5].map((wz) =>
      [-1, 1].map((wx) => (
        <mesh key={`${wx}-${wz}`} position={[wx, -1.8, wz]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.4, 12]} />
          <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
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
      <meshStandardMaterial color="#eab308" roughness={0.4} metalness={0.1} />
    </mesh>
    {/* Base plate */}
    <mesh position={[0, 0.05, 0]} receiveShadow>
      <boxGeometry args={[2.6, 0.1, 0.8]} />
      <meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} />
    </mesh>
  </group>
);

export const HighBarrier: React.FC<{ lane: number; z: number }> = ({ lane, z }) => (
  <group position={[lane * LANE_WIDTH, 0, z]}>
    {/* Posts */}
    {[-1.1, 1.1].map((x) => (
      <mesh key={x} position={[x, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 3, 8]} />
        <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
      </mesh>
    ))}
    {/* Top bar */}
    <mesh position={[0, 2.5, 0]} castShadow>
      <boxGeometry args={[2.4, 0.8, 0.2]} />
      <meshStandardMaterial color="#eab308" roughness={0.4} metalness={0.1} />
    </mesh>
    {/* Warning lights */}
    {[-0.8, 0.8].map((x) => (
      <mesh key={x} position={[x, 2.8, 0.15]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
      </mesh>
    ))}
  </group>
);

const SPIKE_COUNT = 12;

// SpikeRoller – a rolling cylinder covered in spikes, must jump over
export const SpikeRoller: React.FC<{ lane: number; z: number }> = ({ lane, z }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = state.clock.elapsedTime * 4;
    }
  });

  return (
    <group position={[lane * LANE_WIDTH, 0.5, z]}>
      <group ref={groupRef}>
        {/* Roller body */}
        <mesh castShadow>
          <cylinderGeometry args={[0.5, 0.5, 2.2, 16]} />
          <meshStandardMaterial color="#333" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Spikes arranged around the cylinder */}
        {Array.from({ length: SPIKE_COUNT }).map((_, i) => {
          const angle = (i / SPIKE_COUNT) * Math.PI * 2;
          const sx = Math.cos(angle) * 0.5;
          const sy = Math.sin(angle) * 0.5;
          return (
            <mesh
              key={i}
              position={[sx * 1.0, sy * 1.0, 0]}
              rotation={[0, 0, angle]}
              castShadow
            >
              <coneGeometry args={[0.1, 0.5, 6]} />
              <meshStandardMaterial color="#cc2200" emissive="#880000" emissiveIntensity={0.4} metalness={0.7} roughness={0.2} />
            </mesh>
          );
        })}
      </group>
      {/* End caps */}
      {[-1.1, 1.1].map((x) => (
        <mesh key={x} position={[0, 0, x]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 0.1, 16]} />
          <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
};
