/** Lightweight pub/sub for particle burst events – avoids prop drilling */

export interface BurstEvent {
  x: number;
  y: number;
  z: number;
  color: string;
  count: number;
}

type Listener = (event: BurstEvent) => void;
let listeners: Listener[] = [];

export const particleEvents = {
  emit(event: BurstEvent) {
    listeners.forEach(l => l(event));
  },
  subscribe(listener: Listener) {
    listeners.push(listener);
    return () => { listeners = listeners.filter(l => l !== listener); };
  },
};
