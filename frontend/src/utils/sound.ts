/** Synthesised sound engine – no audio files needed, uses Web Audio API */

type ZoneName = 'mars' | 'city' | 'desert' | 'forest' | 'space';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private musicPlaying = false;
  private musicGain: GainNode | null = null;
  private musicNodes: OscillatorNode[] = [];
  private musicInterval: ReturnType<typeof setInterval> | null = null;
  private currentZone: ZoneName = 'mars';

  private get audioCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  toggle() {
    this.muted = !this.muted;
    if (this.muted) this.stopMusicNodes();
    else if (this.musicPlaying) this.startMusic(this.currentZone);
    return this.muted;
  }
  isMuted() { return this.muted; }

  startMusic(zone: ZoneName) {
    this.currentZone = zone;
    this.musicPlaying = true;
    if (this.muted) return;
    this.stopMusicNodes();
    try {
      const ctx = this.audioCtx;
      const mg = ctx.createGain();
      mg.gain.setValueAtTime(0.06, ctx.currentTime);
      mg.connect(ctx.destination);
      this.musicGain = mg;
      const cfg: Record<ZoneName, { notes: number[]; tempo: number; wave: OscillatorType }> = {
        mars:   { notes: [110, 130.81, 146.83, 164.81], tempo: 400, wave: 'triangle' },
        city:   { notes: [130.81, 164.81, 196, 220],    tempo: 300, wave: 'square' },
        desert: { notes: [146.83, 174.61, 196, 233.08], tempo: 350, wave: 'triangle' },
        forest: { notes: [164.81, 196, 220, 261.63],    tempo: 450, wave: 'sine' },
        space:  { notes: [82.41, 110, 146.83, 196],     tempo: 500, wave: 'sine' },
      };
      const c = cfg[zone];
      const pad = ctx.createOscillator();
      const pg = ctx.createGain();
      pad.type = 'sine'; pad.frequency.setValueAtTime(c.notes[0] / 2, ctx.currentTime);
      pg.gain.setValueAtTime(0.3, ctx.currentTime);
      pad.connect(pg); pg.connect(mg); pad.start();
      this.musicNodes.push(pad);
      let ni = 0;
      this.musicInterval = setInterval(() => {
        if (this.muted || !this.musicPlaying) return;
        try {
          const n = c.notes[ni % c.notes.length];
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.type = c.wave; o.frequency.setValueAtTime(n, ctx.currentTime);
          g.gain.setValueAtTime(0.15, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
          o.connect(g); g.connect(mg); o.start(); o.stop(ctx.currentTime + 0.3);
          ni++;
        } catch { /* ignore */ }
      }, c.tempo);
    } catch { /* ignore */ }
  }

  updateMusicZone(zone: ZoneName) {
    if (zone !== this.currentZone && this.musicPlaying) this.startMusic(zone);
  }

  stopMusic() { this.stopMusicNodes(); this.musicPlaying = false; }

  private stopMusicNodes() {
    if (this.musicInterval) { clearInterval(this.musicInterval); this.musicInterval = null; }
    this.musicNodes.forEach(n => { try { n.stop(); } catch { /* */ } });
    this.musicNodes = [];
    if (this.musicGain) { try { this.musicGain.disconnect(); } catch { /* */ } this.musicGain = null; }
  }

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

  doubleJump() {
    // Higher-pitched, snappier second jump
    this.osc('sine', 560, 1120, 0.12, 0.2);
    this.osc('triangle', 880, 1200, 0.08, 0.1, 0.05);
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
