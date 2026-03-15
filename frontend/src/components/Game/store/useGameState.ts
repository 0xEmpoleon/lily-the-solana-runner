import { create } from 'zustand';

export type PowerupType = 'shield' | 'magnet' | 'invincible' | 'slowmo' | null;
export type CharacterType = 'penguin' | 'bear';
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
  parseInt(ls.get('mars_highscore') || '0', 10);

const saveHighScore = (s: number) => ls.set('mars_highscore', String(s));

const loadCharacter = (): CharacterType =>
  (ls.get('mars_character') as CharacterType) || 'penguin';

const loadHistory = (): number[] => {
  try { return JSON.parse(ls.get('mars_history') || '[]'); } catch { return []; }
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

  const saved = ls.get('mars_daily');
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as DailyChallenge;
      if (parsed.date === date) return parsed;
    } catch { /* ignore */ }
  }

  return { type, target, progress: 0, completed: false, date, description: descriptions[type] };
};

const MILESTONES = [100, 500, 1000, 2500, 5000];

// ── Store ──────────────────────────────────────────────────────────────────
interface GameState {
  score: number;
  coins: number;
  multiplier: number;
  gameState: 'MENU' | 'PLAYING' | 'GAMEOVER';
  speed: number;
  speedScale: number;      // 1.0 normally, 0.4 during slowmo
  highScore: number;

  character: CharacterType;
  activePowerup: PowerupType;
  powerupTimeLeft: number;

  combo: number;
  maxCombo: number;

  dailyChallenge: DailyChallenge;
  milestoneScore: number | null;   // set when score crosses a milestone
  runHistory: number[];            // last 5 run scores

  // Actions
  startGame: () => void;
  endGame: () => void;
  addScore: (points: number) => void;
  addCoin: () => void;
  increaseSpeed: (delta: number) => void;
  setCharacter: (c: CharacterType) => void;
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

  character: loadCharacter(),
  activePowerup: null,
  powerupTimeLeft: 0,

  combo: 0,
  maxCombo: 0,

  dailyChallenge: buildDailyChallenge(),
  milestoneScore: null,
  runHistory: loadHistory(),

  // ── Game flow ──────────────────────────────────────────────────────────
  startGame: () => set({
    gameState: 'PLAYING',
    score: 0, coins: 0,
    speed: INITIAL_SPEED,
    speedScale: 1.0,
    activePowerup: null, powerupTimeLeft: 0,
    combo: 0, maxCombo: 0, multiplier: 1,
    milestoneScore: null,
  }),

  endGame: () => {
    const { score, highScore, runHistory } = get();
    const finalScore = Math.floor(score);
    const newHigh = Math.max(finalScore, highScore);
    if (newHigh > highScore) saveHighScore(newHigh);
    const newHistory = [finalScore, ...runHistory].slice(0, 5);
    ls.set('mars_history', JSON.stringify(newHistory));
    set({ gameState: 'GAMEOVER', highScore: newHigh, activePowerup: null, speedScale: 1.0, runHistory: newHistory });
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

  // ── Character ──────────────────────────────────────────────────────────
  setCharacter: (c) => {
    ls.set('mars_character', c);
    set({ character: c });
  },

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
    ls.set('mars_daily', JSON.stringify(updated));
    return { dailyChallenge: updated };
  }),

  clearMilestone: () => set({ milestoneScore: null }),
}));
