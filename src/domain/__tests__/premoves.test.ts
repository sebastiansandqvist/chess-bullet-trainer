import { describe, expect, test } from 'bun:test';
import { Chess } from 'chess.js';
import type { Premove } from '../types';
import { PREMOVE_LIMIT, queuePremove, takeNextExecutablePremove } from '../premoves';

describe('premoves', () => {
  test('limits the queue to five moves', () => {
    let queue: Premove[] = [];
    for (let index = 0; index < PREMOVE_LIMIT + 2; index += 1) {
      queue = queuePremove(queue, { from: 'e2', to: 'e4' });
    }
    expect(queue).toHaveLength(PREMOVE_LIMIT);
  });

  test('cancels the remaining queue when the next move is illegal', () => {
    const queue = queuePremove([], { from: 'e2', to: 'e5' });
    const result = takeNextExecutablePremove(new Chess(), queue, 'white');
    expect(result.move).toBeNull();
    expect(result.remaining).toHaveLength(0);
  });
});
