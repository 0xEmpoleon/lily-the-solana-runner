// ─────────────────────────────────────────────────────────────────────────────
// ASSET MANIFEST
// Single source of truth for every 2D image and 3D model path used in the game.
//
// HOW TO SWAP IN FINAL ASSETS:
//   2D — Replace the string value (e.g. '/mascot/RUNNING.png' → '/mascot/v2/run.png')
//   3D models — Drop your .glb file into public/models/ and set the MODEL path here.
//               Each component checks `MODEL_ASSETS.<KEY>`: if non-empty it loads the
//               GLB via useGLTF; if empty the procedural fallback is used automatically.
// ─────────────────────────────────────────────────────────────────────────────

// ── 2D Mascot images ──────────────────────────────────────────────────────────
export const MASCOT_ASSETS = {
  PLAYING:      '/mascot/PLAYING JOY.png',
  RUNNING:      '/mascot/RUNNING.png',
  JUMP:         '/mascot/JUMP.png',
  BETTER_LUCK:  '/mascot/Better luck.png',
  REWARD:       '/mascot/NFTHAPPY reward.png',
  THUMBS_UP:    '/mascot/4 thumbs up.png',
  HODL:         '/mascot/HODL.png',
} as const;

// ── 3D Model paths ────────────────────────────────────────────────────────────
// Leave as '' to use the built-in procedural geometry.
// Set to '/models/name.glb' once final GLB files are placed in public/models/.
export const MODEL_ASSETS = {
  TRAIN:        '',   // e.g. '/models/train.glb'
  LOW_BARRIER:  '',   // e.g. '/models/low-barrier.glb'
  HIGH_BARRIER: '',   // e.g. '/models/high-barrier.glb'
  SPIKE_ROLLER: '',   // e.g. '/models/spike-roller.glb'
  COIN:         '',   // e.g. '/models/coin.glb'
  STAR:         '',   // e.g. '/models/star.glb'
} as const;

// ── KayKit City Builder assets ────────────────────────────────────────────────
const C = '/models/city';
export const CITY_MODELS = {
  ROAD:          `${C}/road_straight.gltf`,
  BUILDING_A:    `${C}/building_A_withoutBase.gltf`,
  BUILDING_B:    `${C}/building_B_withoutBase.gltf`,
  BUILDING_C:    `${C}/building_C_withoutBase.gltf`,
  BUILDING_D:    `${C}/building_D_withoutBase.gltf`,
  BUILDING_E:    `${C}/building_E_withoutBase.gltf`,
  BUILDING_F:    `${C}/building_F_withoutBase.gltf`,
  STREETLIGHT:   `${C}/streetlight.gltf`,
  TRAFFICLIGHT:  `${C}/trafficlight_A.gltf`,
  BENCH:         `${C}/bench.gltf`,
  BUSH:          `${C}/bush.gltf`,
  WATERTOWER:    `${C}/watertower.gltf`,
  FIREHYDRANT:   `${C}/firehydrant.gltf`,
  DUMPSTER:      `${C}/dumpster.gltf`,
  BOX_A:         `${C}/box_A.gltf`,
  BOX_B:         `${C}/box_B.gltf`,
  CAR_TAXI:      `${C}/car_taxi.gltf`,
  CAR_SEDAN:     `${C}/car_sedan.gltf`,
} as const;

// ── Character: Mouse (Lily) ──────────────────────────────────────────────────
export const MOUSE_COLORS = {
  fur:      '#D4C4B0',  // light grey-beige
  belly:    '#F5EDE3',  // cream white
  nose:     '#FFB6C1',  // pink
  innerEar: '#FFB6C1',  // pink inner ear
  whisker:  '#CCCCCC',  // light grey
  suit:     '#14F195',  // Solana green
  accent:   '#9945FF',  // Solana purple
  blush:    '#FFB3C6',  // pastel pink
  paw:      '#E8D5C4',  // light fur paw
  tail:     '#C4B0A0',  // warm grey
  eye:      '#0d0d1a',  // near-black
} as const;

// ── Obstacles ─────────────────────────────────────────────────────────────────
export const TRAIN_COLORS = {
  body:            '#ff4000',
  window:          '#88ccff',
  windowEmissive:  '#224466',
  stripe:          '#ff8800',
  stripeEmissive:  '#ff4400',
  wheel:           '#222222',
} as const;

export const BARRIER_COLORS = {
  body:  '#eab308',  // yellow-gold body / top bar
  base:  '#555555',  // metal base plate
  post:  '#666666',  // vertical posts
  light: '#ff0000',  // warning light spheres
} as const;

export const SPIKE_ROLLER_COLORS = {
  roller:        '#333333',
  spike:         '#cc2200',
  spikeEmissive: '#880000',
  endCap:        '#555555',
} as const;

// ── Collectibles ──────────────────────────────────────────────────────────────
export const COLLECTIBLE_COLORS = {
  coin:          '#FFD700',
  star:          '#fde047',
  starEmissive:  '#f59e0b',
} as const;

// ── Power-ups ─────────────────────────────────────────────────────────────────
// duration (seconds) is the single source of truth — imported by both
// PowerupManager (activation) and GameHUD (progress bar width calculation).
export const POWERUP_PALETTE = {
  shield:     { color: '#38bdf8', emissive: '#0ea5e9', duration: 8  },
  magnet:     { color: '#c084fc', emissive: '#a855f7', duration: 10 },
  invincible: { color: '#facc15', emissive: '#f59e0b', duration: 6  },
  slowmo:     { color: '#4ade80', emissive: '#22c55e', duration: 5  },
} as const;

