import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PENGUIN_COLORS as C } from '../../../assets';

interface SpacePenguinProps {
  playerState: 'RUN' | 'JUMP' | 'ROLL' | 'STUMBLE';
}

const SpacePenguin3D: React.FC<SpacePenguinProps> = ({ playerState }) => {
  const groupRef    = useRef<THREE.Group>(null);
  const leftLegRef  = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef  = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const bodyRef     = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!groupRef.current || !leftLegRef.current || !rightLegRef.current ||
        !leftArmRef.current || !rightArmRef.current || !bodyRef.current) return;

    if (playerState === 'RUN') {
      const s = 15;
      leftLegRef.current.rotation.x  =  Math.sin(t * s) * 0.55;
      rightLegRef.current.rotation.x =  Math.sin(t * s + Math.PI) * 0.55;
      leftArmRef.current.rotation.x  =  Math.sin(t * s + Math.PI) * 0.45;
      rightArmRef.current.rotation.x =  Math.sin(t * s) * 0.45;
      bodyRef.current.position.y     =  Math.abs(Math.sin(t * s * 2)) * 0.09;
      groupRef.current.rotation.x    =  THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.12);
    } else if (playerState === 'JUMP') {
      leftLegRef.current.rotation.x  = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, -0.5, 0.2);
      rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0.2, 0.2);
      leftArmRef.current.rotation.x  = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -Math.PI / 2, 0.2);
      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -Math.PI / 2, 0.2);
      groupRef.current.rotation.x    = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0.22, 0.12);
    } else if (playerState === 'ROLL') {
      groupRef.current.rotation.x   += 0.32;
      leftLegRef.current.rotation.x  = -Math.PI / 2;
      rightLegRef.current.rotation.x = -Math.PI / 2;
      leftArmRef.current.rotation.x  =  Math.PI / 2;
      rightArmRef.current.rotation.x =  Math.PI / 2;
      bodyRef.current.position.y     = THREE.MathUtils.lerp(bodyRef.current.position.y, -0.38, 0.2);
    }
  });

  return (
    <group ref={groupRef} rotation-y={Math.PI} castShadow>
      <group ref={bodyRef}>

        {/* ── Body – chubby suit ── */}
        <mesh position={[0, 0.68, 0]} castShadow>
          <capsuleGeometry args={[0.38, 0.42, 16, 16]} />
          <meshStandardMaterial color={C.suit} roughness={0.35} />
        </mesh>
        {/* Pink accent belt */}
        <mesh position={[0, 0.48, 0]}>
          <cylinderGeometry args={[0.40, 0.40, 0.09, 16]} />
          <meshStandardMaterial color={C.accent} roughness={0.2} />
        </mesh>
        {/* Belly patch */}
        <mesh position={[0, 0.72, 0.34]}>
          <sphereGeometry args={[0.26, 14, 14]} />
          <meshStandardMaterial color={C.belly} roughness={0.5} />
        </mesh>

        {/* ── Cute big HEAD ── */}
        <mesh position={[0, 1.44, 0]} castShadow>
          <sphereGeometry args={[0.44, 20, 20]} />
          <meshStandardMaterial color={C.head} roughness={0.4} />
        </mesh>
        {/* Big white belly-face */}
        <mesh position={[0, 1.40, 0.34]}>
          <sphereGeometry args={[0.30, 16, 16]} />
          <meshStandardMaterial color={C.belly} roughness={0.5} />
        </mesh>
        {/* Beak */}
        <mesh position={[0, 1.34, 0.50]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.10, 0.20, 8]} />
          <meshStandardMaterial color={C.beak} roughness={0.3} />
        </mesh>
        {/* BIG eyes */}
        <mesh position={[-0.18, 1.54, 0.40]}>
          <sphereGeometry args={[0.09, 14, 14]} />
          <meshBasicMaterial color={C.eye} />
        </mesh>
        <mesh position={[0.18, 1.54, 0.40]}>
          <sphereGeometry args={[0.09, 14, 14]} />
          <meshBasicMaterial color={C.eye} />
        </mesh>
        {/* Eye shine */}
        <mesh position={[-0.13, 1.59, 0.48]}>
          <sphereGeometry args={[0.034, 8, 8]} />
          <meshBasicMaterial color="white" />
        </mesh>
        <mesh position={[0.23, 1.59, 0.48]}>
          <sphereGeometry args={[0.034, 8, 8]} />
          <meshBasicMaterial color="white" />
        </mesh>
        {/* Blush marks */}
        <mesh position={[-0.33, 1.40, 0.37]}>
          <sphereGeometry args={[0.075, 10, 10]} />
          <meshBasicMaterial color={C.blush} />
        </mesh>
        <mesh position={[0.33, 1.40, 0.37]}>
          <sphereGeometry args={[0.075, 10, 10]} />
          <meshBasicMaterial color={C.blush} />
        </mesh>

        {/* ── Glass helmet ── (bigger to cover bigger head) */}
        <mesh position={[0, 1.44, 0]}>
          <sphereGeometry args={[0.58, 18, 18]} />
          <meshPhysicalMaterial
            color={C.helmet}
            transparent transmission={0.92}
            opacity={0.45} metalness={0.1}
            roughness={0.05} ior={1.5} thickness={0.08}
          />
        </mesh>

        {/* ── Arms (flippers) ── */}
        <group ref={leftArmRef} position={[-0.44, 0.96, 0]}>
          <mesh position={[-0.10, -0.28, 0]} castShadow>
            <capsuleGeometry args={[0.10, 0.36, 8, 8]} />
            <meshStandardMaterial color={C.suit} />
          </mesh>
          <mesh position={[-0.12, -0.55, 0]}>
            <sphereGeometry args={[0.13, 8, 8]} />
            <meshStandardMaterial color={C.accent} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[0.44, 0.96, 0]}>
          <mesh position={[0.10, -0.28, 0]} castShadow>
            <capsuleGeometry args={[0.10, 0.36, 8, 8]} />
            <meshStandardMaterial color={C.suit} />
          </mesh>
          <mesh position={[0.12, -0.55, 0]}>
            <sphereGeometry args={[0.13, 8, 8]} />
            <meshStandardMaterial color={C.accent} />
          </mesh>
        </group>

        {/* Jetpack */}
        <group position={[0, 0.84, -0.40]}>
          {[-0.14, 0.14].map((x, i) => (
            <mesh key={i} position={[x, 0, 0]}>
              <cylinderGeometry args={[0.09, 0.09, 0.38]} />
              <meshStandardMaterial color={C.jetpack} emissive={C.jetpack} emissiveIntensity={0.4} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ── Stubby legs ── */}
      <mesh ref={leftLegRef} position={[-0.18, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.09, 0.38]} />
        <meshStandardMaterial color={C.suit} />
        <mesh position={[0, -0.20, 0.06]}>
          <boxGeometry args={[0.24, 0.09, 0.28]} />
          <meshStandardMaterial color={C.accent} />
        </mesh>
      </mesh>
      <mesh ref={rightLegRef} position={[0.18, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.09, 0.38]} />
        <meshStandardMaterial color={C.suit} />
        <mesh position={[0, -0.20, 0.06]}>
          <boxGeometry args={[0.24, 0.09, 0.28]} />
          <meshStandardMaterial color={C.accent} />
        </mesh>
      </mesh>
    </group>
  );
};

export default SpacePenguin3D;
