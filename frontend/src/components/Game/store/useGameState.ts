import { create } from 'zustand';

export type PowerupType = 'shield' | 'magnet' | 'invincible' | 'slowmo' | null;
export type ChallengeType = 'coins' | 'score' | 'combo';

export interface DailyChallenge {
  type: ChallengeType;
  target: number;
  progress: number;
  completed: boolean;
  date: string;
  description: string;
}

// ── Persistence helpers ─────────────────────────────────────────────────────
const ls = {
  get: (key: string) => { try { return localStorage.getItem(key); } catch { return null; } },
  set: (key: string, val: string) => { try { localStorage.setItem(key, val); } catch { /* ignore */ } },
};

const loadHighScore = (): number =>
  parseInt(ls.get('lily_highscore') || '0', 10);

const saveHighScore = (s: number) => ls.set('lily_highscore', String(s));

const loadHistory = (): number[] => {
  try { return JSON.parse(ls.get('lily_history') || '[]'); } catch { return []; }
};

// ── Daily challenge generation (deterministic from date) ───────────────────
const buildDailyChallenge = (): DailyChallenge => {
  const date = new Date().toDateString();
  const seed = date.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const types: ChallengeType[] = ['coins', 'score', 'combo'];
  const type = types[seed % 3];
  const targets: Record<ChallengeType, number[]> = {
    coins: [15, 20, 25, 30, 40],
    score: [100, 200, 300, 400, 500],
    combo: [5, 8, 10, 12, 15],
  };
  const target = targets[type][(seed >> 2) % targets[type].length];
  const descriptions: Record<ChallengeType, string> = {
    coins: `Collect ${target} coins in one run`,
    score: `Reach a score of ${target}`,
    combo: `Get a ${target}x coin combo`,
  };

  const saved = ls.get('lily_daily');
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as DailyChallenge;
      if (parsed.date === date) return parsed;
    } catch { /* ignore */ }
  }

  return { type, target, progress: 0, completed: false, date, description: descriptions[type] };
};

const MILESTONES = [100, 500, 1000, 2500, 5000];

// ── Run stats ───────────────────────────────────────────────────────────────
export interface RunStats {
  nearMisses: number;
  powerupsCollected: number;
  maxCombo: number;
  distanceTraveled: number;
  zonesReached: string[];
}

const INITIAL_RUN_STATS: RunStats = {
  nearMisses: 0,
  powerupsCollected: 0,
  maxCombo: 0,
  distanceTraveled: 0,
  zonesReached: ['Mars'],
};

// ── Store ──────────────────────────────────────────────────────────────────
interface GameState {
  score: number;
  coins: number;
  multiplier: number;
  gameState: 'MENU' | 'PLAYING' | 'GAMEOVER';
  speed: number;
  speedScale: number;      // 1.0 normally, 0.4 during slowmo
  highScore: number;

  activePowerup: PowerupType;
  powerupTimeLeft: number;

  combo: number;
  maxCombo: number;

  dailyChallenge: DailyChallenge;
  milestoneScore: number | null;   // set when score crosses a milestone
  runHistory: number[];            // last 5 run scores
  runStats: RunStats;

  // Actions
  startGame: () => void;
  endGame: () => void;
  addNearMiss: () => void;
  addPowerupCollected: () => void;
  addDistance: (d: number) => void;
  addScore: (points: number) => void;
  addCoin: () => void;
  increaseSpeed: (delta: number) => void;
  activatePowerup: (type: PowerupType, duration: number) => void;
  tickPowerup: (delta: number) => void;
  incrementCombo: () => void;
  breakCombo: () => void;
  updateChallenge: (type: ChallengeType, amount: number) => void;
  clearMilestone: () => void;
}

const INITIAL_SPEED = 20;

