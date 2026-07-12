export type { ImportedGame, ImportedGameDetail, ImportedPly } from '../domain/types';

export function parseTimeControl(value?: string) {
  if (!value) return { initialMs: undefined, incrementMs: 0 };
  const daily = /^1\/(\d+)$/.exec(value);
  if (daily?.[1]) {
    return { initialMs: Number(daily[1]) * 1_000, incrementMs: 0 };
  }
  const [initialRaw, incrementRaw] = value.split('+');
  const initial = Number(initialRaw);
  const increment = Number(incrementRaw ?? 0);
  return {
    initialMs: Number.isFinite(initial) ? initial * 1_000 : undefined,
    incrementMs: Number.isFinite(increment) ? increment * 1_000 : 0,
  };
}

export function onlineError(error: unknown) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return new Error('Game imports require an internet connection.');
  }
  return error instanceof Error ? error : new Error('The game provider request failed.');
}
