import React from 'react';

const LANE_WIDTH = 2.5;

interface TrainProps {
  lane: number;
  z: number;
  isMoving: boolean;
  speedMultiplier: number; // For moving trains
}

export const Train: React.FC<TrainProps> = ({ lane, z, isMoving: _isMoving, speedMultiplier: _speedMultiplier }) => {
   return (
      <group position={[lane * LANE_WIDTH, 2, z]}>
         {/* Train Body */}
         <mesh castShadow receiveShadow>
             <boxGeometry args={[2.2, 4, 15]} />
             <meshStandardMaterial color="#ff4000" roughness={0.5} metalness={0.2} />
         </mesh>
         {/* Front Window */}
         <mesh position={[0, 0.5, 7.51]}>
             <planeGeometry args={[1.8, 1.2]} />
             <meshStandardMaterial color="#111" />
         </mesh>
         {/* Wheels */}
         <mesh position={[-1, -1.8, 5]}>
             <cylinderGeometry args={[0.3, 0.3, 0.5]} />
             <meshStandardMaterial color="#222" />
         </mesh>
         <mesh position={[1, -1.8, 5]}>
             <cylinderGeometry args={[0.3, 0.3, 0.5]} />
             <meshStandardMaterial color="#222" />
         </mesh>
      </group>
   );
};

export const LowBarrier: React.FC<{ lane: number, z: number }> = ({ lane, z }) => (
    <mesh position={[lane * LANE_WIDTH, 0.5, z]} castShadow>
       <boxGeometry args={[2.4, 1, 0.5]} />
       <meshStandardMaterial color="#eab308" />
       <mesh position={[0, 0, 0.26]}>
           <planeGeometry args={[2.4, 1]} />
           <meshBasicMaterial color="#000" wireframe />
       </mesh>
    </mesh>
);

export const HighBarrier: React.FC<{ lane: number, z: number }> = ({ lane, z }) => (
    <group position={[lane * LANE_WIDTH, 0, z]}>
       {/* Left Post */}
       <mesh position={[-1.1, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 3]} />
          <meshStandardMaterial color="#555" />
       </mesh>
       {/* Right Post */}
       <mesh position={[1.1, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 3]} />
          <meshStandardMaterial color="#555" />
       </mesh>
       {/* Top Bar (Must roll under) */}
       <mesh position={[0, 2.5, 0]} castShadow>
          <boxGeometry args={[2.4, 0.8, 0.2]} />
          <meshStandardMaterial color="#eab308" />
       </mesh>
    </group>
);
