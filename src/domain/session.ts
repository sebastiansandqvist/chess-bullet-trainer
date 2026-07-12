import { Chess } from 'chess.js';
import { applyUciMove, parseUciMove, toUci, turnToColor } from './chess';
import {
  chargePremoveCost,
  createClocks,
  flaggedColor,
  settleClocks,
  startClock,
  stopClocks,
  switchClock,
  type ClockState,
} from './clocks';
import { buildSessionResult, detectTerminalPosition, resolveTimeout } from './outcomes';
import { PREMOVE_COST_MS, queuePremove, takeNextExecutablePremove } from './premoves';
import type { MoveRecord, Premove, Scenario, SessionResult, UciMove } from './types';

export type SessionPhase =
  | 'countdown'
  | 'player_turn'
  | 'engine_thinking'
  | 'finished'
  | 'error';

export type Session = {
  id: string;
  scenario: Scenario;
  game: Chess;
  phase: SessionPhase;
  countdownUntil: number | null;
  clocks: ClockState;
  moves: MoveRecord[];
  premoves: Premove[];
  searchId: number;
  activeSearchId: number | null;
  result: SessionResult | null;
  createdAt: number;
  lastMoveAt: number;
  error: string | null;
};

function finish(
  session: Session,
  base: Omit<SessionResult, 'success' | 'whiteClockMs' | 'blackClockMs'>,
  now: number,
): Session {
  const clocks = stopClocks(session.clocks, now);
  return {
    ...session,
    phase: 'finished' as const,
    clocks,
    premoves: [],
    activeSearchId: null,
    result: buildSessionResult(
      { ...base, whiteClockMs: clocks.whiteMs, blackClockMs: clocks.blackMs },
      session.scenario.goal,
      session.scenario.traineeColor,
    ),
  };
}

function finishIfTerminal(session: Session, now: number) {
  const terminal = detectTerminalPosition(session.game);
  return terminal ? finish(session, terminal, now) : session;
}

function finishIfFlagged(session: Session, now: number) {
  const flagged = flaggedColor(session.clocks, now);
  return flagged ? finish(session, resolveTimeout(session.game, flagged), now) : session;
}

function nextEngineSearch(session: Session) {
  const searchId = session.searchId + 1;
  return {
    ...session,
    phase: 'engine_thinking' as const,
    searchId,
    activeSearchId: searchId,
  };
}

export function createSession(scenario: Scenario, now: number): Session {
  const game = new Chess(scenario.initialFen);
  const traineeTurn = turnToColor(game.turn()) === scenario.traineeColor;
  const clocks = createClocks(scenario.whiteClockMs, scenario.blackClockMs);
  return {
    id: crypto.randomUUID(),
    scenario,
    game,
    phase: traineeTurn ? 'player_turn' : 'countdown',
    countdownUntil: traineeTurn ? null : now + 1_500,
    clocks: traineeTurn ? startClock(clocks, scenario.traineeColor, now) : clocks,
    moves: [],
    premoves: [],
    searchId: 0,
    activeSearchId: null,
    result: null,
    createdAt: now,
    lastMoveAt: now,
    error: null,
  };
}

export function tickSession(session: Session, now: number): Session {
  if (session.phase === 'finished' || session.phase === 'error') return session;
  if (session.phase === 'countdown' && session.countdownUntil !== null && now >= session.countdownUntil) {
    const engineColor = turnToColor(session.game.turn());
    return nextEngineSearch({
      ...session,
      countdownUntil: null,
      clocks: startClock(session.clocks, engineColor, now),
    });
  }
  return finishIfFlagged({ ...session, clocks: settleClocks(session.clocks, now) }, now);
}

function recordMove(
  session: Session,
  move: NonNullable<ReturnType<typeof applyUciMove>>,
  uci: string,
  now: number,
  premoved: boolean,
) {
  const color = turnToColor(move.color);
  return {
    ...session,
    moves: [
      ...session.moves,
      {
        uci,
        san: move.san,
        color,
        playedAt: now,
        elapsedMs: Math.max(0, now - session.lastMoveAt),
        whiteClockMs: session.clocks.whiteMs,
        blackClockMs: session.clocks.blackMs,
        premoved,
        capture: move.isCapture(),
        promotion: Boolean(move.promotion),
      },
    ],
    lastMoveAt: now,
  };
}

export function commitPlayerMove(
  session: Session,
  move: UciMove,
  now: number,
  options: { premoved?: boolean } = {},
) {
  if (session.phase !== 'player_turn') return session;
  let next = finishIfFlagged(session, now);
  if (next.phase === 'finished') return next;
  const applied = applyUciMove(next.game, toUci(move), move.promotion ?? 'q');
  if (!applied) return session;
  next = {
    ...next,
    clocks: switchClock(next.clocks, turnToColor(next.game.turn()), next.scenario.incrementMs, now),
  };
  next = recordMove(next, applied, toUci(move), now, options.premoved ?? false);
  next = finishIfTerminal(next, now);
  return next.phase === 'finished' ? next : nextEngineSearch(next);
}

export function enqueuePremove(session: Session, move: UciMove) {
  if (session.phase !== 'engine_thinking') return session;
  return { ...session, premoves: queuePremove(session.premoves, move) };
}

export function clearPremoves(session: Session) {
  return { ...session, premoves: [] };
}

export function applyEngineMove(session: Session, uci: string, searchId: number, now: number): Session {
  if (session.phase !== 'engine_thinking' || session.activeSearchId !== searchId) {
    return session;
  }
  if (!parseUciMove(uci)) {
    return engineFailed(session, 'Stockfish did not return a legal move.', now);
  }
  let next = finishIfFlagged(session, now);
  if (next.phase === 'finished') return next;
  const applied = applyUciMove(next.game, uci);
  if (!applied) return engineFailed(next, 'Stockfish returned an illegal move.', now);
  next = {
    ...next,
    activeSearchId: null,
    clocks: switchClock(next.clocks, turnToColor(next.game.turn()), next.scenario.incrementMs, now),
  };
  next = recordMove(next, applied, uci, now, false);
  next = finishIfTerminal(next, now);
  if (next.phase === 'finished') return next;

  const resolved = takeNextExecutablePremove(
    next.game,
    next.premoves,
    next.scenario.traineeColor,
  );
  if (!resolved.move) {
    return { ...next, phase: 'player_turn', premoves: resolved.remaining };
  }

  next = {
    ...next,
    phase: 'player_turn',
    premoves: resolved.remaining,
    clocks: chargePremoveCost(next.clocks, next.scenario.traineeColor, PREMOVE_COST_MS, now),
  };
  const parsed = parseUciMove(resolved.move);
  return parsed ? commitPlayerMove(next, parsed, now, { premoved: true }) : next;
}

export function resignSession(session: Session, now: number) {
  if (session.phase === 'finished') return session;
  const winner = session.scenario.traineeColor === 'white' ? 'black' : 'white';
  return finish(session, { endingReason: 'resignation', winner, chessResult: winner }, now);
}

export function engineFailed(session: Session, message: string, now: number): Session {
  const failed = finish(
    session,
    { endingReason: 'engine_error', winner: null, chessResult: 'draw' },
    now,
  );
  return { ...failed, phase: 'error' as const, error: message };
}
