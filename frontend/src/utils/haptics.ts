/** Haptic feedback – gracefully no-ops on desktop */
const v = (pattern: number | number[]) => {
  try { navigator.vibrate?.(pattern); } catch { /* ignore */ }
};

export const haptics = {
  light:  () => v(10),
  medium: () => v(25),
  jump:   () => v(15),
  land:   () => v(20),
  coin:   () => v(8),
  combo:  () => v([10, 10, 10]),
  powerup:() => v([0, 30, 15, 30]),
  crash:  () => v([0, 80, 40, 120]),
  shield: () => v([0, 40, 20, 40]),
};
