/** Tiny WebAudio chiptune engine: sequencer for SONGS + procedural SFX. */
import { SONGS, Song } from '../data/music';

const NOTE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function midi(n: string) { const m = /^([A-G])([#b]?)(\d)$/.exec(n); if (!m) return 60; return 12 * (+m[3] + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); }
const freq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
function chordTones(ch: string): number[] { const m = /^([A-G])([#b]?)(m?)/.exec(ch)!; const root = 48 + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); return m[3] ? [root, root + 3, root + 7] : [root, root + 4, root + 7]; }

class Synth {
  ctx?: AudioContext; master!: GainNode; musicBus!: GainNode; sfxBus!: GainNode; delay!: DelayNode; noise!: AudioBuffer;
  waves: Record<string, PeriodicWave> = {};
  current?: string; timer?: any; step = 0; nextT = 0; song?: Song; events: { t: number; m: number; d: number; ch: string }[] = [];
  musicVol = 0.5; sfxVol = 0.7; muted = false;
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try { this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch { return; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = 0.8; this.master.connect(c.destination);
    const comp = c.createDynamicsCompressor(); comp.connect(this.master);
    this.musicBus = c.createGain(); this.musicBus.gain.value = this.musicVol; this.musicBus.connect(comp);
    this.sfxBus = c.createGain(); this.sfxBus.gain.value = this.sfxVol; this.sfxBus.connect(comp);
    this.delay = c.createDelay(); this.delay.delayTime.value = 0.28; const fb = c.createGain(); fb.gain.value = 0.28; const lp = c.createBiquadFilter(); lp.frequency.value = 2400;
    this.delay.connect(lp); lp.connect(fb); fb.connect(this.delay); lp.connect(this.musicBus);
    this.noise = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = this.noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const pulse = (duty: number) => { const n = 32, re = new Float32Array(n), im = new Float32Array(n); for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty); return c.createPeriodicWave(re, im); };
    this.waves.pulse = pulse(0.25); this.waves.thin = pulse(0.125);
    if (this.current) { const s = this.current; this.current = undefined; this.play(s); }
  }
  osc(type: string, f: number, t: number, dur: number, vol: number, dest: AudioNode, opts: { slide?: number; attack?: number; vib?: boolean } = {}) {
    const c = this.ctx!; const o = c.createOscillator(); const g = c.createGain();
    if (this.waves[type]) o.setPeriodicWave(this.waves[type]); else o.type = type as OscillatorType;
    o.frequency.setValueAtTime(f, t); if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * opts.slide), t + dur);
    if (opts.vib && dur > 0.3) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 5.5; lg.gain.value = f * 0.012; l.connect(lg); lg.connect(o.frequency); l.start(t + 0.15); l.stop(t + dur); }
    const a = opts.attack ?? 0.005;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.setValueAtTime(vol, t + Math.max(a, dur * 0.6)); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02); return g;
  }
  drum(kind: 'k' | 's' | 'h', t: number, dest: AudioNode, vol = 1) {
    const c = this.ctx!;
    if (kind === 'k') { this.osc('sine', 140, t, 0.16, 0.5 * vol, dest, { slide: 0.3 }); return; }
    const src = c.createBufferSource(); src.buffer = this.noise; const f = c.createBiquadFilter(); const g = c.createGain();
    f.type = kind === 'h' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'h' ? 7000 : 1800;
    const dur = kind === 'h' ? 0.04 : 0.14; g.gain.setValueAtTime((kind === 'h' ? 0.12 : 0.3) * vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(dest); src.start(t); src.stop(t + dur);
  }
  /** Expand song into per-step event list (one loop) */
  compile(s: Song) {
    const ev: { t: number; m: number; d: number; ch: string }[] = [];
    const parseLine = (line: string, ch: string) => {
      const toks = line.replace(/\|/g, ' ').trim().split(/\s+/);
      toks.forEach((tk, i) => { if (tk === '.' || tk === '-') return; let d = 1; while (toks[i + d] === '.') d++; ev.push({ t: i, m: midi(tk), d, ch }); });
      return toks.length;
    };
    const len = parseLine(s.lead, 'lead'); if (s.counter) parseLine(s.counter, 'counter');
    s.chords.forEach((chd, bar) => {
      const tones = chordTones(chd); const b0 = bar * 8;
      const root = tones[0] - 12;
      switch (s.style) {
        case 'drive': for (let i = 0; i < 8; i++) ev.push({ t: b0 + i, m: i % 2 ? root + 12 : root, d: 1, ch: 'bass' }); for (let i = 0; i < 8; i++) ev.push({ t: b0 + i, m: tones[i % 3] + 12, d: 1, ch: 'arp' }); break;
        case 'arp': ev.push({ t: b0, m: root, d: 3, ch: 'bass' }); ev.push({ t: b0 + 4, m: root + 7, d: 2, ch: 'bass' }); ev.push({ t: b0 + 6, m: root + 12, d: 2, ch: 'bass' }); for (let i = 0; i < 8; i++) ev.push({ t: b0 + i, m: tones[[0, 1, 2, 1][i % 4]] + 12, d: 1, ch: 'arp' }); break;
        case 'march': ev.push({ t: b0, m: root, d: 2, ch: 'bass' }); ev.push({ t: b0 + 3, m: root, d: 1, ch: 'bass' }); ev.push({ t: b0 + 4, m: root + 7, d: 4, ch: 'bass' }); for (const k of [0, 2, 4, 6]) tones.forEach(tn => ev.push({ t: b0 + k, m: tn + 12, d: 1, ch: 'pad' })); break;
        case 'waltz': ev.push({ t: b0, m: root, d: 2, ch: 'bass' }); ev.push({ t: b0 + 4, m: root + 7, d: 2, ch: 'bass' }); for (const k of [2, 3, 6, 7]) ev.push({ t: b0 + k, m: tones[k % 3] + 12, d: 1, ch: 'arp' }); break;
        case 'fanfare': ev.push({ t: b0, m: root, d: 4, ch: 'bass' }); tones.forEach(tn => ev.push({ t: b0, m: tn + 12, d: 6, ch: 'pad' })); break;
        case 'pad': default: ev.push({ t: b0, m: root, d: 8, ch: 'bass' }); tones.forEach(tn => ev.push({ t: b0, m: tn + 12, d: 8, ch: 'pad' })); for (let i = 0; i < 8; i += 2) ev.push({ t: b0 + i, m: tones[(i / 2) % 3] + 24, d: 1, ch: 'bell' }); break;
      }
      if (s.drums) {
        const pat = s.style === 'drive' ? 'k.hsk.hskkhsk.hs' : s.style === 'march' ? 'k.s.k.sskks.k.ss' : s.style === 'waltz' ? 'k.h.h.k.h.h.' : s.style === 'pad' ? 'k.......h...s...' : 'k.h.s.h.k.h.s.hh';
        // pattern is in 16ths for 2 bars-ish; map to 8th steps (use every other char)
        for (let i = 0; i < 8; i++) { const ch = pat[(i * 2 + (bar % 2) * 16) % pat.length]; if (ch !== '.') ev.push({ t: b0 + i, m: 0, d: 1, ch: 'd' + ch }); }
      }
    });
    return { ev, len: Math.max(len, s.chords.length * 8) };
  }
  compiled?: { ev: any[]; len: number };
  play(key: string, force = false) {
    if (this.current === key && !force) return;
    this.current = key;
    if (!this.ctx) return;
    this.stopMusic(true);
    this.current = key; const s = SONGS[key]; if (!s) return;
    this.song = s; this.compiled = this.compile(s); this.step = 0; this.nextT = this.ctx.currentTime + 0.08;
    const fadeIn = this.musicBus.gain; fadeIn.cancelScheduledValues(this.ctx.currentTime); fadeIn.setValueAtTime(this.muted ? 0 : this.musicVol, this.ctx.currentTime);
    this.timer = setInterval(() => this.tick(), 25);
  }
  tick() {
    const c = this.ctx!; const s = this.song!; const comp = this.compiled!; const spb = 60 / s.bpm / 2;
    while (this.nextT < c.currentTime + 0.15) {
      const st = this.step % comp.len;
      if (!s.loop && this.step >= comp.len) { clearInterval(this.timer); this.timer = undefined; return; }
      for (const e of comp.ev) if (e.t === st) this.voice(e, this.nextT, spb, s);
      this.step++; this.nextT += spb;
    }
  }
  voice(e: { m: number; d: number; ch: string }, t: number, spb: number, s: Song) {
    const bus = this.musicBus; const dur = e.d * spb;
    switch (e.ch) {
      case 'lead': { const g = this.osc(s.leadWave === 'saw' ? 'sawtooth' : s.leadWave, freq(e.m), t, dur * 0.95, s.leadWave === 'triangle' ? 0.22 : 0.09, bus, { vib: true, attack: 0.01 }); g.connect(this.delay); break; }
      case 'counter': this.osc('thin', freq(e.m), t, dur * 0.9, 0.05, bus); break;
      case 'bass': this.osc('triangle', freq(e.m), t, dur * 0.9, 0.26, bus); break;
      case 'arp': this.osc('thin', freq(e.m), t, spb * 0.7, 0.035, bus); break;
      case 'pad': this.osc('pulse', freq(e.m), t, dur * 0.9, 0.025, bus, { attack: Math.min(0.2, dur * 0.3) }); break;
      case 'bell': { const g = this.osc('sine', freq(e.m), t, spb * 1.8, 0.05, bus); g.connect(this.delay); break; }
      case 'dk': this.drum('k', t, bus); break; case 'ds': this.drum('s', t, bus); break; case 'dh': this.drum('h', t, bus); break;
    }
  }
  stopMusic(immediate = false) {
    if (this.timer) clearInterval(this.timer); this.timer = undefined; this.current = undefined;
    if (this.ctx && !immediate) { const g = this.musicBus.gain; g.setValueAtTime(g.value, this.ctx.currentTime); }
  }
  setMusicVol(v: number) { this.musicVol = v; if (this.musicBus) this.musicBus.gain.value = v; }
  setSfxVol(v: number) { this.sfxVol = v; if (this.sfxBus) this.sfxBus.gain.value = v; }
  sfx(name: string) {
    if (!this.ctx) return; const t = this.ctx.currentTime + 0.005; const b = this.sfxBus;
    const seq = (notes: number[], step: number, type = 'square', vol = 0.12, len = step) => notes.forEach((m, i) => this.osc(type, freq(m), t + i * step, len, vol, b));
    switch (name) {
      case 'cursor': this.osc('pulse', 1320, t, 0.035, 0.08, b); break;
      case 'confirm': seq([84, 91], 0.05, 'pulse', 0.1); break;
      case 'cancel': seq([79, 72], 0.05, 'pulse', 0.1); break;
      case 'talk': this.osc('thin', 700 + Math.random() * 120, t, 0.03, 0.04, b); break;
      case 'hit': this.drum('s', t, b, 1.3); this.osc('square', 220, t, 0.12, 0.12, b, { slide: 0.4 }); break;
      case 'crit': this.drum('s', t, b, 1.6); this.osc('sawtooth', 520, t, 0.25, 0.14, b, { slide: 0.2 }); seq([96, 100, 103], 0.04, 'square', 0.06); break;
      case 'enemyHit': this.drum('k', t, b, 1.4); this.osc('square', 140, t, 0.18, 0.14, b, { slide: 0.5 }); break;
      case 'miss': this.osc('triangle', 600, t, 0.15, 0.1, b, { slide: 2 }); break;
      case 'fire': { const s = this.ctx.createBufferSource(); s.buffer = this.noise; const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(4000, t); f.frequency.exponentialRampToValueAtTime(300, t + 0.5); const g = this.ctx.createGain(); g.gain.setValueAtTime(0.4, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.55); s.connect(f); f.connect(g); g.connect(b); s.start(t); s.stop(t + 0.6); this.osc('sawtooth', 300, t, 0.4, 0.06, b, { slide: 0.4 }); break; }
      case 'ice': seq([96, 103, 99, 106, 101, 108], 0.035, 'triangle', 0.12, 0.12); break;
      case 'heal': seq([72, 76, 79, 84, 88, 91], 0.06, 'triangle', 0.14, 0.25); break;
      case 'buff': seq([67, 71, 74, 79, 83], 0.05, 'pulse', 0.08, 0.15); break;
      case 'dark': this.osc('sawtooth', 160, t, 0.5, 0.1, b, { slide: 0.5 }); this.osc('square', 110, t, 0.5, 0.06, b, { slide: 0.6 }); break;
      case 'star': seq([84, 88, 91, 96, 100, 103, 108], 0.05, 'square', 0.1, 0.4); this.drum('k', t + 0.35, b, 2); break;
      case 'die': this.osc('square', 400, t, 0.4, 0.1, b, { slide: 0.1 }); this.drum('s', t + 0.05, b, 0.8); break;
      case 'encounter': seq([60, 63, 66, 69, 72, 75, 78, 81], 0.03, 'square', 0.08); break;
      case 'chest': seq([79, 83, 86, 91], 0.07, 'pulse', 0.1, 0.2); break;
      case 'coin': seq([88, 95], 0.06, 'square', 0.08); break;
      case 'door': this.drum('k', t, b, 0.8); this.osc('triangle', 200, t, 0.15, 0.1, b, { slide: 0.7 }); break;
      case 'save': seq([79, 84, 88, 91, 96], 0.09, 'triangle', 0.15, 0.5); break;
      case 'step': this.drum('h', t, b, 0.25); break;
      case 'quake': for (let i = 0; i < 6; i++) this.drum('k', t + i * 0.07, b, 1.5); break;
      case 'shatter': seq([108, 101, 96, 89, 84, 77, 72], 0.03, 'square', 0.09); this.drum('s', t, b, 2); break;
      case 'inn': seq([72, 76, 79, 76, 84], 0.18, 'triangle', 0.16, 0.4); break;
      case 'poison': seq([60, 59, 58], 0.06, 'square', 0.07); break;
      case 'join': seq([72, 79, 84, 88, 84, 91], 0.07, 'pulse', 0.1, 0.18); break;
    }
  }
}
export const Audio = new Synth();
