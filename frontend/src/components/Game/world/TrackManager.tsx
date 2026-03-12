import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameState } from '../store/useGameState';

const CHUNK_LENGTH = 100;
const VISIBLE_CHUNKS = 4;
const LANE_WIDTH = 2.5;

interface TrackChunkProps {
  positionZ: number;
}

const TrackChunk: React.FC<TrackChunkProps> = ({ positionZ }) => {
  return (
    <group position={[0, 0, positionZ]}>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[LANE_WIDTH * 3 + 2, CHUNK_LENGTH]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>
      
      {/* Side Walls */}
      <mesh position={[-(LANE_WIDTH * 1.5 + 1.5), 2, 0]} receiveShadow castShadow>
         <boxGeometry args={[1, 4, CHUNK_LENGTH]} />
         <meshStandardMaterial color="#A0522D" />
      </mesh>
      <mesh position={[(LANE_WIDTH * 1.5 + 1.5), 2, 0]} receiveShadow castShadow>
         <boxGeometry args={[1, 4, CHUNK_LENGTH]} />
         <meshStandardMaterial color="#A0522D" />
      </mesh>

      {/* Rails Details */}
      {[-LANE_WIDTH, 0, LANE_WIDTH].map((x, i) => (
        <group key={i} position={[x, 0.05, 0]}>
           {/* Left Rail */}
           <mesh position={[-0.5, 0, 0]} receiveShadow>
              <boxGeometry args={[0.1, 0.1, CHUNK_LENGTH]} />
              <meshStandardMaterial color="#555" metalness={0.6} />
           </mesh>
           {/* Right Rail */}
           <mesh position={[0.5, 0, 0]} receiveShadow>
              <boxGeometry args={[0.1, 0.1, CHUNK_LENGTH]} />
              <meshStandardMaterial color="#555" metalness={0.6} />
           </mesh>
           {/* Ties (visual approximation via texture/geometry could go here, omitting for performance) */}
        </group>
      ))}
    </group>
  );
};

export const TrackManager: React.FC = () => {
  const { speed, gameState, addScore } = useGameState();
  const [chunks, setChunks] = useState<{ id: number; z: number }[]>(
    Array.from({ length: VISIBLE_CHUNKS }).map((_, i) => ({ id: i, z: -i * CHUNK_LENGTH }))
  );
  
  const nextChunkId = useRef(VISIBLE_CHUNKS);
  const distanceTraveled = useRef(0);

  useFrame((_state, delta) => {
    if (gameState !== 'PLAYING') return;

    // Move chunks towards player (Player stays at Z=0 for simplicity of camera/lighting)
    setChunks(currentChunks => {
      let needsNewChunk = false;
      const movedChunks = currentChunks.map(chunk => {
        const newZ = chunk.z + speed * delta;
        if (newZ > CHUNK_LENGTH) needsNewChunk = true;
        return { ...chunk, z: newZ };
      });

      if (needsNewChunk) {
        // Remove passed chunks and add new ones ahead
        const filtered = movedChunks.filter(c => c.z <= CHUNK_LENGTH);
        const minZ = Math.min(...filtered.map(c => c.z));
        filtered.push({ id: nextChunkId.current++, z: minZ - CHUNK_LENGTH });
        return filtered;
      }
      return movedChunks;
    });

    // Update Score based on distance
    distanceTraveled.current += speed * delta;
    if (distanceTraveled.current > 10) { // Every 10 units = 1 point
       addScore(1);
       distanceTraveled.current = 0;
    }
  });

  return (
    <>
      {chunks.map(chunk => (
        <TrackChunk key={chunk.id} positionZ={chunk.z} />
      ))}
    </>
  );
};
