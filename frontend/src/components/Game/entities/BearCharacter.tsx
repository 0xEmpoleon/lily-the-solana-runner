import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BearCharacterProps {
  playerState: 'RUN' | 'JUMP' | 'ROLL' | 'STUMBLE';
}

const BearCharacter: React.FC<BearCharacterProps> = ({ playerState }) => {
  const groupRef   = useRef<THREE.Group>(null);
  const bodyRef    = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef= useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef= useRef<THREE.Group>(null);

  const fur   = '#8B5E3C';
  const belly = '#C49A6C';
  const nose  = '#3D2B1F';
  const ear   = '#7A4F2D';
  const suit  = '#1e3a5f';
  const accent= '#f59e0b';

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!groupRef.current || !leftLegRef.current || !rightLegRef.current ||
        !leftArmRef.current || !rightArmRef.current || !bodyRef.current) return;

    if (playerState === 'RUN') {
      const spd = 14;
      leftLegRef.current.rotation.x  =  Math.sin(t * spd) * 0.5;
      rightLegRef.current.rotation.x =  Math.sin(t * spd + Math.PI) * 0.5;
      leftArmRef.current.rotation.x  =  Math.sin(t * spd + Math.PI) * 0.45;
      rightArmRef.current.rotation.x =  Math.sin(t * spd) * 0.45;
      bodyRef.current.position.y = Math.abs(Math.sin(t * spd * 2)) * 0.08;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.1);
    } else if (playerState === 'JUMP') {
      leftLegRef.current.rotation.x  = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, -0.6, 0.2);
      rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0.3, 0.2);
      leftArmRef.current.rotation.x  = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -Math.PI / 2, 0.2);
      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -Math.PI / 2, 0.2);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0.2, 0.1);
    } else if (playerState === 'ROLL') {
      groupRef.current.rotation.x += 0.3;
      leftLegRef.current.rotation.x  = -Math.PI / 2;
      rightLegRef.current.rotation.x = -Math.PI / 2;
      leftArmRef.current.rotation.x  =  Math.PI / 2;
      rightArmRef.current.rotation.x =  Math.PI / 2;
      bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, -0.4, 0.2);
    }
  });

  return (
    <group ref={groupRef} castShadow>
      <group ref={bodyRef}>
        {/* Body – chunky suit */}
        <mesh position={[0, 0.85, 0]} castShadow>
          <capsuleGeometry args={[0.45, 0.55, 12, 12]} />
          <meshStandardMaterial color={suit} roughness={0.4} metalness={0.1} />
        </mesh>
        {/* Belly patch */}
        <mesh position={[0, 0.85, 0.4]}>
          <sphereGeometry args={[0.32, 12, 12]} />
          <meshStandardMaterial color={belly} roughness={0.5} />
        </mesh>
        {/* Suit accent stripe */}
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.47, 0.47, 0.1, 16]} />
          <meshStandardMaterial color={accent} />
        </mesh>

        {/* Head */}
        <mesh position={[0, 1.55, 0]} castShadow>
          <sphereGeometry args={[0.38, 16, 16]} />
          <meshStandardMaterial color={fur} roughness={0.6} />
        </mesh>
        {/* Snout */}
        <mesh position={[0, 1.48, 0.3]}>
          <sphereGeometry args={[0.2, 12, 12]} />
          <meshStandardMaterial color={belly} roughness={0.5} />
        </mesh>
        {/* Nose */}
        <mesh position={[0, 1.53, 0.48]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color={nose} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.14, 1.63, 0.33]}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="#111" />
        </mesh>
        <mesh position={[0.14, 1.63, 0.33]}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="#111" />
        </mesh>
        {/* Eye shine */}
        <mesh position={[-0.12, 1.65, 0.37]}>
          <sphereGeometry args={[0.02]} />
          <meshBasicMaterial color="white" />
        </mesh>
        <mesh position={[0.16, 1.65, 0.37]}>
          <sphereGeometry args={[0.02]} />
          <meshBasicMaterial color="white" />
        </mesh>
        {/* Ears */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.3, 1.85, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.12, 8, 8]} />
              <meshStandardMaterial color={fur} />
            </mesh>
            <mesh position={[0, 0, 0.04]}>
              <sphereGeometry args={[0.07, 8, 8]} />
              <meshStandardMaterial color={ear} />
            </mesh>
          </group>
        ))}

        {/* Arms */}
        <group ref={leftArmRef} position={[-0.52, 1.0, 0]}>
          <mesh position={[-0.1, -0.25, 0]} castShadow>
            <capsuleGeometry args={[0.12, 0.35, 8, 8]} />
            <meshStandardMaterial color={suit} />
          </mesh>
          {/* Paw */}
          <mesh position={[-0.12, -0.55, 0]}>
            <sphereGeometry args={[0.14, 8, 8]} />
            <meshStandardMaterial color={fur} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[0.52, 1.0, 0]}>
          <mesh position={[0.1, -0.25, 0]} castShadow>
            <capsuleGeometry args={[0.12, 0.35, 8, 8]} />
            <meshStandardMaterial color={suit} />
          </mesh>
          <mesh position={[0.12, -0.55, 0]}>
            <sphereGeometry args={[0.14, 8, 8]} />
            <meshStandardMaterial color={fur} />
          </mesh>
        </group>

        {/* Badge on chest */}
        <mesh position={[0, 0.9, 0.47]}>
          <circleGeometry args={[0.1, 8]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* Legs */}
      <mesh ref={leftLegRef} position={[-0.22, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.11, 0.45]} />
        <meshStandardMaterial color={suit} />
        <mesh position={[0, -0.22, 0.08]}>
          <boxGeometry args={[0.28, 0.12, 0.35]} />
          <meshStandardMaterial color={fur} />
        </mesh>
      </mesh>
      <mesh ref={rightLegRef} position={[0.22, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.11, 0.45]} />
        <meshStandardMaterial color={suit} />
        <mesh position={[0, -0.22, 0.08]}>
          <boxGeometry args={[0.28, 0.12, 0.35]} />
          <meshStandardMaterial color={fur} />
        </mesh>
      </mesh>
    </group>
  );
};

export default BearCharacter;
