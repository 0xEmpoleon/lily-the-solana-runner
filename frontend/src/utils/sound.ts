/** Synthesised sound engine – no audio files needed, uses Web Audio API */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  private get audioCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  toggle() { this.muted = !this.muted; return this.muted; }
  isMuted() { return this.muted; }

  private osc(
    type: OscillatorType,
    freqStart: number,
    freqEnd: number,
    duration: number,
    gainStart = 0.3,
    startDelay = 0,
  ) {
    if (this.muted) return;
    try {
      const ctx = this.audioCtx;
      const t = ctx.currentTime + startDelay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, t);
      osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
      gain.gain.setValueAtTime(gainStart, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duration + 0.01);
    } catch { /* ignore AudioContext errors */ }
  }

  jump() {
    this.osc('sine', 280, 560, 0.18, 0.25);
  }

  land() {
    this.osc('triangle', 160, 80, 0.12, 0.15);
  }

  coin() {
    this.osc('sine', 880, 1320, 0.12, 0.18);
  }

  star() {
    // Ascending arpeggio for star collect
    [523, 659, 784, 1047].forEach((freq, i) => {
      this.osc('sine', freq, freq * 1.05, 0.12, 0.22, i * 0.07);
    });
  }

  combo(level: number) {
    // Higher combo = faster + higher arpeggio
    const notes = [523, 659, 784, 1047, 1319];
    const count = Math.min(level, 5);
    for (let i = 0; i < count; i++) {
      this.osc('triangle', notes[i], notes[i] * 1.03, 0.1, 0.2, i * 0.06);
    }
  }

  powerup() {
    this.osc('sine', 440, 880, 0.1, 0.25);
    this.osc('sine', 660, 1320, 0.1, 0.2, 0.1);
    this.osc('sine', 880, 1760, 0.15, 0.15, 0.2);
  }

  shieldBlock() {
    this.osc('sawtooth', 300, 150, 0.2, 0.3);
    this.osc('sine', 600, 800, 0.1, 0.15, 0.05);
  }

  crash() {
    if (this.muted) return;
    try {
      const ctx = this.audioCtx;
      // Bass thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);

      // White noise burst
      const sr = ctx.sampleRate;
      const buf = ctx.createBuffer(1, sr * 0.25, sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.35, ctx.currentTime);
      ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      src.connect(ng);
      ng.connect(ctx.destination);
      src.start();
    } catch { /* ignore */ }
  }
}

export const soundEngine = new SoundEngine();
