// Set to true to log every audio state change and sound attempt
// to the console. Use this when diagnosing playback failures.
const DEBUG = false;

let audioContext = null;
let initialized = false;
let lastSoundTime = 0;
const SOUND_GUARD_MS = 30;
const MAX_PENDING_QUEUE = 8;
const pendingQueue = [];

function log(...args) {
  if (DEBUG) console.log('[audio]', ...args);
}

function isAudioDisabled() {
  // No audio on touch devices
  if ('ontouchstart' in window) return true;
  // No audio if user prefers reduced motion
  if (window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return true;
  }
  return false;
}

function getAudioContext() {
  if (audioContext && audioContext.state !== 'closed') {
    return audioContext;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) {
    log('AudioContext not supported');
    return null;
  }
  audioContext = new AC();
  log('Created AudioContext, initial state:', audioContext.state);
  // Some browsers fire statechange we can use to log transitions
  audioContext.addEventListener('statechange', () => {
    log('AudioContext state changed to:', audioContext.state);
  });
  return audioContext;
}

// Ensures the context exists and is in 'running' state.
// Returns true if the context is usable, false otherwise.
// Safe to call repeatedly; cheap when already running.
async function ensureRunning() {
  if (isAudioDisabled()) return false;
  const ctx = getAudioContext();
  if (!ctx) return false;
  if (ctx.state === 'running') return true;
  if (ctx.state === 'closed') {
    // Context was closed; null it out so next call recreates
    audioContext = null;
    return false;
  }
  // state is 'suspended' (or 'interrupted' on Safari/iOS)
  try {
    await ctx.resume();
    log('Resumed AudioContext, state now:', ctx.state);
    return ctx.state === 'running';
  } catch (err) {
    log('Failed to resume AudioContext:', err);
    return false;
  }
}

// Attempt to play a sound. Builder is a function that receives
// the AudioContext and constructs the sound. If the context is
// not yet running, the sound is queued (up to MAX_PENDING_QUEUE)
// and played as soon as the context resumes.
async function playSound(builder, soundName) {
  if (isAudioDisabled()) return;

  // Rate-limit rapid-fire sounds (e.g., dragging across cards)
  const now = performance.now();
  if (now - lastSoundTime < SOUND_GUARD_MS) {
    log('Rate-limited:', soundName);
    return;
  }

  const running = await ensureRunning();
  if (!running) {
    // Queue for later if not running yet
    if (pendingQueue.length < MAX_PENDING_QUEUE) {
      pendingQueue.push({ builder, soundName });
      log('Queued:', soundName, '(queue length:', pendingQueue.length, ')');
    }
    return;
  }

  lastSoundTime = now;
  try {
    builder(audioContext);
    log('Played:', soundName);
  } catch (err) {
    log('Error playing', soundName, ':', err);
  }
}

// Drain queued sounds after the context becomes running.
async function drainQueue() {
  while (pendingQueue.length > 0) {
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') break;
    const { builder, soundName } = pendingQueue.shift();
    try {
      builder(ctx);
      log('Played from queue:', soundName);
    } catch (err) {
      log('Error draining', soundName, ':', err);
    }
    // Stagger queue draining so they don't all hit at once
    await new Promise(r => setTimeout(r, 40));
  }
}

// Initialize on the first real user gesture. Listens at the
// document level for input events that browsers consider user
// gestures. Removes itself after success.
function initializeOnFirstGesture() {
  if (initialized) return;
  const handler = async () => {
    log('First user gesture detected');
    const ok = await ensureRunning();
    if (ok) {
      initialized = true;
      await drainQueue();
      document.removeEventListener('pointerdown', handler);
      document.removeEventListener('keydown', handler);
      document.removeEventListener('touchstart', handler);
    }
  };
  document.addEventListener('pointerdown', handler);
  document.addEventListener('keydown', handler);
  document.addEventListener('touchstart', handler);
}

// Resume the context whenever the page becomes visible again.
// This is the critical handler that prevents the "worked earlier,
// silent now" failure mode after tab switches.
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible') {
    if (audioContext && audioContext.state !== 'closed') {
      log('Page visible, refreshing AudioContext state');
      await ensureRunning();
      await drainQueue();
    }
  }
});

// Also resume on window focus, which fires in cases visibilitychange
// does not (e.g., refocusing a window without tab switch).
window.addEventListener('focus', async () => {
  if (audioContext && audioContext.state !== 'closed') {
    log('Window focused, refreshing AudioContext state');
    await ensureRunning();
    await drainQueue();
  }
});

