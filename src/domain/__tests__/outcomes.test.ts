import { describe, expect, test } from 'bun:test';
import { Chess } from 'chess.js';
import { evaluateGoal, resolveTimeout } from '../outcomes';

describe('scenario outcomes', () => {
  test('requires timeout for the flag goal', () => {
    const base = {
      chessResult: 'white' as const,
      winner: 'white' as const,
      endingReason: 'timeout' as const,
      whiteClockMs: 100,
      blackClockMs: 0,
    };
    expect(evaluateGoal('flag_opponent', base, 'white')).toBe(true);
    expect(evaluateGoal('checkmate', base, 'white')).toBe(false);
  });

  test('draws on time when the opponent has no mating material', () => {
    const game = new Chess('8/8/8/8/8/8/5k2/7K w - - 0 1');
    expect(resolveTimeout(game, 'white').chessResult).toBe('draw');
  });
});
