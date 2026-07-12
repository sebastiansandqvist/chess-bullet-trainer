import { describe, expect, test } from 'bun:test';
import { walkPgn } from '../../imports/pgn';

describe('PGN clock parsing', () => {
  test('assigns a clock comment to the side that just moved', () => {
    const game = walkPgn(`
[White "Alpha"]
[Black "Beta"]
[TimeControl "60+0"]

1. e4 { [%clk 0:00:59.9] } e5 { [%clk 0:00:59.8] } 2. Nf3 *
`);
    expect(game.plies[1]?.whiteClockMs).toBe(59_900);
    expect(game.plies[2]?.blackClockMs).toBe(59_800);
  });
});
