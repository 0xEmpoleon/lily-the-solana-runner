import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';

interface ObstacleProps {
  onScore: () => void;
  onHit: () => void;
  playerLane: number;
}

const OBSTACLE_SPEED = 15;
const SPAWN_INTERVAL = 1.2;
const LANE_WIDTH = 2.5;

const ObstacleManager: React.FC<ObstacleProps> = ({ onScore, onHit, playerLane }) => {
  const [obstacles, setObstacles] = useState<{ id: number; lane: number; z: number }[]>([]);
  const lastSpawnTime = useRef(0);
  const nextId = useRef(0);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    
    // Spawn logic
    if (time - lastSpawnTime.current > SPAWN_INTERVAL) {
      const lane = Math.floor(Math.random() * 3) - 1;
      setObstacles(obs => [
        ...obs,
        { id: nextId.current++, lane, z: -50 }
      ]);
      lastSpawnTime.current = time;
    }

    // Move and collision check
    setObstacles(obs => {
      const updated = obs.map(o => ({ ...o, z: o.z + OBSTACLE_SPEED * delta }));
      
      let hitDetected = false;
      const filtered = updated.filter(o => {
        // Collision detection (Player is at z=0, width ~1.5)
        if (Math.abs(o.z) < 1.0 && o.lane === playerLane) {
          hitDetected = true;
          return false;
        }

        if (o.z > 5) {
          onScore();
          return false;
        }
        return true;
      });

      if (hitDetected) onHit();

      return filtered;
    });
  });

  return (
    <>
      {obstacles.map(obs => (
        <mesh key={obs.id} position={[obs.lane * LANE_WIDTH, 0, obs.z]}>
          <boxGeometry args={[1.5, 1, 1.5]} />
          <meshStandardMaterial color="#FF4500" emissive="#FF0000" emissiveIntensity={0.5} />
        </mesh>
      ))}
    </>
  );
};

export default ObstacleManager;
