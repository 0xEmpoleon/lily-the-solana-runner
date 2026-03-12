import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameState } from '../store/useGameState';
import { Train, LowBarrier, HighBarrier } from './Obstacles';

type ObstacleData = {
  id: number;
  type: 'TRAIN_STATIC' | 'TRAIN_MOVING' | 'LOW_BARRIER' | 'HIGH_BARRIER';
  lane: number; // -1, 0, 1
  z: number; // Spawn distance
  width: number;
  height: number;
  depth: number;
  isHit: boolean;
};

interface ObstacleManagerProps {
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
  playerHitboxRef: React.MutableRefObject<{ y: number, height: number }>;
  onStumble: () => void;
  onCrash: () => void;
}

export const ObstacleManager: React.FC<ObstacleManagerProps> = ({ playerPosRef, playerHitboxRef, onStumble, onCrash }) => {
  const { speed, gameState } = useGameState();
  const [obstacles, setObstacles] = useState<ObstacleData[]>([]);
  const nextZ = useRef(-100);
  const nextId = useRef(0);

  // Spawn Logic
  useFrame((_state, delta) => {
    if (gameState !== 'PLAYING') return;

    // Spawn new obstacles ahead
    // Moving tracks backwards + speed*delta
    if (nextZ.current > -300) { // Keep buffer full
       const lane = Math.floor(Math.random() * 3) - 1;
       const rand = Math.random();
       let type: ObstacleData['type'] = 'TRAIN_STATIC';
       let width = 2.2, height = 4, depth = 15;

       if (rand < 0.45) { // 45% chance for low barriers (increased)
           type = 'LOW_BARRIER';
           height = 1; depth = 0.5;
       } else if (rand < 0.70) { // 25% chance for high barriers (increased)
           type = 'HIGH_BARRIER';
           height = 3; depth = 0.2; 
       } else if (rand < 0.85) { // 15% chance for moving trains
           type = 'TRAIN_MOVING';
       } // 15% chance for static trains

       setObstacles(prev => [...prev, {
          id: nextId.current++,
          type,
          lane,
          z: nextZ.current,
          width, height, depth,
          isHit: false
       }]);

       // Reduced gap for higher density
       nextZ.current -= (Math.random() * 20 + 20); 
    }

    // Move logic & Collision
    setObstacles(prev => {
       const pPos = playerPosRef.current;
       const pHitbox = playerHitboxRef.current;
       let hasCrashed = false;

       const nextList = prev.map(obs => {
          let moveSpeed = speed;
          if (obs.type === 'TRAIN_MOVING') moveSpeed = speed * 1.5; // Moving towards player

          const newZ = obs.z + moveSpeed * delta;
          
          // Collision Check
          if (!obs.isHit && newZ > -obs.depth/2 && newZ < obs.depth/2 + 1) { // Close in Z
             
             // Check X (Lane)
             // Simple AABB
             const obsX = obs.lane * 2.5; 
             const pX = pPos.x;
             
             if (Math.abs(obsX - pX) < 1.0) { // In same lane (roughly)
                
                // Check Y (Jump/Roll state)
                if (obs.type === 'LOW_BARRIER' && pPos.y > 1.2) {
                   // Cleared by jumping
                } else if (obs.type === 'HIGH_BARRIER' && pHitbox.height < 1.0) {
                   // Cleared by rolling (Hitbox height is smaller)
                } else if (obs.type === 'HIGH_BARRIER' && pPos.y > 0 && pHitbox.height > 1.0) {
                   // Jumping into high barrier = Crash
                   hasCrashed = true;
                } else {
                   // Direct Hit (Train, un-jumped low barrier, un-rolled high barrier)
                   // Check if sliding to side (stumble) or direct center
                   if (Math.abs(obsX - pX) > 0.6) {
                      onStumble();
                   } else {
                      hasCrashed = true;
                   }
                }
             }
          }

          return { ...obs, z: newZ };
       });

       if (hasCrashed) {
          onCrash();
       }

       // Filter passed
       return nextList.filter(o => o.z < 20); 
    });
  });

  return (
    <group>
       {obstacles.map(obs => {
          if (obs.type === 'TRAIN_STATIC') return <Train key={obs.id} lane={obs.lane} z={obs.z} isMoving={false} speedMultiplier={1} />
          if (obs.type === 'TRAIN_MOVING') return <Train key={obs.id} lane={obs.lane} z={obs.z} isMoving={true} speedMultiplier={1.5} />
          if (obs.type === 'LOW_BARRIER') return <LowBarrier key={obs.id} lane={obs.lane} z={obs.z} />
          if (obs.type === 'HIGH_BARRIER') return <HighBarrier key={obs.id} lane={obs.lane} z={obs.z} />
          return null;
       })}
    </group>
  );
};
