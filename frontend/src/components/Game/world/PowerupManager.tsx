import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameState, PowerupType } from '../store/useGameState';

interface PowerupItem {
  id: number;
  type: PowerupType;
  lane: number;
  z: number;
  collected: boolean;
}

interface PowerupManagerProps {
  playerPosRef: React.MutableRefObject<THREE.Vector3>;
}

// Colors & shapes per power-up type
const POWERUP_CONFIG: Record<NonNullable<PowerupType>, { color: string; emissive: string; duration: number }> = {
  shield:    { color: '#38bdf8', emissive: '#0ea5e9', duration: 8 },
  magnet:    { color: '#c084fc', emissive: '#a855f7', duration: 10 },
  invincible: { color: '#facc15', emissive: '#f59e0b', duration: 6 },
};

const POWERUP_TYPES: NonNullable<PowerupType>[] = ['shield', 'magnet', 'invincible'];

// One floating power-up orb rendered in 3D
const PowerupOrb = ({
  item,
  onCollect,
}: {
  item: PowerupItem;
  onCollect: () => void;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const cfg = POWERUP_CONFIG[item.type as NonNullable<PowerupType>];

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.y = 1.8 + Math.sin(t * 2) * 0.2;
    groupRef.current.rotation.y = t * 1.5;
    if (ringRef.current) ringRef.current.rotation.x = t * 2;
  });

  const icon = item.type === 'shield' ? '🛡' : item.type === 'magnet' ? '🧲' : '⚡';

  return (
    <group ref={groupRef} position={[item.lane * 2.5, 1.8, item.z]}>
      {/* Core sphere */}
      <mesh castShadow>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial
          color={cfg.color}
          emissive={cfg.emissive}
          emissiveIntensity={1.2}
          metalness={0.3}
          roughness={0.2}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Outer glow ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.6, 0.05, 8, 32]} />
        <meshStandardMaterial color={cfg.color} emissive={cfg.emissive} emissiveIntensity={2} />
      </mesh>

      {/* Inner pulse ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.03, 8, 32]} />
        <meshStandardMaterial color={cfg.color} emissive={cfg.emissive} emissiveIntensity={1.5} transparent opacity={0.6} />
      </mesh>

      {/* Point light for local glow */}
      <pointLight color={cfg.color} intensity={3} distance={4} decay={2} />
    </group>
  );
};

export const PowerupManager: React.FC<PowerupManagerProps> = ({ playerPosRef }) => {
  const { speed, gameState, activatePowerup, tickPowerup } = useGameState();
  const [powerups, setPowerups] = useState<PowerupItem[]>([]);
  const nextZ = useRef(-200);
  const nextId = useRef(0);

  useFrame((_state, delta) => {
    if (gameState !== 'PLAYING') return;

    // Tick active power-up timer
    tickPowerup(delta);

    // Spawn power-ups sparsely
    if (nextZ.current > -400) {
      const lane = Math.floor(Math.random() * 3) - 1;
      const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];

      setPowerups(prev => [...prev, {
        id: nextId.current++,
        type,
        lane,
        z: nextZ.current,
        collected: false,
      }]);

      // Spawn every 300–500 units apart
      nextZ.current -= 300 + Math.random() * 200;
    }

    // Move + collision
    setPowerups(prev => {
      const pPos = playerPosRef.current;
      let pickedType: NonNullable<PowerupType> | null = null;

      const next = prev.map(p => {
        if (p.collected) return { ...p, z: p.z + speed * delta };
        const newZ = p.z + speed * delta;

        // Collect if in range
        if (newZ > -1.0 && newZ < 1.0) {
          const pX = pPos.x;
          const obsX = p.lane * 2.5;
          if (Math.abs(obsX - pX) < 1.2 && Math.abs(pPos.y - 1.8) < 1.5) {
            pickedType = p.type as NonNullable<PowerupType>;
            return { ...p, z: newZ, collected: true };
          }
        }

        return { ...p, z: newZ };
      });

      if (pickedType) {
        const cfg = POWERUP_CONFIG[pickedType];
        activatePowerup(pickedType, cfg.duration);
      }

      return next.filter(p => p.z < 20 && !p.collected);
    });
  });

  return (
    <group>
      {powerups.filter(p => !p.collected).map(p => (
        <PowerupOrb key={p.id} item={p} onCollect={() => {}} />
      ))}
    </group>
  );
};
