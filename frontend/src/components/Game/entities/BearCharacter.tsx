import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BearCharacterProps {
  playerState: 'RUN' | 'JUMP' | 'ROLL' | 'STUMBLE';
}

// Cute warm color palette — soft teal suit, warm fur, pastel accents
const C = {
  fur:    '#C68642',   // warm honey brown
  belly:  '#F5E6C8',   // cream
  nose:   '#4A2C1A',   // dark brown
  ear:    '#A0622A',   // darker ear inner
  suit:   '#1B998B',   // teal
  accent: '#FFD60A',   // bright yellow
  blush:  '#FFB3C6',   // pastel pink
  paw:    '#D4956A',   // light fur paw
};

const BearCharacter: React.FC<BearCharacterProps> = ({ playerState }) => {
  const groupRef    = useRef<THREE.Group>(null);
  const bodyRef     = useRef<THREE.Group>(null);
  const leftLegRef  = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef  = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!groupRef.current || !leftLegRef.current || !rightLegRef.current ||
        !leftArmRef.current || !rightArmRef.current || !bodyRef.current) return;

    if (playerState === 'RUN') {
      const s = 14;
      leftLegRef.current.rotation.x  =  Math.sin(t * s) * 0.55;
      rightLegRef.current.rotation.x =  Math.sin(t * s + Math.PI) * 0.55;
      leftArmRef.current.rotation.x  =  Math.sin(t * s + Math.PI) * 0.42;
      rightArmRef.current.rotation.x =  Math.sin(t * s) * 0.42;
      bodyRef.current.position.y     =  Math.abs(Math.sin(t * s * 2)) * 0.09;
      groupRef.current.rotation.x    =  THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.12);
    } else if (playerState === 'JUMP') {
      leftLegRef.current.rotation.x  = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, -0.6, 0.2);
      rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0.3, 0.2);
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

        {/* ── Chubby body ── */}
        <mesh position={[0, 0.70, 0]} castShadow>
          <capsuleGeometry args={[0.40, 0.44, 14, 14]} />
          <meshStandardMaterial color={C.suit} roughness={0.45} metalness={0.08} />
        </mesh>
        {/* Belly patch */}
        <mesh position={[0, 0.72, 0.38]}>
          <sphereGeometry args={[0.30, 14, 14]} />
          <meshStandardMaterial color={C.belly} roughness={0.55} />
        </mesh>
        {/* Accent stripe */}
        <mesh position={[0, 0.50, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.09, 16]} />
          <meshStandardMaterial color={C.accent} roughness={0.2} />
        </mesh>
        {/* Chest badge */}
        <mesh position={[0, 0.82, 0.43]}>
          <circleGeometry args={[0.10, 10]} />
          <meshStandardMaterial color={C.accent} emissive={C.accent} emissiveIntensity={0.6} />
        </mesh>

        {/* ── CUTE BIG HEAD ── */}
        <mesh position={[0, 1.50, 0]} castShadow>
          <sphereGeometry args={[0.48, 20, 20]} />
          <meshStandardMaterial color={C.fur} roughness={0.65} />
        </mesh>
        {/* Snout — big round muzzle */}
        <mesh position={[0, 1.40, 0.36]}>
          <sphereGeometry args={[0.24, 14, 14]} />
          <meshStandardMaterial color={C.belly} roughness={0.55} />
        </mesh>
        {/* Nose */}
        <mesh position={[0, 1.46, 0.56]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshStandardMaterial color={C.nose} roughness={0.3} />
        </mesh>
        {/* BIG eyes */}
        <mesh position={[-0.20, 1.60, 0.40]}>
          <sphereGeometry args={[0.09, 14, 14]} />
          <meshBasicMaterial color="#0d0d1a" />
        </mesh>
        <mesh position={[0.20, 1.60, 0.40]}>
          <sphereGeometry args={[0.09, 14, 14]} />
          <meshBasicMaterial color="#0d0d1a" />
        </mesh>
        {/* Eye shines */}
        <mesh position={[-0.15, 1.65, 0.48]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color="white" />
        </mesh>
        <mesh position={[0.25, 1.65, 0.48]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color="white" />
        </mesh>
        {/* Blush marks */}
        <mesh position={[-0.38, 1.46, 0.32]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshBasicMaterial color={C.blush} />
        </mesh>
        <mesh position={[0.38, 1.46, 0.32]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshBasicMaterial color={C.blush} />
        </mesh>
        {/* Big round ears */}
        {([-1, 1] as const).map((side) => (
          <group key={side} position={[side * 0.36, 1.88, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.17, 12, 12]} />
              <meshStandardMaterial color={C.fur} roughness={0.65} />
            </mesh>
            {/* Inner ear */}
            <mesh position={[0, 0, 0.08]}>
              <sphereGeometry args={[0.10, 10, 10]} />
              <meshStandardMaterial color={C.ear} roughness={0.6} />
            </mesh>
            {/* Ear blush */}
            <mesh position={[0, 0, 0.14]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshBasicMaterial color={C.blush} />
            </mesh>
          </group>
        ))}

        {/* ── Arms ── */}
        <group ref={leftArmRef} position={[-0.50, 0.98, 0]}>
          <mesh position={[-0.10, -0.26, 0]} castShadow>
            <capsuleGeometry args={[0.12, 0.32, 8, 8]} />
            <meshStandardMaterial color={C.suit} />
          </mesh>
          {/* Paw */}
          <mesh position={[-0.13, -0.52, 0]}>
            <sphereGeometry args={[0.15, 10, 10]} />
            <meshStandardMaterial color={C.paw} roughness={0.6} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[0.50, 0.98, 0]}>
          <mesh position={[0.10, -0.26, 0]} castShadow>
            <capsuleGeometry args={[0.12, 0.32, 8, 8]} />
            <meshStandardMaterial color={C.suit} />
          </mesh>
          <mesh position={[0.13, -0.52, 0]}>
            <sphereGeometry args={[0.15, 10, 10]} />
            <meshStandardMaterial color={C.paw} roughness={0.6} />
          </mesh>
        </group>
      </group>

      {/* ── Stubby legs ── */}
      <mesh ref={leftLegRef} position={[-0.20, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.10, 0.40]} />
        <meshStandardMaterial color={C.suit} />
        <mesh position={[0, -0.22, 0.09]}>
          <boxGeometry args={[0.26, 0.11, 0.34]} />
          <meshStandardMaterial color={C.paw} roughness={0.6} />
        </mesh>
      </mesh>
      <mesh ref={rightLegRef} position={[0.20, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.10, 0.40]} />
        <meshStandardMaterial color={C.suit} />
        <mesh position={[0, -0.22, 0.09]}>
          <boxGeometry args={[0.26, 0.11, 0.34]} />
          <meshStandardMaterial color={C.paw} roughness={0.6} />
        </mesh>
      </mesh>
    </group>
  );
};

export default BearCharacter;
