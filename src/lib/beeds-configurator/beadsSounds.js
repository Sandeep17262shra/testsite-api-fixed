let audioContext = null;
let lastMoveSoundAt = 0;

const MOVE_SOUND_COOLDOWN_MS = 85;
const SOUND_PREF_STORAGE_KEY = "beeds-configurator:sound";

const soundListeners = new Set();

function readStoredSoundPreference() {
  if (typeof window === "undefined") {
    return true;
  }
  try {
    return window.localStorage.getItem(SOUND_PREF_STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

/** Read once at import so someone who muted last visit is not greeted by the first bead. */
let soundEnabled = readStoredSoundPreference();

export function isBeadsSoundEnabled() {
  return soundEnabled;
}

export function subscribeToBeadsSound(listener) {
  soundListeners.add(listener);
  return () => soundListeners.delete(listener);
}

function getAudioContext() {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioCtx();
  }

  return audioContext;
}

/** One-sample buffer during a user gesture — unlocks iOS / strict autoplay policies. */
function pulseSilentUnlock(ctx) {
  try {
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    source.stop(ctx.currentTime + 0.001);
  } catch {
    // ignore
  }
}

function scheduleTone(ctx, params) {
  const {
    startFrequency,
    endFrequency = startFrequency,
    duration = 0.1,
    volume = 0.05,
    type = "sine",
    attack = 0.008,
  } = params;

  const startedAt = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(startFrequency, startedAt);

  if (endFrequency !== startFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(endFrequency, 1),
      startedAt + duration
    );
  }

  gain.gain.setValueAtTime(0.0001, startedAt);
  gain.gain.linearRampToValueAtTime(volume, startedAt + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(startedAt);
  oscillator.stop(startedAt + duration + 0.04);
}

function playTone(params) {
  if (!soundEnabled) {
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }

  const run = () => {
    try {
      scheduleTone(ctx, params);
    } catch {
      // ignore
    }
  };

  if (ctx.state === "running") {
    run();
    return;
  }

  void ctx.resume().then(run).catch(() => {});
}

export function setBeadsSoundEnabled(enabled) {
  const next = Boolean(enabled);
  if (next === soundEnabled) {
    return;
  }

  soundEnabled = next;

  try {
    window.localStorage.setItem(SOUND_PREF_STORAGE_KEY, next ? "on" : "off");
  } catch {
    // Private browsing can reject writes — the toggle still holds for this session.
  }

  if (next) {
    unlockBeadsAudio();
  }

  soundListeners.forEach((listener) => listener());
}

/**
 * Call from pointer / click handlers. Drag and remove sounds fire on pointer-up or after
 * settle, so the context must be unlocked during the gesture, not only when add runs.
 */
export function unlockBeadsAudio() {
  if (!soundEnabled) {
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }

  pulseSilentUnlock(ctx);
  if (ctx.state === "suspended" || ctx.state === "interrupted") {
    void ctx.resume();
  }
}

function playWithGestureWarmup(play) {
  if (!soundEnabled) {
    return;
  }
  unlockBeadsAudio();
  play();
}

/** Soft pop when a bead is added to the string. */
export function playBeadAddSound() {
  playWithGestureWarmup(() =>
    playTone({
      startFrequency: 520,
      endFrequency: 980,
      duration: 0.11,
      volume: 0.14,
      type: "sine",
      attack: 0.002,
    })
  );
}

/** Light tick when a bead changes slot/position. */
export function playBeadMoveSound() {
  const now = performance.now();
  if (now - lastMoveSoundAt < MOVE_SOUND_COOLDOWN_MS) {
    return;
  }

  lastMoveSoundAt = now;

  playWithGestureWarmup(() =>
    playTone({
      startFrequency: 1180,
      endFrequency: 860,
      duration: 0.055,
      volume: 0.14,
      type: "triangle",
      attack: 0.003,
    })
  );
}

/** Soft drop when a bead is removed. */
export function playBeadRemoveSound() {
  playWithGestureWarmup(() =>
    playTone({
      startFrequency: 420,
      endFrequency: 160,
      duration: 0.16,
      volume: 0.14,
      type: "sine",
    })
  );
}
