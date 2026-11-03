import { useCallback } from "react";
import { CLICK_SOUND_BASE64 } from "../../ring-configurator/data/clickSoundBase64";
import { isBeadsSoundEnabled } from "../../beeds-configurator/beadsSounds";

let sharedAudioCtx = null;
let cachedAudioBuffer = null;
let isDecoding = false;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    sharedAudioCtx = new AudioContextClass();
  }
  return sharedAudioCtx;
}

function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function preloadAudioBuffer() {
  const ctx = getAudioContext();
  if (!ctx || cachedAudioBuffer || isDecoding) return;
  isDecoding = true;
  try {
    const arrayBuffer = base64ToArrayBuffer(CLICK_SOUND_BASE64);
    ctx.decodeAudioData(
      arrayBuffer,
      (buffer) => {
        cachedAudioBuffer = buffer;
        isDecoding = false;
      },
      () => {
        isDecoding = false;
      }
    );
  } catch {
    isDecoding = false;
  }
}

export function playCustomClickSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    if (cachedAudioBuffer) {
      const source = ctx.createBufferSource();
      source.buffer = cachedAudioBuffer;
      source.connect(ctx.destination);
      source.start(0);
    } else {
      preloadAudioBuffer();
      const audio = new Audio("/sounds/click.wav");
      audio.volume = 0.8;
      audio.play().catch(() => {});
    }
  } catch {
    // Fail silently
  }
}

/**
 * useClickSound
 * Returns a `playClick` function that plays the custom click sound from the ring configurator.
 * Follows the sound toggle state of the necklace/bracelet configurator (active by default).
 */
export function useClickSound() {
  const playClick = useCallback(() => {
    if (!isBeadsSoundEnabled()) return;
    playCustomClickSound();
  }, []);

  return { playClick };
}