export const useGameState = create<GameState>((set, get) => ({
  score: 0,
  coins: 0,
  multiplier: 1,
  gameState: 'MENU',
  speed: INITIAL_SPEED,
  speedScale: 1.0,
  highScore: loadHighScore(),

  activePowerup: null,
  powerupTimeLeft: 0,

  combo: 0,
  maxCombo: 0,

  dailyChallenge: buildDailyChallenge(),
  milestoneScore: null,
  runHistory: loadHistory(),
  runStats: { ...INITIAL_RUN_STATS },

  // ── Game flow ──────────────────────────────────────────────────────────
  startGame: () => set({
    gameState: 'PLAYING',
    score: 0, coins: 0,
    speed: INITIAL_SPEED,
    speedScale: 1.0,
    activePowerup: null, powerupTimeLeft: 0,
    combo: 0, maxCombo: 0, multiplier: 1,
    milestoneScore: null,
    runStats: { ...INITIAL_RUN_STATS },
  }),

  endGame: () => {
    const { score, highScore, runHistory } = get();
    const finalScore = Math.floor(score);
    const newHigh = Math.max(finalScore, highScore);
    if (newHigh > highScore) saveHighScore(newHigh);
    const newHistory = [finalScore, ...runHistory].slice(0, 5);
    ls.set('lily_history', JSON.stringify(newHistory));
    set(s => ({
      gameState: 'GAMEOVER', highScore: newHigh, activePowerup: null, speedScale: 1.0, runHistory: newHistory,
      runStats: { ...s.runStats, maxCombo: s.maxCombo },
    }));
  },

  addScore: (points) => set(s => {
    const newScore = s.score + points * s.multiplier;
    let milestoneHit: number | null = null;
    if (!s.milestoneScore) {
      for (const m of MILESTONES) {
        if (s.score < m && newScore >= m) { milestoneHit = m; break; }
      }
    }
    return { score: newScore, ...(milestoneHit ? { milestoneScore: milestoneHit } : {}) };
  }),

  addCoin: () => set(s => ({
    coins: s.coins + 1,
    score: s.score + 10 * s.multiplier,
  })),

  increaseSpeed: (delta) => set(s => ({ speed: Math.min(s.speed + delta, 120) })),

  // ── Power-ups ─────────────────────────────────────────────────────────
  activatePowerup: (type, duration) => set(s => ({
    activePowerup: type,
    powerupTimeLeft: duration,
    // slowmo adjusts world speed; restores if overriding a slowmo
    speedScale: type === 'slowmo' ? 0.4 : (s.activePowerup === 'slowmo' ? 1.0 : s.speedScale),
  })),

  tickPowerup: (delta) => set(s => {
    if (!s.activePowerup) return {};
    const t = s.powerupTimeLeft - delta;
    if (t <= 0) {
      return {
        activePowerup: null,
        powerupTimeLeft: 0,
        speedScale: s.activePowerup === 'slowmo' ? 1.0 : s.speedScale,
      };
    }
    return { powerupTimeLeft: t };
  }),

  // ── Combo ─────────────────────────────────────────────────────────────
  incrementCombo: () => set(s => {
    const combo = s.combo + 1;
    const maxCombo = Math.max(combo, s.maxCombo);
    const multiplier = combo >= 20 ? 4 : combo >= 10 ? 3 : combo >= 5 ? 2 : 1;
    return { combo, maxCombo, multiplier };
  }),

  breakCombo: () => set({ combo: 0, multiplier: 1 }),

  // ── Daily challenge ────────────────────────────────────────────────────
  updateChallenge: (type, amount) => set(s => {
    const dc = s.dailyChallenge;
    if (dc.completed || dc.type !== type) return {};
    const progress = Math.min(dc.progress + amount, dc.target);
    const completed = progress >= dc.target;
    const updated = { ...dc, progress, completed };
    ls.set('lily_daily', JSON.stringify(updated));
    return { dailyChallenge: updated };
  }),

  clearMilestone: () => set({ milestoneScore: null }),

  // ── Run stats ─────────────────────────────────────────────────────────
  addNearMiss: () => set(s => ({
    runStats: { ...s.runStats, nearMisses: s.runStats.nearMisses + 1 },
  })),
  addPowerupCollected: () => set(s => ({
    runStats: { ...s.runStats, powerupsCollected: s.runStats.powerupsCollected + 1 },
  })),
  addDistance: (d) => {
    const s = get();
    const newDist = s.runStats.distanceTraveled + d;
    const zones: string[] = ['Mars'];
    if (s.score >= 2000) zones.push('City');
    if (s.score >= 4000) zones.push('Desert');
    if (s.score >= 6000) zones.push('Forest');
    if (s.score >= 8000) zones.push('Space');
    set({ runStats: { ...s.runStats, distanceTraveled: newDist, zonesReached: zones } });
  },
}));
