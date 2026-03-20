import React, { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameState } from '../store/useGameState';
import type { ThemeName } from '../../../assets';

const ATMOSPHERE: Record<ThemeName, {
  sky: string; fog: string; fogNear: number; fogFar: number;
  ambient: number; ambientColor: string;
}> = {
  mars:   { sky: '#1a0800', fog: '#4a1800', fogNear: 45,  fogFar: 130, ambient: 0.55, ambientColor: '#ff7733' },
  city:   { sky: '#080814', fog: '#141428', fogNear: 60,  fogFar: 160, ambient: 0.70, ambientColor: '#9999ff' },
  desert: { sky: '#1a1000', fog: '#7a4012', fogNear: 50,  fogFar: 145, ambient: 0.90, ambientColor: '#ffcc66' },
  forest: { sky: '#001000', fog: '#061800', fogNear: 30,  fogFar: 100, ambient: 0.50, ambientColor: '#33aa33' },
  space:  { sky: '#00000e', fog: '#00001a', fogNear: 70,  fogFar: 220, ambient: 0.30, ambientColor: '#7777ff' },
};

function getAtmosphereTheme(_score: number): ThemeName {
  return 'space';
}

const _skyLerp = new THREE.Color();
const _fogLerp = new THREE.Color();
const _ambLerp = new THREE.Color();

export const SceneAtmosphere: React.FC = () => {
  const { scene } = useThree();
  const { score, activePowerup } = useGameState();

  const [ambientIntensity, setAmbientIntensity] = useState(0.5);
  const [ambientColor, setAmbientColor]         = useState('#ff8844');

  const lerpProgress  = useRef(1);
  const fromTheme     = useRef<ThemeName>('mars');
  const toTheme       = useRef<ThemeName>('mars');
  const ambientTimer  = useRef(0);
  const initialized   = useRef(false);

  if (!initialized.current) {
    const a = ATMOSPHERE['mars'];
    scene.background = new THREE.Color(a.sky);
    scene.fog = new THREE.Fog(a.fog, a.fogNear, a.fogFar);
    initialized.current = true;
  }

  useFrame((_, delta) => {
    const currentTheme = getAtmosphereTheme(score);

    if (currentTheme !== toTheme.current) {
      fromTheme.current    = toTheme.current;
      toTheme.current      = currentTheme;
      lerpProgress.current = 0;
    }

    if (lerpProgress.current < 1) {
      lerpProgress.current = Math.min(lerpProgress.current + delta / 2.5, 1);
    }

    const t    = lerpProgress.current;
    const from = ATMOSPHERE[fromTheme.current];
    const to   = ATMOSPHERE[toTheme.current];

    // Lerp sky background
    if (scene.background instanceof THREE.Color) {
      _skyLerp.set(from.sky).lerp(new THREE.Color(to.sky), t);
      scene.background.copy(_skyLerp);
    }

    // Lerp fog
    if (scene.fog instanceof THREE.Fog) {
      _fogLerp.set(from.fog).lerp(new THREE.Color(to.fog), t);
      scene.fog.color.copy(_fogLerp);
      scene.fog.near = from.fogNear + (to.fogNear - from.fogNear) * t;
      scene.fog.far  = from.fogFar  + (to.fogFar  - from.fogFar)  * t;
    }

    // Update ambient light every 0.5s to avoid too-frequent re-renders
    ambientTimer.current += delta;
    if (ambientTimer.current > 0.5) {
      ambientTimer.current = 0;
      const targetIntensity = activePowerup === 'slowmo'
        ? 1.2
        : from.ambient + (to.ambient - from.ambient) * t;
      setAmbientIntensity(targetIntensity);
      _ambLerp.set(from.ambientColor).lerp(new THREE.Color(to.ambientColor), t);
      setAmbientColor('#' + _ambLerp.getHexString());
    }
  });

  return <ambientLight intensity={ambientIntensity} color={ambientColor} />;
};
