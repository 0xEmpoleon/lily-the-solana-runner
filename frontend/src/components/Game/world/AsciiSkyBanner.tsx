import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type CellData = [number, number, string, number, number, number];
interface AsciiImage { c: number; r: number; d: CellData[] }

const CELL_W = 11;
const CELL_H = 14;
const CANVAS_W = 81 * CELL_W;       // 891
const IMAGES_PER_SIDE = 6;

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Render multiple ASCII images stacked vertically — returns texture + aspect ratio */
function buildStripTexture(images: AsciiImage[]): { tex: THREE.CanvasTexture; aspect: number } {
  const totalRows = images.reduce((sum, img) => sum + img.r + 4, 0);
  const totalH = totalRows * CELL_H;

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d')!;

  // Pure black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, CANVAS_W, totalH);
  ctx.font = 'bold 13px monospace';
  ctx.textBaseline = 'top';

  let yOffset = 0;
  for (const img of images) {
    for (const [row, col, char, r, g, b] of img.d) {
      if (!char || !char.trim()) continue;
      const br = Math.min(255, Math.floor(r * 1.4 + 40));
      const bg = Math.min(255, Math.floor(g * 1.4 + 40));
      const bb = Math.min(255, Math.floor(b * 1.4 + 40));
      ctx.fillStyle = `rgb(${br},${bg},${bb})`;
      ctx.fillText(char, col * CELL_W + 2, (row + yOffset) * CELL_H + 1);
    }
    yOffset += img.r + 4;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, aspect: CANVAS_W / totalH };
}

const AsciiPlane: React.FC<{
  texture: THREE.CanvasTexture;
  aspect: number;
  side: 'left' | 'right';
}> = ({ texture, aspect, side }) => {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const texRef = useRef(texture);

  useFrame((_s, delta) => {
    texRef.current.offset.y -= delta * 0.03;
    if (matRef.current && matRef.current.opacity < 0.55) {
      matRef.current.opacity = Math.min(0.55, matRef.current.opacity + delta * 0.5);
    }
  });

  const xPos = side === 'left' ? -8 : 8;
  const yRot = side === 'left' ? 0.135 : -0.135;

  const planeH = 45;
  const planeW = planeH * aspect;

  return (
    <mesh position={[xPos, 16, -45]} rotation={[-0.55, yRot, 0]}>
      <planeGeometry args={[planeW, planeH]} />
      <meshBasicMaterial
        ref={matRef}
        map={texture}
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
};

export const AsciiSkyBanner: React.FC = () => {
  const [strips, setStrips] = useState<{
    left: { tex: THREE.CanvasTexture; aspect: number };
    right: { tex: THREE.CanvasTexture; aspect: number };
  } | null>(null);

  useEffect(() => {
    fetch('/ascii/manifest.json')
      .then(r => r.json())
      .then(async (files: string[]) => {
        const shuffled = shuffle([...files]);
        const leftFiles = shuffled.slice(0, IMAGES_PER_SIDE);
        const rightFiles = shuffled.slice(IMAGES_PER_SIDE, IMAGES_PER_SIDE * 2).length >= IMAGES_PER_SIDE
          ? shuffled.slice(IMAGES_PER_SIDE, IMAGES_PER_SIDE * 2)
          : shuffle([...files]).slice(0, IMAGES_PER_SIDE);

        const loadImages = async (fileList: string[]): Promise<AsciiImage[]> => {
          const results: AsciiImage[] = [];
          for (const f of fileList) {
            try {
              const res = await fetch(`/ascii/${f}`);
              results.push(await res.json());
            } catch { /* skip */ }
          }
          return results;
        };

        const [leftImgs, rightImgs] = await Promise.all([
          loadImages(leftFiles),
          loadImages(rightFiles),
        ]);

        if (leftImgs.length > 0 && rightImgs.length > 0) {
          setStrips({
            left: buildStripTexture(leftImgs),
            right: buildStripTexture(rightImgs),
          });
        }
      })
      .catch(() => {});
  }, []);

  if (!strips) return null;

  return (
    <>
      <AsciiPlane texture={strips.left.tex} aspect={strips.left.aspect} side="left" />
      <AsciiPlane texture={strips.right.tex} aspect={strips.right.aspect} side="right" />
    </>
  );
};
