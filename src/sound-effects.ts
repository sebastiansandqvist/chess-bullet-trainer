const soundUrls = {
  capture: new URL('./sounds/capture.mp3', import.meta.url).href,
  'cursor-move': new URL('./sounds/cursor-move.mp3', import.meta.url).href,
  move: new URL('./sounds/move.mp3', import.meta.url).href,
  promote: new URL('./sounds/promote.mp3', import.meta.url).href,
} as const;

export type SoundEffect = keyof typeof soundUrls;

export function playSound(effect: SoundEffect, options: { volume?: number } = {}) {
  const audio = new Audio(soundUrls[effect]);
  audio.volume = options.volume ?? 1;
  void audio.play();
}
