// Ember Court: tiny synthesised sounds — no audio files, just the Web Audio
// API. A click for playing a card, a low thud for damage, a bright arpeggio
// for victory and a low one for defeat. Silent until the player interacts.

let ctx = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function ensureCtx() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    return null;
  }
  return ctx;
}

function tone(freq, at, dur, type, vol) {
  const ac = ensureCtx();
  if (!ac || muted) return;
  try {
    if (ac.state === 'suspended') void ac.resume();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ac.currentTime + at);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + at + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime + at);
    osc.stop(ac.currentTime + at + dur + 0.02);
  } catch {
    // Audio is decoration; never let it break the game.
  }
}

export function playCardSound() {
  tone(520, 0, 0.09, 'triangle', 0.16);
  tone(780, 0.06, 0.1, 'triangle', 0.12);
}

export function damageSound() {
  tone(140, 0, 0.16, 'sawtooth', 0.14);
  tone(90, 0.05, 0.2, 'sawtooth', 0.12);
}

export function healSound() {
  tone(660, 0, 0.12, 'sine', 0.12);
  tone(880, 0.09, 0.14, 'sine', 0.1);
}

export function winSound() {
  [523, 659, 784, 1047].forEach((freq, i) => tone(freq, i * 0.12, 0.22, 'triangle', 0.15));
}

export function loseSound() {
  [392, 330, 262, 196].forEach((freq, i) => tone(freq, i * 0.14, 0.24, 'triangle', 0.12));
}

export function turnSound() {
  tone(440, 0, 0.07, 'sine', 0.08);
}
