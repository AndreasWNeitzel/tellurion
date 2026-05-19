// Experiential audio (spec Part C). One shared AudioContext, created
// on the first user gesture. Every sound degrades silently: no Web
// Audio, mobile ('ontouchstart'), or prefers-reduced-motion -> all
// methods are no-ops. A 30 ms global guard (C6) prevents audio chaos
// when the pointer sweeps many cards. Gains are deliberately tiny
// (Part H1): inaudible on a laptop speaker at 30% with the window in
// the background; they only register when the user is engaged.
//
// Disable the whole layer in one place (spec H4):
const AUDIO_ENABLED = true;

class AudioSystem {
  constructor() {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = 'ontouchstart' in window;
    const ok = AUDIO_ENABLED && !reduce && !mobile
      && typeof (window.AudioContext || window.webkitAudioContext) === 'function';
    this.enabled = ok;
    this.ctx = null;
    this.last = 0;                 // last sound start (ms), for the 30 ms guard
    if (!this.enabled) return;
    // Create the context on first gesture, and resume it on every
    // gesture / when the tab becomes visible again. Browsers suspend
    // the AudioContext on autoplay policy and on tab blur; without an
    // aggressive resume, later sounds silently never fire.
    const wake = () => {
      try {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
      } catch { this.ctx = null; this.enabled = false; }
    };
    window.addEventListener('pointerdown', wake);
    window.addEventListener('pointermove', wake, { passive: true });
    window.addEventListener('keydown', wake);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  }

  _ready() {
    if (!this.enabled) return null;
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
    const c = this.ctx;
    if (!c) return null;
    // Never schedule into a non-running context: its clock is frozen,
    // events never fire and nodes leak (audio "randomly stops"). Kick
    // a resume and skip this one; the next attempt plays.
    if (c.state !== 'running') { try { c.resume().catch(() => {}); } catch { /* ignore */ } return null; }
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (now - this.last < 30) return null;     // C6 volume guard
    this.last = now;
    return c;
  }

