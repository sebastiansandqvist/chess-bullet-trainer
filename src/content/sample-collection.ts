import type { Collection, Scenario } from '../domain/types';
import { validateScenario } from '../domain/persistence';

export const builtinScenarios: Scenario[] = [
  {
    id: 'sample-convert-rook',
    name: 'Convert with seconds left',
    source: { kind: 'builtin', collectionId: 'time-scramble-basics', index: 0 },
    initialFen: '7k/8/8/8/8/8/5K2/6R1 w - - 0 1',
    traineeColor: 'white',
    orientation: 'white',
    whiteClockMs: 8_000,
    blackClockMs: 12_000,
    incrementMs: 0,
    engineMoveTimeMs: 700,
    goal: 'checkmate',
    context: 'Keep the rook safe and convert before your clock expires.',
  },
  {
    id: 'sample-defend',
    name: 'Defend the scramble',
    source: { kind: 'builtin', collectionId: 'time-scramble-basics', index: 1 },
    initialFen: '6k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1',
    traineeColor: 'white',
    orientation: 'white',
    whiteClockMs: 6_000,
    blackClockMs: 8_000,
    incrementMs: 0,
    engineMoveTimeMs: 500,
    goal: 'avoid_loss',
    context: 'The engine moves first. Survive or turn the tables.',
  },
  {
    id: 'sample-flag',
    name: 'Win the race',
    source: { kind: 'builtin', collectionId: 'time-scramble-basics', index: 2 },
    initialFen: '8/5pk1/6p1/7p/7P/6P1/5PK1/8 w - - 0 1',
    traineeColor: 'white',
    orientation: 'white',
    whiteClockMs: 3_500,
    blackClockMs: 2_500,
    incrementMs: 0,
    engineMoveTimeMs: 350,
    goal: 'flag_opponent',
    context: 'Use safe premoves to win on time.',
  },
];

export const builtinCollections: Collection[] = [
  {
    id: 'time-scramble-basics',
    name: 'Time scramble basics',
    description: 'A compact starter set for conversion, defense, and premoving.',
    scenarioIds: builtinScenarios.map((scenario) => scenario.id),
  },
];

if (!builtinScenarios.every(validateScenario)) {
  throw new Error('A built-in scenario is invalid.');
}
