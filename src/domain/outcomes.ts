import { Chess } from 'chess.js';
import { hasMatingMaterial, oppositeColor } from './chess';
import type {
  ChessResult,
  Color,
  EndingReason,
  ScenarioGoal,
  SessionResult,
} from './types';

export function evaluateGoal(goal: ScenarioGoal, result: Omit<SessionResult, 'success'>, trainee: Color) {
  const traineeWon = result.winner === trainee;
  if (goal === 'win') return traineeWon;
  if (goal === 'draw') return result.chessResult === 'draw';
  if (goal === 'avoid_loss') return result.winner !== oppositeColor(trainee);
  if (goal === 'checkmate') return traineeWon && result.endingReason === 'checkmate';
  return traineeWon && result.endingReason === 'timeout';
}

export function detectTerminalPosition(game: Chess): {
  endingReason: EndingReason;
  winner: Color | null;
  chessResult: ChessResult;
} | null {
  if (game.isCheckmate()) {
    const winner = game.turn() === 'w' ? 'black' : 'white';
    return { endingReason: 'checkmate', winner, chessResult: winner };
  }
  if (game.isStalemate()) return { endingReason: 'stalemate', winner: null, chessResult: 'draw' };
  if (game.isThreefoldRepetition()) return { endingReason: 'repetition', winner: null, chessResult: 'draw' };
  if (game.isDrawByFiftyMoves()) return { endingReason: 'fifty_move', winner: null, chessResult: 'draw' };
  if (game.isInsufficientMaterial()) {
    return { endingReason: 'insufficient_material', winner: null, chessResult: 'draw' };
  }
  return null;
}

export function resolveTimeout(game: Chess, flagged: Color) {
  const opponent = oppositeColor(flagged);
  const winner = hasMatingMaterial(game, opponent) ? opponent : null;
  return {
    endingReason: 'timeout' as const,
    winner,
    chessResult: winner ?? ('draw' as const),
  };
}

export function buildSessionResult(
  base: Omit<SessionResult, 'success'>,
  goal: ScenarioGoal,
  trainee: Color,
): SessionResult {
  return { ...base, success: evaluateGoal(goal, base, trainee) };
}
