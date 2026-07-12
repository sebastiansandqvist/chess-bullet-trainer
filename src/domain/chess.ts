import { Chess, type Square } from 'chess.js';
import type { Color, PromotionPiece, RenderPiece, UciMove } from './types';

const files = 'abcdefgh';
const pieceTypes = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
} as const;

export const colorToTurn = (color: Color) => (color === 'white' ? 'w' : 'b');
export const turnToColor = (turn: 'w' | 'b'): Color => (turn === 'w' ? 'white' : 'black');
export const oppositeColor = (color: Color): Color => (color === 'white' ? 'black' : 'white');

export function squareName(rank: number, file: number) {
  return `${files[file - 1] ?? ''}${rank}`;
}

export function parseUciMove(value: string): UciMove | null {
  const match = /^([a-h][1-8])([a-h][1-8])([qrbn])?$/i.exec(value.trim());
  if (!match?.[1] || !match[2]) return null;
  return {
    from: match[1].toLowerCase(),
    to: match[2].toLowerCase(),
    promotion: match[3]?.toLowerCase() as PromotionPiece | undefined,
  };
}

export function toUci(move: UciMove) {
  return `${move.from}${move.to}${move.promotion ?? ''}`;
}

export function normalizeUciMove(game: Chess, value: string, preferPromotion: PromotionPiece = 'q') {
  const parsed = parseUciMove(value);
  if (!parsed) return null;
  const candidates = game
    .moves({ verbose: true })
    .filter((move) => move.from === parsed.from && move.to === parsed.to);
  if (candidates.length === 0) return null;
  const selected = parsed.promotion
    ? candidates.find((move) => move.promotion === parsed.promotion)
    : candidates.find((move) => move.promotion === preferPromotion) ?? candidates[0];
  if (!selected) return null;
  return `${selected.from}${selected.to}${selected.promotion ?? ''}`;
}

export function applyUciMove(game: Chess, value: string, preferPromotion: PromotionPiece = 'q') {
  const normalized = normalizeUciMove(game, value, preferPromotion);
  if (!normalized) return null;
  const parsed = parseUciMove(normalized);
  if (!parsed) return null;
  try {
    return game.move({
      from: parsed.from as Square,
      to: parsed.to as Square,
      promotion: parsed.promotion,
    });
  } catch {
    return null;
  }
}

export function validateFen(fen: string) {
  try {
    const game = new Chess(fen.trim());
    const kings = game
      .board()
      .flat()
      .filter((piece) => piece?.type === 'k');
    if (kings.length !== 2) return { valid: false, error: 'Position must contain both kings.' };
    return { valid: true, fen: game.fen() };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Invalid FEN.' };
  }
}

export function boardToPieces(board: ReturnType<Chess['board']>): RenderPiece[] {
  const pieces: RenderPiece[] = [];
  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row]?.[col];
      if (!piece) continue;
      pieces.push({
        square: piece.square,
        rank: 8 - row,
        file: col + 1,
        type: pieceTypes[piece.type],
        color: turnToColor(piece.color),
      });
    }
  }
  return pieces;
}

export function hasMatingMaterial(game: Chess, color: Color) {
  const own = game
    .board()
    .flat()
    .filter((piece) => piece?.color === colorToTurn(color));
  if (own.some((piece) => piece && ['p', 'r', 'q'].includes(piece.type))) return true;
  const bishops = own.filter((piece) => piece?.type === 'b').length;
  const knights = own.filter((piece) => piece?.type === 'n').length;
  return bishops >= 2 || (bishops >= 1 && knights >= 1) || knights >= 2;
}
