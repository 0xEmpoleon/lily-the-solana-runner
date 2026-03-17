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
  PENGUIN:      '',   // e.g. '/models/penguin.glb'
  BEAR:         '',   // e.g. '/models/bear.glb'
  TRAIN:        '',   // e.g. '/models/train.glb'
  LOW_BARRIER:  '',   // e.g. '/models/low-barrier.glb'
  HIGH_BARRIER: '',   // e.g. '/models/high-barrier.glb'
  SPIKE_ROLLER: '',   // e.g. '/models/spike-roller.glb'
  COIN:         '',   // e.g. '/models/coin.glb'
  STAR:         '',   // e.g. '/models/star.glb'
} as const;

// ── Character: Space Penguin ──────────────────────────────────────────────────
export const PENGUIN_COLORS = {
  suit:    '#87CEEB',  // sky blue
  accent:  '#FF80AB',  // hot pink
  helmet:  '#C8F0FF',  // pale cyan glass
  head:    '#1a2035',  // deep navy
  belly:   '#FFFDF0',  // warm white
  beak:    '#FF8C1A',  // orange
  blush:   '#FFB3C6',  // pastel pink
  jetpack: '#00CFFF',  // bright cyan
  eye:     '#0d0d1a',  // near-black
} as const;

// ── Character: Bear ───────────────────────────────────────────────────────────
export const BEAR_COLORS = {
  fur:    '#C68642',  // warm honey brown
  belly:  '#F5E6C8',  // cream
  nose:   '#4A2C1A',  // dark brown
  ear:    '#A0622A',  // inner ear
  suit:   '#1B998B',  // teal
  accent: '#FFD60A',  // bright yellow
  blush:  '#FFB3C6',  // pastel pink
  paw:    '#D4956A',  // light fur paw
  eye:    '#0d0d1a',  // near-black
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
export const TRACK_THEMES = {
  mars: {
    ground: '#8B4513', wall: '#A0522D', rail: '#555555',
    skyColor: '#1a0a00', fogColor: '#3d1500',
    decoration: [
      { color: '#cc3300', shape: 'cone' as const, scale: [0.3,  1.2, 0.3 ] as [number, number, number], offsetX:  9.5  },
      { color: '#cc3300', shape: 'cone' as const, scale: [0.2,  0.8, 0.2 ] as [number, number, number], offsetX: -9.5  },
    ],
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
