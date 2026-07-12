import { describe, expect, test } from 'bun:test';
import { createClocks, flaggedColor, settleClocks, startClock, switchClock } from '../clocks';

describe('monotonic clocks', () => {
  test('settles elapsed time and applies increment to the mover', () => {
    const started = startClock(createClocks(5_000, 5_000), 'white', 100);
    const switched = switchClock(started, 'black', 1_000, 1_100);
    expect(switched.whiteMs).toBe(5_000);
    expect(settleClocks(switched, 2_100).blackMs).toBe(4_000);
  });

  test('detects a flag after a throttled interval', () => {
    const clocks = startClock(createClocks(500, 5_000), 'white', 0);
    expect(flaggedColor(clocks, 600)).toBe('white');
  });
});
