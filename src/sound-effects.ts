import captureUrl from './sounds/capture.mp3';
import cursorMoveUrl from './sounds/cursor-move.mp3';
import moveUrl from './sounds/move.mp3';
import promoteUrl from './sounds/promote.mp3';

const soundUrls = {
  capture: captureUrl,
  'cursor-move': cursorMoveUrl,
  move: moveUrl,
  promote: promoteUrl,
} as const;

type SoundEffect = keyof typeof soundUrls;

const audioContext = new AudioContext({ latencyHint: 'interactive' });
const masterGain = audioContext.createGain();
masterGain.connect(audioContext.destination);
const bufferCache = new Map<SoundEffect, AudioBuffer>();
const bufferLoads = new Map<SoundEffect, Promise<AudioBuffer>>();
const allEffects = Object.keys(soundUrls) as SoundEffect[];

const resumeAudioContext = () => {
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
};

window.addEventListener('pointerdown', resumeAudioContext);
window.addEventListener('keydown', resumeAudioContext);

async function loadBuffer(effect: SoundEffect) {
  const cached = bufferCache.get(effect);
  if (cached) return cached;
  const existing = bufferLoads.get(effect);
  if (existing) return existing;

  const loadPromise = fetch(soundUrls[effect])
    .then((res) => res.arrayBuffer())
    .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
    .then((buffer) => {
      bufferCache.set(effect, buffer);
      bufferLoads.delete(effect);
      return buffer;
    })
    .catch((error) => {
      bufferLoads.delete(effect);
      throw error;
    });

  bufferLoads.set(effect, loadPromise);
  return loadPromise;
}

for (const effect of allEffects) {
  loadBuffer(effect).catch(() => {});
}

export function playSound(effect: SoundEffect, options: { volume?: number } = {}) {
  const buffer = bufferCache.get(effect);
  if (!buffer) return loadBuffer(effect);
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  const gain = audioContext.createGain();
  gain.gain.value = options.volume ?? 1;
  source.connect(gain);
  gain.connect(masterGain);
  source.start();
}
