import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameState } from '../store/useGameState';

interface CollectibleManagerProps {
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
}

export const CollectibleManager: React.FC<CollectibleManagerProps> = ({ playerPosRef }) => {
  const { speed, gameState, addCoin } = useGameState();
  const [coins, setCoins] = useState<{ id: number; lane: number; y: number; z: number; collected: boolean }[]>([]);
  const nextZ = useRef(-50);
  const nextId = useRef(0);
  
  const coinGeo = useRef(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16));
  const coinMat = useRef(new THREE.MeshStandardMaterial({ color: "#FFD700", metalness: 0.8, roughness: 0.2 }));

  useFrame((_state, delta) => {
    if (gameState !== 'PLAYING') return;

    // Spawn Logic (Arcs over barriers, lines on ground)
    if (nextZ.current > -200) {
       const lane = Math.floor(Math.random() * 3) - 1;
       const rand = Math.random();
       
       if (rand < 0.4) { // Increased to 40% jump arcs
           // Jump Arc
           for (let i = 0; i < 7; i++) { // Increased length
               setCoins(prev => [...prev, {
                  id: nextId.current++,
                  lane,
                  y: 1 + Math.sin((i/6) * Math.PI) * 2, // Arc up to y=3
                  z: nextZ.current - (i * 2),
                  collected: false
               }]);
           }
           nextZ.current -= 25;
       } else if (rand < 0.8) { // Increased to 40% lines
           // Line on ground
           for (let i = 0; i < 10; i++) { // Longer lines
               setCoins(prev => [...prev, {
                  id: nextId.current++,
                  lane,
                  y: 0.5,
                  z: nextZ.current - (i * 2),
                  collected: false
               }]);
           }
           nextZ.current -= 35;
       } else {
           nextZ.current -= 15; // Shorter empty gap
       }
    }

    // Move, Rotate, and Collect Logic
    setCoins(prev => {
       const pPos = playerPosRef.current;
       let pickedCoins = 0;

       const nextList = prev.map(c => {
          if (c.collected) return { ...c, z: c.z + speed * delta };

          const newZ = c.z + speed * delta;
          
          // Collision Check
          if (newZ > -0.5 && newZ < 0.5) { // In Z range
             const cX = c.lane * 2.5; 
             if (Math.abs(cX - pPos.x) < 1.0 && Math.abs(c.y - pPos.y) < 1.5) { // Hitbox check
                pickedCoins++;
                return { ...c, z: newZ, collected: true };
             }
          }
          return { ...c, z: newZ };
       });

       if (pickedCoins > 0) {
           for(let i=0; i<pickedCoins; i++) {
               addCoin(); // Zustand will handle score + coin count
           }
       }

       return nextList.filter(c => c.z < 20 && !c.collected); // Remove off-screen or collected
    });
  });

  return (
    <group>
       {coins.map(c => (
         <CoinMesh key={c.id} c={c} geo={coinGeo.current} mat={coinMat.current} />
       ))}
    </group>
  );
};

// Extracted to use its own useFrame for rotation
const CoinMesh = ({ c, geo, mat }: { c: any, geo: THREE.CylinderGeometry, mat: THREE.Material }) => {
   const ref = useRef<THREE.Mesh>(null);
   useFrame((state) => {
      if (ref.current) {
         ref.current.rotation.z = state.clock.elapsedTime * 3;
      }
   });

   return (
      <mesh 
          ref={ref}
          position={[c.lane * 2.5, c.y, c.z]} 
          rotation={[Math.PI/2, 0, 0]} 
          geometry={geo}
          material={mat}
          castShadow
       />
   );
};
