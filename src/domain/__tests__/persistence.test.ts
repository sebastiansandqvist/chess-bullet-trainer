import { describe, expect, test } from 'bun:test';
import { migratePreferences } from '../persistence';

describe('preference migration', () => {
  test('fills new defaults around an older partial record', () => {
    const migrated = migratePreferences({
      sound: false,
      lastSetup: { whiteClockMs: 3_000 },
    });
    expect(migrated.sound).toBe(false);
    expect(migrated.autoQueen).toBe(true);
    expect(migrated.lastSetup.whiteClockMs).toBe(3_000);
    expect(migrated.lastSetup.blackClockMs).toBe(10_000);
  });
});