// Public API
export async function hoverCard() {
  await playSound((ctx) => {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.detune.setValueAtTime(4, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.032, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    osc.start(t);
    osc.stop(t + 0.08);
    osc.onended = () => {
      try { osc.disconnect(); gain.disconnect(); } catch {}
    };
  }, 'hoverCard');
}

export async function selectPlayground() {
  await playSound((ctx) => {
    const t = ctx.currentTime;
    // A clean digital-confirm chord: a soft G3 body, a C5 with a
    // detuned twin for warmth, and a resolve up a fifth to G5 with a
    // faint high sparkle. Not a descending "woosh".
    const voice = (freq, t0, dur, peak, type = 'sine', detune = 0) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t + t0);
      if (detune) o.detune.setValueAtTime(detune, t + t0);
      g.gain.setValueAtTime(0.00001, t + t0);
      g.gain.linearRampToValueAtTime(peak, t + t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + t0 + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t + t0); o.stop(t + t0 + dur + 0.03);
      o.onended = () => { try { o.disconnect(); g.disconnect(); } catch {} };
    };
    voice(196.00, 0.00, 0.46, 0.024);                 // soft G3 body
    voice(523.25, 0.00, 0.40, 0.050, 'sine', -3);     // C5
    voice(523.25, 0.00, 0.40, 0.034, 'sine', 5);      // detuned twin for warmth
    voice(783.99, 0.085, 0.50, 0.044);                // resolve up a fifth, G5
    voice(1567.98, 0.085, 0.34, 0.013, 'triangle');   // faint high-octave sparkle
  }, 'selectPlayground');
}

export async function returnFromPlayground() {
  await playSound((ctx) => {
    const t = ctx.currentTime;

    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.connect(bassGain);
    bassGain.connect(ctx.destination);
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(70, t);
    bassGain.gain.setValueAtTime(0, t);
    bassGain.gain.linearRampToValueAtTime(0.055, t + 0.02);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.40);
    bassOsc.start(t);
    bassOsc.stop(t + 0.40);
    bassOsc.onended = () => {
      try { bassOsc.disconnect(); bassGain.disconnect(); } catch {}
    };

    const sweepOsc = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweepOsc.connect(sweepGain);
    sweepGain.connect(ctx.destination);
    sweepOsc.type = 'sine';
    sweepOsc.frequency.setValueAtTime(80, t);
    sweepOsc.frequency.exponentialRampToValueAtTime(280, t + 0.35);
    sweepGain.gain.setValueAtTime(0, t);
    sweepGain.gain.linearRampToValueAtTime(0.038, t + 0.02);
    sweepGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    sweepOsc.start(t);
    sweepOsc.stop(t + 0.38);
    sweepOsc.onended = () => {
      try { sweepOsc.disconnect(); sweepGain.disconnect(); } catch {}
    };
  }, 'returnFromPlayground');
}

export async function filterActivate() {
  await playSound((ctx) => {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.025, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.start(t);
    osc.stop(t + 0.05);
    osc.onended = () => {
      try { osc.disconnect(); gain.disconnect(); } catch {}
    };
  }, 'filterActivate');
}

export async function filterDeactivate() {
  await playSound((ctx) => {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.018, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.start(t);
    osc.stop(t + 0.05);
    osc.onended = () => {
      try { osc.disconnect(); gain.disconnect(); } catch {}
    };
  }, 'filterDeactivate');
}

// Expose a diagnostic snapshot for the browser console
export function audioDiagnostics() {
  return {
    contextExists: audioContext !== null,
    contextState: audioContext ? audioContext.state : 'no-context',
    initialized,
    pendingQueueLength: pendingQueue.length,
    timeSinceLastSound: lastSoundTime
      ? performance.now() - lastSoundTime
      : null,
    audioDisabled: isAudioDisabled(),
  };
}

// Bootstrap on module load
initializeOnFirstGesture();

// Expose on window for browser-console debugging
if (typeof window !== 'undefined') {
  window.__audio = {
    diagnostics: audioDiagnostics,
    forceResume: ensureRunning,
    enableDebug: () => {
      // Cannot truly flip DEBUG const; this is informational
      console.log('To enable debug, set DEBUG=true at top of audio.js');
    },
  };
}
