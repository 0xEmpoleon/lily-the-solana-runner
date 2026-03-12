import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SpacePenguinProps {
  playerState: 'RUN' | 'JUMP' | 'ROLL' | 'STUMBLE';
}

const SpacePenguin3D: React.FC<SpacePenguinProps> = ({ playerState }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Limbs for animation
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);

  // Colors based on requested asset
  const suitColor = "#FFFFFF";
  const accentColor = "#00FFFF";
  const penguinBody = "#1F2937";
  const penguinBelly = "#F3F4F6";
  const beakColor = "#F59E0B";

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (!groupRef.current || !leftLegRef.current || !rightLegRef.current || !leftArmRef.current || !rightArmRef.current || !bodyRef.current) return;

    // Default Running Animation
    if (playerState === 'RUN') {
      const runSpeed = 15;
      
      // Legs (running cycle)
      leftLegRef.current.rotation.x = Math.sin(time * runSpeed) * 0.5;
      rightLegRef.current.rotation.x = Math.sin(time * runSpeed + Math.PI) * 0.5;
      
      // Arms (swinging)
      leftArmRef.current.rotation.x = Math.sin(time * runSpeed + Math.PI) * 0.5;
      rightArmRef.current.rotation.x = Math.sin(time * runSpeed) * 0.5;
      
      // Body bounce
      bodyRef.current.position.y = Math.abs(Math.sin(time * runSpeed * 2)) * 0.1;
      
      // Reset group rotation
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.1);
    } 
    
    // Jumping Animation
    else if (playerState === 'JUMP') {
      leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, -0.5, 0.2);
      rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0.2, 0.2);
      
      leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -Math.PI/2, 0.2);
      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -Math.PI/2, 0.2);
      
      // Airborne tilt
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0.2, 0.1);
    }

    // Rolling Animation
    else if (playerState === 'ROLL') {
       // Spin forward fully as a ball
       groupRef.current.rotation.x += 0.3;
       
       // Tuck limbs
       leftLegRef.current.rotation.x = -Math.PI/2;
       rightLegRef.current.rotation.x = -Math.PI/2;
       leftArmRef.current.rotation.x = Math.PI/2;
       rightArmRef.current.rotation.x = Math.PI/2;
       
       // Move down to ground level
       bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, -0.4, 0.2);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} castShadow>
      <group ref={bodyRef}>
        {/* Main Body (Suit) */}
        <mesh position={[0, 0.8, 0]} castShadow>
          <capsuleGeometry args={[0.4, 0.6, 16, 16]} />
          <meshStandardMaterial color={suitColor} roughness={0.3} />
        </mesh>
        
        {/* Suit Belts/Accents */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.1, 16]} />
          <meshStandardMaterial color={accentColor} />
        </mesh>

        {/* Penguin Head */}
        <mesh position={[0, 1.4, 0]} castShadow>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color={penguinBody} />
        </mesh>

        {/* Penguin Belly on Head */}
        <mesh position={[0, 1.4, 0.25]}>
           <sphereGeometry args={[0.2, 16, 16]} />
           <meshStandardMaterial color={penguinBelly} />
        </mesh>

        {/* Beak */}
        <mesh position={[0, 1.35, 0.35]}>
          <coneGeometry args={[0.08, 0.2, 8]} />
          <meshStandardMaterial color={beakColor} />
        </mesh>
        
        {/* Eyes */}
        <mesh position={[-0.1, 1.45, 0.32]}>
          <sphereGeometry args={[0.04]} />
          <meshBasicMaterial color="black" />
        </mesh>
        <mesh position={[0.1, 1.45, 0.32]}>
          <sphereGeometry args={[0.04]} />
          <meshBasicMaterial color="black" />
        </mesh>

        {/* Glass Helmet */}
        <mesh position={[0, 1.4, 0]} castShadow>
          <sphereGeometry args={[0.45, 16, 16]} />
          <meshPhysicalMaterial 
            color="#E0FFFF" 
            transparent
            transmission={0.9} 
            opacity={0.5} 
            metalness={0.1} 
            roughness={0.1}
            ior={1.5}
            thickness={0.1}
          />
        </mesh>

        {/* Left Arm (Flipper in suit) */}
        <group ref={leftArmRef} position={[-0.45, 1.0, 0]}>
          <mesh position={[-0.1, -0.3, 0]} castShadow>
             <capsuleGeometry args={[0.1, 0.4, 8, 8]} />
             <meshStandardMaterial color={suitColor} />
          </mesh>
          <mesh position={[-0.1, -0.6, 0]}>
             <sphereGeometry args={[0.12]} />
             <meshStandardMaterial color={accentColor} />
          </mesh>
        </group>

        {/* Right Arm (Flipper in suit) */}
        <group ref={rightArmRef} position={[0.45, 1.0, 0]}>
          <mesh position={[0.1, -0.3, 0]} castShadow>
             <capsuleGeometry args={[0.1, 0.4, 8, 8]} />
             <meshStandardMaterial color={suitColor} />
          </mesh>
          <mesh position={[0.1, -0.6, 0]}>
             <sphereGeometry args={[0.12]} />
             <meshStandardMaterial color={accentColor} />
          </mesh>
        </group>
        
        {/* Jetpack (Visual detail on back) */}
        <group position={[0, 0.9, -0.42]}>
          <mesh position={[-0.15, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.4]} />
            <meshStandardMaterial color={accentColor} />
          </mesh>
          <mesh position={[0.15, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.4]} />
            <meshStandardMaterial color={accentColor} />
          </mesh>
        </group>
      </group>

      {/* Legs (Attached directly to group to avoid body bounce causing desync with ground) */}
      <mesh ref={leftLegRef} position={[-0.2, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.1, 0.4]} />
        <meshStandardMaterial color={suitColor} />
        {/* Foot Boot */}
        <mesh position={[0, -0.2, 0.05]}>
           <boxGeometry args={[0.26, 0.1, 0.3]} />
           <meshStandardMaterial color={accentColor} />
        </mesh>
      </mesh>

      <mesh ref={rightLegRef} position={[0.2, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.1, 0.4]} />
        <meshStandardMaterial color={suitColor} />
        {/* Foot Boot */}
        <mesh position={[0, -0.2, 0.05]}>
           <boxGeometry args={[0.26, 0.1, 0.3]} />
           <meshStandardMaterial color={accentColor} />
        </mesh>
      </mesh>
      
    </group>
  );
};

export default SpacePenguin3D;
