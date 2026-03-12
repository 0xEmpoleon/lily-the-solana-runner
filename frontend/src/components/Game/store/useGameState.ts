import { create } from 'zustand';

interface GameState {
  score: number;
  coins: number;
  multiplier: number;
  gameState: 'MENU' | 'PLAYING' | 'GAMEOVER';
  speed: number;
  
  // Actions
  startGame: () => void;
  endGame: () => void;
  addScore: (points: number) => void;
  addCoin: () => void;
  increaseSpeed: (delta: number) => void;
  reset: () => void;
}

const INITIAL_SPEED = 20;

export const useGameState = create<GameState>((set) => ({
  score: 0,
  coins: 0,
  multiplier: 1,
  gameState: 'MENU',
  speed: INITIAL_SPEED,

  startGame: () => set({ gameState: 'PLAYING', score: 0, speed: INITIAL_SPEED }),
  endGame: () => set({ gameState: 'GAMEOVER' }),
  addScore: (points) => set((state) => ({ score: state.score + (points * state.multiplier) })),
  addCoin: () => set((state) => ({ coins: state.coins + 1, score: state.score + (10 * state.multiplier) })),
  increaseSpeed: (delta) => set((state) => ({ speed: Math.min(state.speed + delta, 60) })),
  reset: () => set({ score: 0, coins: 0, gameState: 'MENU', speed: INITIAL_SPEED }),
}));
