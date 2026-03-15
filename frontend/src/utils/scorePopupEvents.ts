export interface PopupEvent {
  text: string;
  color: string;
  big?: boolean;
}

type Listener = (e: PopupEvent) => void;
let listeners: Listener[] = [];

export const scorePopupEvents = {
  emit(e: PopupEvent) { listeners.forEach(l => l(e)); },
  subscribe(listener: Listener) {
    listeners.push(listener);
    return () => { listeners = listeners.filter(l => l !== listener); };
  },
};
