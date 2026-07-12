import type { Color } from './types';

export type ClockState = {
  whiteMs: number;
  blackMs: number;
  running: Color | null;
  settledAt: number | null;
};

export const createClocks = (whiteMs: number, blackMs: number): ClockState => ({
  whiteMs: Math.max(0, whiteMs),
  blackMs: Math.max(0, blackMs),
  running: null,
  settledAt: null,
});

export function settleClocks(clocks: ClockState, now: number): ClockState {
  if (!clocks.running || clocks.settledAt === null) return clocks;
  const elapsed = Math.max(0, now - clocks.settledAt);
  return clocks.running === 'white'
    ? { ...clocks, whiteMs: Math.max(0, clocks.whiteMs - elapsed), settledAt: now }
    : { ...clocks, blackMs: Math.max(0, clocks.blackMs - elapsed), settledAt: now };
}

export function startClock(clocks: ClockState, color: Color, now: number): ClockState {
  const settled = settleClocks(clocks, now);
  return { ...settled, running: color, settledAt: now };
}

export function stopClocks(clocks: ClockState, now: number): ClockState {
  return { ...settleClocks(clocks, now), running: null, settledAt: null };
}

export function switchClock(clocks: ClockState, next: Color, incrementMs: number, now: number): ClockState {
  const settled = settleClocks(clocks, now);
  const moved = settled.running;
  const increment = Math.max(0, incrementMs);
  return {
    ...settled,
    whiteMs: settled.whiteMs + (moved === 'white' ? increment : 0),
    blackMs: settled.blackMs + (moved === 'black' ? increment : 0),
    running: next,
    settledAt: now,
  };
}

export function chargePremoveCost(clocks: ClockState, color: Color, costMs: number, now: number) {
  const settled = settleClocks(clocks, now);
  return {
    ...settled,
    whiteMs: Math.max(0, settled.whiteMs - (color === 'white' ? costMs : 0)),
    blackMs: Math.max(0, settled.blackMs - (color === 'black' ? costMs : 0)),
  };
}

export function flaggedColor(clocks: ClockState, now: number): Color | null {
  const settled = settleClocks(clocks, now);
  if (settled.whiteMs <= 0) return 'white';
  if (settled.blackMs <= 0) return 'black';
  return null;
}

export function clockValue(clocks: ClockState, color: Color, now: number) {
  const settled = settleClocks(clocks, now);
  return color === 'white' ? settled.whiteMs : settled.blackMs;
}

export function formatClock(milliseconds: number) {
  const value = Math.max(0, milliseconds);
  if (value < 10_000) return `${(value / 1_000).toFixed(1)}`;
  const totalSeconds = Math.ceil(value / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(totalSeconds % 60).padStart(2, '0')}`;
}