// ── Player powerup visual effects ─────────────────────────────────────────────
export const EFFECT_COLORS = {
  shield:     { ring:         '#38bdf8' },
  invincible: { aura:         '#facc15', auraEmissive: '#f59e0b' },
  slowmo:     { ring:         '#4ade80' },
} as const;

// ── Particles ─────────────────────────────────────────────────────────────────
export const PARTICLE_COLORS = {
  gold: '#FFD700',
  blue: '#38bdf8',
  red:  '#ff4444',
} as const;

// ── Track themes ──────────────────────────────────────────────────────────────
// Score thresholds: mars 0–1999 | city 2000–3999 | desert 4000–5999 | forest 6000–7999 | space 8000+
export const TRACK_THEMES = {
  mars: {
    ground: '#8B4513', wall: '#A0522D', rail: '#555555',
    skyColor: '#1a0a00', fogColor: '#3d1500',
    decoration: [
      { color: '#cc3300', shape: 'cone' as const, scale: [0.3,  1.2, 0.3 ] as [number, number, number], offsetX:  9.5  },
      { color: '#cc3300', shape: 'cone' as const, scale: [0.2,  0.8, 0.2 ] as [number, number, number], offsetX: -9.5  },
    ],
  },
  city: {
    ground: '#2d3436', wall: '#636e72', rail: '#b2bec3',
    skyColor: '#0a0a14', fogColor: '#1a1a2e',
    decoration: [], // city uses GLTF buildings — no procedural deco
  },
  desert: {
    ground: '#C2955D', wall: '#D4A96A', rail: '#8B6914',
    skyColor: '#1a1000', fogColor: '#6b3a10',
    decoration: [
      { color: '#4a8c3f', shape: 'cone' as const, scale: [0.35, 2.0, 0.35] as [number, number, number], offsetX:  9.5  },
      { color: '#4a8c3f', shape: 'cone' as const, scale: [0.25, 1.4, 0.25] as [number, number, number], offsetX: -9.5  },
      { color: '#c2955d', shape: 'box'  as const, scale: [0.6,  0.6, 0.6 ] as [number, number, number], offsetX:  10.5 },
    ],
  },
  forest: {
    ground: '#2d5a1b', wall: '#3d2b1a', rail: '#4a3728',
    skyColor: '#001200', fogColor: '#0a2200',
    decoration: [
      { color: '#2d6e1b', shape: 'cone' as const, scale: [0.6,  3.0, 0.6 ] as [number, number, number], offsetX:  9.5  },
      { color: '#1f5c12', shape: 'cone' as const, scale: [0.45, 2.2, 0.45] as [number, number, number], offsetX: -9.5  },
      { color: '#3d2b1a', shape: 'box'  as const, scale: [0.4,  2.5, 0.4 ] as [number, number, number], offsetX:  10.5 },
      { color: '#3d2b1a', shape: 'box'  as const, scale: [0.4,  2.5, 0.4 ] as [number, number, number], offsetX: -10.5 },
    ],
  },
  space: {
    ground: '#1a1a2e', wall: '#16213e', rail: '#0f3460',
    skyColor: '#000010', fogColor: '#000020',
    decoration: [
      { color: '#e94560', shape: 'cone' as const, scale: [0.2,  1.5,  0.2 ] as [number, number, number], offsetX:  9.5  },
      { color: '#0f3460', shape: 'box'  as const, scale: [0.5,  1.8,  0.5 ] as [number, number, number], offsetX: -9.5  },
      { color: '#533483', shape: 'box'  as const, scale: [0.3,  2.2,  0.3 ] as [number, number, number], offsetX:  10.5 },
      { color: '#e94560', shape: 'cone' as const, scale: [0.15, 1.0,  0.15] as [number, number, number], offsetX: -10.5 },
    ],
  },
} as const;

export type ThemeName = keyof typeof TRACK_THEMES;

// ── DAE stage assets (KayKit Fantasy/Nature pack — Collada format) ─────────────
const D = '/models/dae';
export const DAE_MODELS = {
  // Desert
  DESERT_TILE_LARGE:  `${D}/tileLarge_desert.dae`,
  DESERT_TILE_HIGH:   `${D}/tileHigh_desert.dae`,
  DESERT_PLANT_A:     `${D}/plantA_desert.dae`,
  DESERT_PLANT_B:     `${D}/plantB_desert.dae`,
  DESERT_ROCKS_A:     `${D}/rocksA_desert.dae`,
  DESERT_ROCKS_B:     `${D}/rocksB_desert.dae`,
  DESERT_DETAIL:      `${D}/detail_desert.dae`,
  // Forest
  FOREST_TILE_LARGE:  `${D}/tileLarge_forest.dae`,
  FOREST_TILE_HIGH:   `${D}/tileHigh_forest.dae`,
  FOREST_PLANT_A:     `${D}/plantA_forest.dae`,
  FOREST_PLANT_B:     `${D}/plantB_forest.dae`,
  FOREST_ROCKS_A:     `${D}/rocksA_forest.dae`,
  FOREST_ROCKS_B:     `${D}/rocksB_forest.dae`,
  FOREST_DETAIL:      `${D}/detail_forest.dae`,
} as const;
