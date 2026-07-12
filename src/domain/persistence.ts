import { validateFen } from './chess';
import type { AttemptRecord, Preferences, Scenario } from './types';

const keys = {
  preferences: 'bullet-trainer:preferences:v2',
  scenarios: 'bullet-trainer:scenarios:v2',
  attempts: 'bullet-trainer:attempts:v2',
} as const;
const attemptLimit = 12;
const schemaVersion = 2;

export const defaultPreferences: Preferences = {
  sound: true,
  legalMoveDots: false,
  autoQueen: true,
  chesscomUsername: '',
  lichessUsername: '',
  lastSetup: {
    traineeColor: 'white',
    whiteClockMs: 10_000,
    blackClockMs: 10_000,
    incrementMs: 0,
    engineMoveTimeMs: 2_000,
    goal: 'win',
  },
};

function storage() {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

function readJson(key: string): unknown {
  try {
    const value = storage()?.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function unwrap(value: unknown) {
  if (
    value &&
    typeof value === 'object' &&
    'version' in value &&
    'data' in value &&
    (value as { version?: unknown }).version === schemaVersion
  ) {
    return (value as { data: unknown }).data;
  }
  return value;
}

function writeJson(key: string, data: unknown) {
  storage()?.setItem(key, JSON.stringify({ version: schemaVersion, data }));
}

export function migratePreferences(value: unknown): Preferences {
  value = unwrap(value);
  if (!value || typeof value !== 'object') return structuredClone(defaultPreferences);
  const saved = value as Partial<Preferences>;
  return {
    ...defaultPreferences,
    ...saved,
    lastSetup: { ...defaultPreferences.lastSetup, ...(saved.lastSetup ?? {}) },
  };
}

export function loadPreferences(): Preferences {
  return migratePreferences(readJson(keys.preferences));
}

export function savePreferences(preferences: Preferences) {
  writeJson(keys.preferences, preferences);
}

export function validateScenario(value: unknown): value is Scenario {
  if (!value || typeof value !== 'object') return false;
  const scenario = value as Partial<Scenario>;
  return (
    typeof scenario.id === 'string' &&
    typeof scenario.name === 'string' &&
    typeof scenario.initialFen === 'string' &&
    validateFen(scenario.initialFen).valid &&
    (scenario.traineeColor === 'white' || scenario.traineeColor === 'black') &&
    (scenario.orientation === 'white' || scenario.orientation === 'black') &&
    typeof scenario.whiteClockMs === 'number' &&
    Number.isFinite(scenario.whiteClockMs) &&
    scenario.whiteClockMs >= 0 &&
    typeof scenario.blackClockMs === 'number' &&
    Number.isFinite(scenario.blackClockMs) &&
    scenario.blackClockMs >= 0 &&
    typeof scenario.incrementMs === 'number' &&
    typeof scenario.engineMoveTimeMs === 'number' &&
    ['win', 'draw', 'avoid_loss', 'checkmate', 'flag_opponent'].includes(scenario.goal ?? '')
  );
}

export function loadCustomScenarios() {
  const value = unwrap(readJson(keys.scenarios));
  return Array.isArray(value) ? value.filter(validateScenario) : [];
}

export function saveCustomScenario(scenario: Scenario) {
  const scenarios = loadCustomScenarios().filter((item) => item.id !== scenario.id);
  scenarios.push(scenario);
  writeJson(keys.scenarios, scenarios);
  return scenarios;
}

export function deleteCustomScenario(id: string) {
  const scenarios = loadCustomScenarios().filter((item) => item.id !== id);
  writeJson(keys.scenarios, scenarios);
  return scenarios;
}

export function loadAttempts(): AttemptRecord[] {
  const value = unwrap(readJson(keys.attempts));
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is AttemptRecord => {
    if (!item || typeof item !== 'object') return false;
    const attempt = item as Partial<AttemptRecord>;
    return (
      typeof attempt.scenarioId === 'string' &&
      typeof attempt.attemptedAt === 'string' &&
      typeof attempt.success === 'boolean'
    );
  });
}

export function saveAttempt(record: AttemptRecord) {
  const attempts = [record, ...loadAttempts()];
  const counts = new Map<string, number>();
  const bounded = attempts.filter((attempt) => {
    const count = counts.get(attempt.scenarioId) ?? 0;
    if (count >= attemptLimit) return false;
    counts.set(attempt.scenarioId, count + 1);
    return true;
  });
  writeJson(keys.attempts, bounded);
}

export function progressForScenario(scenarioId: string) {
  const recent = loadAttempts().filter((attempt) => attempt.scenarioId === scenarioId);
  return {
    recent,
    status: recent.some((attempt) => attempt.success)
      ? ('completed' as const)
      : recent.length > 0
        ? ('attempted' as const)
        : ('unattempted' as const),
  };
}