  // Short sine blip with a linear attack and exponential decay.
  _blip(c, freq, dur, peak, attack, detuneCents) {
    const t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (detuneCents) o.detune.setValueAtTime(detuneCents, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
    const kill = () => { try { o.disconnect(); g.disconnect(); } catch { /* ignore */ } };
    o.onended = kill;
    setTimeout(kill, (dur + 0.1) * 1000);            // fallback if onended never fires
  }

  _noiseBuffer(c, seconds) {
    const n = Math.floor(c.sampleRate * seconds);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const d = buf.getChannelData(0);
    let s = 0x9e3779b9;
    for (let i = 0; i < n; i += 1) { s = (Math.imul(s ^ (s >>> 15), 1 | s)) >>> 0; d[i] = (s / 2147483648) - 1; }
    return buf;
  }

  // C1: card hover. 880 Hz sine, 80 ms, +4 cent detune.
  hoverCard() {
    const c = this._ready(); if (!c) return;
    this._blip(c, 880, 0.08, 0.032, 0.005, 4);
  }

  // C2: playground selected. A smooth digital "confirm": a soft low
  // body and a clean rising C5 -> G5 interval with a faint high
  // octave for sparkle. No bass thump, no descending whoosh, no
  // noise breath (the old "woosh" the user disliked): pure sines,
  // gentle 12 ms attacks, exponential tails. Soothing and futuristic.
  selectPlayground() {
    const c = this._ready(); if (!c) return;
    const t = c.currentTime;
    const voice = (freq, t0, dur, peak, type = 'sine', detune = 0) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t + t0);
      if (detune) o.detune.setValueAtTime(detune, t + t0);
      g.gain.setValueAtTime(0.00001, t + t0);
      g.gain.linearRampToValueAtTime(peak, t + t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + t0 + dur);
      o.connect(g); g.connect(c.destination);
      o.start(t + t0); o.stop(t + t0 + dur + 0.03);
      const kill = () => { try { o.disconnect(); g.disconnect(); } catch { /* ignore */ } };
      o.onended = kill;
      setTimeout(kill, (t0 + dur + 0.12) * 1000);
    };
    voice(196.00, 0.00, 0.46, 0.024);             // soft G3 body (no thump)
    voice(523.25, 0.00, 0.40, 0.050, 'sine', -3); // C5
    voice(523.25, 0.00, 0.40, 0.034, 'sine', 5);  // detuned twin for warmth
    voice(783.99, 0.085, 0.50, 0.044);            // resolve up a fifth, G5
    voice(1567.98, 0.085, 0.34, 0.013, 'triangle'); // faint high-octave sparkle
  }

  // C3: return from a playground. Lighter, ascending: resurfacing.
  returnFromPlayground() {
    const c = this._ready(); if (!c) return;
    const t = c.currentTime;
    const o1 = c.createOscillator(), g1 = c.createGain();
    o1.type = 'sine'; o1.frequency.setValueAtTime(70, t);
    g1.gain.setValueAtTime(0, t);
    g1.gain.linearRampToValueAtTime(0.055, t + 0.02);
    g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    o1.connect(g1); g1.connect(c.destination); o1.start(t); o1.stop(t + 0.42);
    const o2 = c.createOscillator(), g2 = c.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(80, t);
    o2.frequency.exponentialRampToValueAtTime(280, t + 0.35);
    g2.gain.setValueAtTime(0, t);
    g2.gain.linearRampToValueAtTime(0.038, t + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    o2.connect(g2); g2.connect(c.destination); o2.start(t); o2.stop(t + 0.4);
    const src = c.createBufferSource(), g3 = c.createGain(), f3 = c.createBiquadFilter();
    src.buffer = this._noiseBuffer(c, 0.6);
    f3.type = 'bandpass'; f3.frequency.value = 1800; f3.Q.value = 0.5;
    g3.gain.setValueAtTime(0, t);
    g3.gain.linearRampToValueAtTime(0.015, t + 0.03);
    g3.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    src.connect(f3); f3.connect(g3); g3.connect(c.destination); src.start(t); src.stop(t + 0.34);
    o1.onended = () => { try { o1.disconnect(); g1.disconnect(); o2.disconnect(); g2.disconnect(); src.disconnect(); f3.disconnect(); g3.disconnect(); } catch { /* ignore */ } };
  }

  // C4 / C5: filter chip toggled on / off.
  filterActivate() { const c = this._ready(); if (c) this._blip(c, 660, 0.05, 0.025, 0.004, 0); }
  filterDeactivate() { const c = this._ready(); if (c) this._blip(c, 520, 0.05, 0.018, 0.004, 0); }

  // G: barely-perceptible ambient drone. Two detuned 40/41.2 Hz sines
  // beating at ~1.2 Hz, 3 s fade-in. Returns the new on/off state.
  ambientActive() { return !!this._amb; }
  toggleAmbient() {
    if (this._amb) { this._stopAmbient(); return false; }
    if (!this.enabled) return false;
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return false; } }
    const c = this.ctx; if (!c) return false;
    if (c.state === 'suspended') { try { c.resume(); } catch { /* ignore */ } }
    const t = c.currentTime;
    const mk = (f) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.00001, t);
      g.gain.linearRampToValueAtTime(0.006, t + 3.0);
      o.connect(g); g.connect(c.destination); o.start(t);
      return { o, g };
    };
    this._amb = [mk(40), mk(41.2)];
    return true;
  }
  _stopAmbient() {
    if (!this._amb) return;
    const c = this.ctx, t = c ? c.currentTime : 0;
    for (const n of this._amb) {
      try {
        n.g.gain.cancelScheduledValues(t);
        n.g.gain.setValueAtTime(n.g.gain.value, t);
        n.g.gain.linearRampToValueAtTime(0.00001, t + 0.4);
        n.o.stop(t + 0.45);
        n.o.onended = () => { try { n.o.disconnect(); n.g.disconnect(); } catch { /* ignore */ } };
      } catch { /* ignore */ }
    }
    this._amb = null;
  }
}

let _singleton = null;
export function getAudioSystem() {
  if (!_singleton) _singleton = new AudioSystem();
  return _singleton;
}
