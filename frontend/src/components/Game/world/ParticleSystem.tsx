import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { particleEvents } from '../../../utils/particleEvents';
import type { BurstEvent } from '../../../utils/particleEvents';
import { PARTICLE_COLORS } from '../../../assets';

interface Particle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;   // counts down from 1 → 0
  maxLife: number;
  colorHex: string;
}

const MAX_PARTICLES = 200;
const GRAVITY = -18;

export const ParticleSystem: React.FC = () => {
  const particles   = useRef<Particle[]>([]);
  const pendingBursts = useRef<BurstEvent[]>([]);

  // Subscribe to burst events from other components
  useEffect(() => {
    return particleEvents.subscribe(e => { pendingBursts.current.push(e); });
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Separate meshes per color bucket – avoids instanced color attribute entirely
  const goldRef  = useRef<THREE.InstancedMesh>(null);
  const blueRef  = useRef<THREE.InstancedMesh>(null);
  const redRef   = useRef<THREE.InstancedMesh>(null);

  const geoRef = useMemo(() => new THREE.SphereGeometry(1, 5, 5), []);
  const goldMat = useMemo(() => new THREE.MeshStandardMaterial({ color: PARTICLE_COLORS.gold, emissive: PARTICLE_COLORS.gold, emissiveIntensity: 0.8, roughness: 0.3 }), []);
  const blueMat = useMemo(() => new THREE.MeshStandardMaterial({ color: PARTICLE_COLORS.blue, emissive: PARTICLE_COLORS.blue, emissiveIntensity: 0.8, roughness: 0.3 }), []);
  const redMat  = useMemo(() => new THREE.MeshStandardMaterial({ color: PARTICLE_COLORS.red,  emissive: PARTICLE_COLORS.red,  emissiveIntensity: 0.8, roughness: 0.3 }), []);

  useFrame((_state, delta) => {
    // Spawn pending
    while (pendingBursts.current.length > 0) {
      const burst = pendingBursts.current.shift()!;
      for (let i = 0; i < burst.count && particles.current.length < MAX_PARTICLES; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        particles.current.push({
          pos: new THREE.Vector3(burst.x, burst.y, burst.z),
          vel: new THREE.Vector3(Math.cos(angle) * speed, 3 + Math.random() * 5, Math.sin(angle) * speed * 0.4),
          life: 1,
          maxLife: 0.4 + Math.random() * 0.4,
          colorHex: burst.color,
        });
      }
    }

    // Update life + physics
    particles.current = particles.current.filter(p => {
      p.life -= delta / p.maxLife;
      p.vel.y += GRAVITY * delta;
      p.pos.addScaledVector(p.vel, delta);
      return p.life > 0;
    });

    // Split into three color buckets
    const goldP: Particle[] = [];
    const blueP: Particle[] = [];
    const redP:  Particle[] = [];
    for (const p of particles.current) {
      const lo = p.colorHex.toLowerCase();
      if (lo === PARTICLE_COLORS.blue.toLowerCase() || lo.includes('0ea')) blueP.push(p);
      else if (lo === PARTICLE_COLORS.red.toLowerCase()) redP.push(p);
      else goldP.push(p);
    }

    const updateMesh = (mesh: THREE.InstancedMesh | null, parts: Particle[]) => {
      if (!mesh) return;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const scale = p.life * 0.2;
        dummy.position.copy(p.pos);
        dummy.scale.setScalar(Math.max(scale, 0.001));
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.count = parts.length;
      mesh.instanceMatrix.needsUpdate = true;
    };

    updateMesh(goldRef.current, goldP);
    updateMesh(blueRef.current, blueP);
    updateMesh(redRef.current,  redP);
  });

  return (
    <group>
      <instancedMesh ref={goldRef} args={[geoRef, goldMat, MAX_PARTICLES]} />
      <instancedMesh ref={blueRef} args={[geoRef, blueMat, MAX_PARTICLES]} />
      <instancedMesh ref={redRef}  args={[geoRef, redMat,  MAX_PARTICLES]} />
    </group>
  );
};
