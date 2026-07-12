import { Chess, type Square } from 'chess.js';
import { normalizeUciMove, oppositeColor, toUci, turnToColor } from './chess';
import type { Color, Premove, UciMove } from './types';

export const PREMOVE_LIMIT = 5;
export const PREMOVE_COST_MS = 100;

export function queuePremove(queue: Premove[], move: UciMove) {
  if (queue.length >= PREMOVE_LIMIT) return queue;
  return [...queue, { ...move, id: crypto.randomUUID() }];
}

export const cancelPremoves = () => [] as Premove[];

function destinationShapeLegal(
  piece: { type: string; color: 'w' | 'b' } | undefined,
  move: UciMove,
  color: Color,
) {
  if (!piece || turnToColor(piece.color) !== color || move.from === move.to) return false;
  const fromFile = move.from.charCodeAt(0) - 97;
  const toFile = move.to.charCodeAt(0) - 97;
  const fromRank = Number(move.from[1]);
  const toRank = Number(move.to[1]);
  const dx = Math.abs(toFile - fromFile);
  const dy = Math.abs(toRank - fromRank);
  if (piece.type === 'n') return (dx === 1 && dy === 2) || (dx === 2 && dy === 1);
  if (piece.type === 'b') return dx === dy;
  if (piece.type === 'r') return dx === 0 || dy === 0;
  if (piece.type === 'q') return dx === dy || dx === 0 || dy === 0;
  if (piece.type === 'k') return dx <= 2 && dy <= 1;
  const direction = color === 'white' ? 1 : -1;
  const advance = toRank - fromRank;
  const startingRank = color === 'white' ? 2 : 7;
  return (
    (dx === 0 && (advance === direction || (fromRank === startingRank && advance === direction * 2))) ||
    (dx === 1 && advance === direction)
  );
}

export function isPremoveShapeLegal(
  game: Chess,
  move: UciMove,
  color: Color,
  queue: Premove[] = [],
) {
  const piece = queue.length > 0
    ? projectPremoves(game, color, queue).get(move.from as Square)
    : game.get(move.from as Square);
  return destinationShapeLegal(piece, move, color);
}

export function projectPremoves(game: Chess, color: Color, queue: Premove[]) {
  const pieces = new Map(
    game
      .board()
      .flat()
      .filter(Boolean)
      .map((piece) => [piece!.square, { ...piece! }]),
  );
  for (const move of queue) {
    const piece = pieces.get(move.from as Square);
    if (!piece || turnToColor(piece.color) !== color) break;
    pieces.delete(move.from as Square);
    pieces.delete(move.to as Square);
    pieces.set(move.to as Square, { ...piece, square: move.to as Square });
  }
  return pieces;
}

export function takeNextExecutablePremove(game: Chess, queue: Premove[], color: Color) {
  const [next, ...remaining] = queue;
  if (!next || turnToColor(game.turn()) !== color) return { move: null, remaining: queue };
  const normalized = normalizeUciMove(game, toUci(next), next.promotion ?? 'q');
  return normalized
    ? { move: normalized, remaining }
    : { move: null, remaining: [] as Premove[] };
}

export function premoveColor(game: Chess) {
  return oppositeColor(turnToColor(game.turn()));
}
