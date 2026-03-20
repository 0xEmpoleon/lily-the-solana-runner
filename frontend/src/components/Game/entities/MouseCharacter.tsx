import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MOUSE_COLORS as C } from '../../../assets';

interface MouseCharacterProps {
  playerState: 'RUN' | 'JUMP' | 'ROLL' | 'STUMBLE';
}

const MouseCharacter: React.FC<MouseCharacterProps> = ({ playerState }) => {
  const groupRef    = useRef<THREE.Group>(null);
  const bodyRef     = useRef<THREE.Group>(null);
  const leftLegRef  = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef  = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const tailRef     = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!groupRef.current || !leftLegRef.current || !rightLegRef.current ||
        !leftArmRef.current || !rightArmRef.current || !bodyRef.current) return;

    if (playerState === 'RUN') {
      const s = 16; // mice are fast!
      leftLegRef.current.rotation.x  =  Math.sin(t * s) * 0.6;
      rightLegRef.current.rotation.x =  Math.sin(t * s + Math.PI) * 0.6;
      leftArmRef.current.rotation.x  =  Math.sin(t * s + Math.PI) * 0.45;
      rightArmRef.current.rotation.x =  Math.sin(t * s) * 0.45;
      bodyRef.current.position.y     =  Math.abs(Math.sin(t * s * 2)) * 0.1;
      groupRef.current.rotation.x    =  THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.12);
      // Tail wag
      if (tailRef.current) {
        tailRef.current.rotation.y = Math.sin(t * s * 0.8) * 0.4;
      }
    } else if (playerState === 'JUMP') {
      leftLegRef.current.rotation.x  = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, -0.6, 0.2);
      rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0.3, 0.2);
      leftArmRef.current.rotation.x  = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -Math.PI / 2, 0.2);
      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -Math.PI / 2, 0.2);
      groupRef.current.rotation.x    = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0.22, 0.12);
    } else if (playerState === 'ROLL') {
      groupRef.current.rotation.x   += 0.35;
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

        {/* Body - small and sleek */}
        <mesh position={[0, 0.65, 0]} castShadow>
          <capsuleGeometry args={[0.32, 0.40, 14, 14]} />
          <meshStandardMaterial color={C.suit} roughness={0.4} metalness={0.1} />
        </mesh>
        {/* Belly */}
        <mesh position={[0, 0.67, 0.30]}>
          <sphereGeometry args={[0.24, 14, 14]} />
          <meshStandardMaterial color={C.belly} roughness={0.5} />
        </mesh>
        {/* Belt accent */}
        <mesh position={[0, 0.47, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 0.08, 16]} />
          <meshStandardMaterial color={C.accent} roughness={0.2} />
        </mesh>

        {/* Big cute head */}
        <mesh position={[0, 1.38, 0]} castShadow>
          <sphereGeometry args={[0.44, 20, 20]} />
          <meshStandardMaterial color={C.fur} roughness={0.6} />
        </mesh>
        {/* Snout */}
        <mesh position={[0, 1.28, 0.34]}>
          <sphereGeometry args={[0.18, 14, 14]} />
          <meshStandardMaterial color={C.belly} roughness={0.5} />
        </mesh>
        {/* Nose - pink */}
        <mesh position={[0, 1.34, 0.50]}>
          <sphereGeometry args={[0.06, 10, 10]} />
          <meshStandardMaterial color={C.nose} roughness={0.3} />
        </mesh>
        {/* Whiskers - left */}
        <mesh position={[-0.22, 1.30, 0.38]} rotation={[0, 0.3, 0.1]}>
          <cylinderGeometry args={[0.005, 0.005, 0.25]} />
          <meshBasicMaterial color={C.whisker} />
        </mesh>
        <mesh position={[-0.22, 1.26, 0.38]} rotation={[0, 0.3, -0.1]}>
          <cylinderGeometry args={[0.005, 0.005, 0.25]} />
          <meshBasicMaterial color={C.whisker} />
        </mesh>
        {/* Whiskers - right */}
        <mesh position={[0.22, 1.30, 0.38]} rotation={[0, -0.3, -0.1]}>
          <cylinderGeometry args={[0.005, 0.005, 0.25]} />
          <meshBasicMaterial color={C.whisker} />
        </mesh>
        <mesh position={[0.22, 1.26, 0.38]} rotation={[0, -0.3, 0.1]}>
          <cylinderGeometry args={[0.005, 0.005, 0.25]} />
          <meshBasicMaterial color={C.whisker} />
        </mesh>

        {/* Big round eyes */}
        <mesh position={[-0.18, 1.50, 0.36]}>
          <sphereGeometry args={[0.10, 14, 14]} />
          <meshBasicMaterial color={C.eye} />
        </mesh>
        <mesh position={[0.18, 1.50, 0.36]}>
          <sphereGeometry args={[0.10, 14, 14]} />
          <meshBasicMaterial color={C.eye} />
        </mesh>
        {/* Eye shines */}
        <mesh position={[-0.14, 1.55, 0.44]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="white" />
        </mesh>
        <mesh position={[0.22, 1.55, 0.44]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="white" />
        </mesh>
        {/* Blush */}
        <mesh position={[-0.34, 1.38, 0.28]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshBasicMaterial color={C.blush} />
        </mesh>
        <mesh position={[0.34, 1.38, 0.28]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshBasicMaterial color={C.blush} />
        </mesh>

        {/* Big round ears */}
        {([-1, 1] as const).map((side) => (
          <group key={side} position={[side * 0.34, 1.78, -0.05]}>
            <mesh castShadow>
              <sphereGeometry args={[0.22, 14, 14]} />
              <meshStandardMaterial color={C.fur} roughness={0.6} />
            </mesh>
            {/* Inner ear */}
            <mesh position={[0, 0, 0.10]}>
              <sphereGeometry args={[0.14, 12, 12]} />
              <meshStandardMaterial color={C.innerEar} roughness={0.5} />
            </mesh>
          </group>
        ))}

        {/* Solana chest badge */}
        <mesh position={[0, 0.78, 0.35]}>
          <circleGeometry args={[0.08, 10]} />
          <meshStandardMaterial color={C.accent} emissive={C.accent} emissiveIntensity={0.8} />
        </mesh>

        {/* Arms */}
        <group ref={leftArmRef} position={[-0.42, 0.88, 0]}>
          <mesh position={[-0.08, -0.22, 0]} castShadow>
            <capsuleGeometry args={[0.09, 0.28, 8, 8]} />
            <meshStandardMaterial color={C.suit} />
          </mesh>
          <mesh position={[-0.10, -0.44, 0]}>
            <sphereGeometry args={[0.11, 10, 10]} />
            <meshStandardMaterial color={C.paw} roughness={0.5} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[0.42, 0.88, 0]}>
          <mesh position={[0.08, -0.22, 0]} castShadow>
            <capsuleGeometry args={[0.09, 0.28, 8, 8]} />
            <meshStandardMaterial color={C.suit} />
          </mesh>
          <mesh position={[0.10, -0.44, 0]}>
            <sphereGeometry args={[0.11, 10, 10]} />
            <meshStandardMaterial color={C.paw} roughness={0.5} />
          </mesh>
        </group>

        {/* Tail */}
        <mesh ref={tailRef} position={[0, 0.55, -0.35]} rotation={[-0.6, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.015, 0.55, 8]} />
          <meshStandardMaterial color={C.tail} roughness={0.5} />
        </mesh>
      </group>

      {/* Legs */}
      <mesh ref={leftLegRef} position={[-0.16, 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.08, 0.36]} />
        <meshStandardMaterial color={C.suit} />
        <mesh position={[0, -0.20, 0.07]}>
          <boxGeometry args={[0.20, 0.09, 0.28]} />
          <meshStandardMaterial color={C.paw} roughness={0.5} />
        </mesh>
      </mesh>
      <mesh ref={rightLegRef} position={[0.16, 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.08, 0.36]} />
        <meshStandardMaterial color={C.suit} />
        <mesh position={[0, -0.20, 0.07]}>
          <boxGeometry args={[0.20, 0.09, 0.28]} />
          <meshStandardMaterial color={C.paw} roughness={0.5} />
        </mesh>
      </mesh>
    </group>
  );
};

export default MouseCharacter;
